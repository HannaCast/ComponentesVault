from typing import Optional

from user_accounts.models import UserConfiguration


def get_selected_university_id_by_user_id(user_id: int) -> Optional[int]:
    """
    Retorna el id de universidad seleccionada para un usuario.

    Busca en user_configurations la configuracion mas reciente del usuario.
    """
    user_config = (
        UserConfiguration.objects
        .filter(user_id=user_id)
        .order_by('-id')
        .first()
    )

    if not user_config or not user_config.selected_university_id:
        return None

    return user_config.selected_university_id


def get_selected_university_id_from_request(request) -> Optional[int]:
    """
    Retorna el id de universidad seleccionada usando el usuario autenticado.

    El usuario autenticado proviene del token JWT validado por DRF/SimpleJWT.
    """
    user = getattr(request, 'user', None)
    if not user or not user.is_authenticated:
        return None

    return get_selected_university_id_by_user_id(user.id)
