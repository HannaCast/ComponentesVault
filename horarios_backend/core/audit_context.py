from contextlib import contextmanager
from functools import wraps
from uuid import uuid4

from django.db import connection


_ALLOWED_SCOPED_ACTIONS = frozenset({'CHANGE_STATUS'})
_ALLOWED_AUDIT_ACTIONS = frozenset({'CREATE', 'UPDATE', 'DELETE', 'INSERT', 'CHANGE_STATUS'})


def _get_client_ip(request):
    forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR', '')
    if forwarded_for:
        return forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def _normalize_scoped_action(action):
    if not isinstance(action, str):
        raise ValueError('action debe ser string')

    normalized = action.strip().upper()

    if normalized not in _ALLOWED_SCOPED_ACTIONS:
        raise ValueError('action invalida. Usa CHANGE_STATUS')

    return normalized


def _normalize_method_action(request_method):
    method = (request_method or '').upper()

    if method == 'POST':
        return 'INSERT'
    if method == 'DELETE':
        return 'DELETE'

    return 'UPDATE'


def _resolve_table_name(request, view_instance, explicit_table_name=None):
    if explicit_table_name:
        return explicit_table_name

    resolver_match = getattr(request, 'resolver_match', None)
    if resolver_match and resolver_match.url_name:
        return resolver_match.url_name

    return view_instance.__class__.__name__


def _resolve_error_action(request):
    default_action = _normalize_method_action(getattr(request, 'method', None))

    scoped_action = None
    if connection.connection is not None:
        with connection.cursor() as cursor:
            cursor.execute('SELECT COALESCE(@app_last_action, @app_action)')
            row = cursor.fetchone()
            if row:
                scoped_action = row[0]

    if isinstance(scoped_action, str):
        normalized = scoped_action.strip().upper()
        if normalized in _ALLOWED_AUDIT_ACTIONS:
            return normalized

    return default_action


def _extract_response_error_message(response):
    status_code = getattr(response, 'status_code', None)
    if status_code is None or status_code < 400:
        return None

    data = getattr(response, 'data', None)

    if isinstance(data, dict):
        message = data.get('message') or data.get('detail')
        if message:
            return f'HTTP {status_code}: {message}'
        return f'HTTP {status_code}: {data}'

    if data is not None:
        return f'HTTP {status_code}: {data}'

    return f'HTTP {status_code}'


def _insert_failed_audit_log(
    request,
    view_instance,
    kwargs,
    user_id,
    username,
    transaction_id,
    error_message,
    explicit_table_name=None,
):
    if connection.connection is None:
        return

    action = _resolve_error_action(request)
    table_name = _resolve_table_name(request, view_instance, explicit_table_name)

    record_id = kwargs.get('pk')
    try:
        record_id = int(record_id)
    except (TypeError, ValueError):
        record_id = None

    with connection.cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO audit_logs (
              user_id,
              username,
              source,
              transaction_id,
              table_name,
              record_id,
              action,
              old_data,
              new_data,
              ip_address,
              user_agent,
              is_succesfull,
              error_message,
              created_at
            )
            VALUES (
              %s,
              %s,
              'APPLICATION',
              %s,
              %s,
              %s,
              %s,
              JSON_OBJECT(),
              JSON_OBJECT('method', %s, 'path', %s, 'view', %s),
              %s,
              %s,
              0,
              %s,
              NOW()
            )
            """,
            [
                user_id,
                username,
                transaction_id,
                table_name,
                record_id,
                action,
                getattr(request, 'method', None),
                getattr(request, 'path', None),
                view_instance.__class__.__name__,
                _get_client_ip(request),
                request.META.get('HTTP_USER_AGENT'),
                error_message,
            ],
        )


def with_audit_context(action=None, table_name=None):
    """Setea variables de sesion MySQL y registra errores de aplicacion en audit_logs."""

    if action is not None:
        raise ValueError(
            "with_audit_context no acepta action. "
            "Usa with_audit_action('CHANGE_STATUS') en el bloque puntual."
        )

    if table_name is not None and not isinstance(table_name, str):
        raise ValueError('table_name debe ser string')

    normalized_table_name = table_name.strip() if isinstance(table_name, str) else None
    normalized_table_name = normalized_table_name or None

    def decorator(func):
        @wraps(func)
        def wrapper(self, request, *args, **kwargs):
            if connection.vendor != 'mysql':
                return func(self, request, *args, **kwargs)

            user = getattr(request, 'user', None)
            is_authenticated = bool(user and getattr(user, 'is_authenticated', False))

            user_id = user.pk if is_authenticated else None
            username = None
            if is_authenticated:
                username = (
                    getattr(user, 'email', None)
                    or getattr(user, 'username', None)
                    or str(user.pk)
                )

            transaction_id = str(uuid4())

            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SET
                      @app_user_id = %s,
                      @app_username = %s,
                      @app_ip = %s,
                      @app_user_agent = %s,
                      @app_transaction_id = %s,
                      @app_action = %s,
                      @app_last_action = %s
                    """,
                    [
                        user_id,
                        username,
                        _get_client_ip(request),
                        request.META.get('HTTP_USER_AGENT'),
                        transaction_id,
                        None,
                        None,
                    ],
                )

            try:
                response = func(self, request, *args, **kwargs)

                response_error_message = _extract_response_error_message(response)
                if response_error_message:
                    try:
                        _insert_failed_audit_log(
                            request=request,
                            view_instance=self,
                            kwargs=kwargs,
                            user_id=user_id,
                            username=username,
                            transaction_id=transaction_id,
                            error_message=response_error_message,
                            explicit_table_name=normalized_table_name,
                        )
                    except Exception:
                        pass

                return response
            except Exception as exc:
                try:
                    _insert_failed_audit_log(
                        request=request,
                        view_instance=self,
                        kwargs=kwargs,
                        user_id=user_id,
                        username=username,
                        transaction_id=transaction_id,
                        error_message=f'{type(exc).__name__}: {exc}',
                        explicit_table_name=normalized_table_name,
                    )
                except Exception:
                    # No ocultar el error principal si falla la escritura de auditoria.
                    pass

                raise
            finally:
                if connection.connection is not None:
                    with connection.cursor() as cursor:
                        cursor.execute(
                            """
                            SET
                            @app_user_id = NULL,
                            @app_username = NULL,
                            @app_ip = NULL,
                            @app_user_agent = NULL,
                            @app_transaction_id = NULL,
                            @app_action = NULL,
                            @app_last_action = NULL
                            """
                        )

        return wrapper

    return decorator


@contextmanager
def with_audit_action(action):
    """Setea @app_action de forma acotada para una operacion puntual."""
    if connection.vendor != 'mysql':
        yield
        return

    normalized_action = _normalize_scoped_action(action)

    with connection.cursor() as cursor:
        cursor.execute(
            'SET @app_action = %s, @app_last_action = %s',
            [normalized_action, normalized_action],
        )

    try:
        yield
    finally:
        if connection.connection is not None:
            with connection.cursor() as cursor:
                cursor.execute('SET @app_action = NULL')
