from core.email_service import build_frontend_url, send_templated_email


_EMAIL_TEMPLATE_CONFIG = {
    'account_verification': {
        'subject': 'Verifica tu cuenta de EduSchedule',
        'html_template': 'emails/verification_account.html',
        'error_message': 'No fue posible enviar el correo de verificacion',
    }
}


def _build_verification_url(token: str) -> str:
    """Build account verification URL from LINK_FRONTEND + written path."""
    return build_frontend_url('/verificar-cuenta', {'token': token})


def send_auth_email(
    *,
    template_key: str,
    to_email: str,
    context: dict,
    subject: str | None = None,
    throw_error: bool = True,
    error_message: str | None = None,
) -> bool:
    """Send an auth email choosing template by template key."""
    template_config = _EMAIL_TEMPLATE_CONFIG.get(template_key)
    if not template_config:
        raise ValueError(f'Unsupported email template: {template_key}')

    return send_templated_email(
        subject=subject or template_config['subject'],
        recipients=[to_email],
        html_template=template_config['html_template'],
        context=context,
        throw_error=throw_error,
        error_message=error_message or template_config['error_message'],
    )


def send_account_verification_email(*, user, token: str, expires_at, throw_error: bool = True) -> bool:
    """Send account verification email using themed auth template."""
    verification_url = _build_verification_url(token)

    context = {
        'verification_url': verification_url,
        'expires_at': expires_at,
    }

    return send_auth_email(
        template_key='account_verification',
        to_email=user.email,
        context=context,
        throw_error=throw_error,
    )
