from user_accounts.views.auth import (
	LoginView,
	RegisterView,
	RegisterAdminView,
	VerifyAccountView,
	LogoutView,
	RefreshView,
)
from user_accounts.views.dashboard import UniversityDashboardSummaryView
from user_accounts.views.user import MeView, ConfigurationView, SelectedUniversityConfigurationView
