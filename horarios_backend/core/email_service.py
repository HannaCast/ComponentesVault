from django.conf import settings
from django.core.mail import EmailMessage
from django.template.loader import render_to_string
from loguru import logger
from urllib.parse import urlencode


class EmailDeliveryError(Exception):
    """Raised when an email cannot be delivered."""


def build_frontend_url(path: str, query_params: dict | None = None) -> str:
    """Build a frontend URL from LINK_FRONTEND and a hardcoded path."""
    base_url = str(getattr(settings, 'LINK_FRONTEND', '') or '').strip().rstrip('/')
    if not base_url:
        return ''

    normalized_path = f"/{path.lstrip('/')}"
    query_string = urlencode(query_params or {})
    return f'{base_url}{normalized_path}?{query_string}' if query_string else f'{base_url}{normalized_path}'


def send_templated_email(
    *,
    subject: str,
    recipients,
    html_template: str,
    context: dict,
    from_email: str | None = None,
    error_message: str = 'No fue posible enviar el correo',
    throw_error: bool = True,
) -> bool:
    """Render and send an HTML-only email from a Django template."""
    if isinstance(recipients, str):
        recipient_list = [recipients]
    else:
        recipient_list = [email for email in (recipients or []) if email]

    if not recipient_list:
        raise ValueError('At least one recipient email is required')

    html_content = render_to_string(html_template, context)

    message = EmailMessage(
        subject=subject,
        body=html_content,
        from_email=from_email or settings.DEFAULT_FROM_EMAIL,
        to=recipient_list,
    )
    message.content_subtype = 'html'

    try:
        message.send(fail_silently=False)
        return True
    except Exception as exc:
        logger.exception(
            "Email delivery failed. subject='{}' recipients={} template='{}'",
            subject,
            recipient_list,
            html_template,
        )
        if throw_error:
            raise EmailDeliveryError(error_message) from exc
        return False
