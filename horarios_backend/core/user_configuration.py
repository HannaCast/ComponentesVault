from typing import Optional

from user_accounts.models import UserConfiguration


_DEFAULT_SELECTED_UNIVERSITY_ERROR = 'Debe tener universidad seleccionada primero'


def get_selected_university_id_by_user_id(user_id: int) -> Optional[int]:
    """
    Retorna el id de universidad seleccionada para un usuario.

    Busca en user_configurations la configuracion mas reciente del usuario.
    """
    user_config = (
        UserConfiguration.objects
        .filter(user_id=user_id)
        .select_related('selected_university')
        .order_by('-id')
        .first()
    )

    if not user_config or not user_config.selected_university_id:
        return None

    selected_university = user_config.selected_university
    if (
        selected_university is None
        or selected_university.user_id != user_id
        or selected_university.status != 1
        or selected_university.is_deleted != 0
    ):
        return None

    return user_config.selected_university_id


def get_selected_university_id_from_request(
    request,
    raise_error: bool = False,
    error_message: str = _DEFAULT_SELECTED_UNIVERSITY_ERROR,
) -> Optional[int]:
    """
    Retorna el id de universidad seleccionada usando el usuario autenticado.

    El usuario autenticado proviene del token JWT validado por DRF/SimpleJWT.
    """
    user = getattr(request, 'user', None)
    if not user or not user.is_authenticated:
        if raise_error:
            raise ValueError(error_message)
        return None

    selected_university_id = get_selected_university_id_by_user_id(user.id)
    if not selected_university_id and raise_error:
        raise ValueError(error_message)

    return selected_university_id
