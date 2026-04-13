import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import { AuthTopBar } from '../components/AuthTopBar';
import { useRegister } from '../hooks/useRegister';
import Input from '@shared/components/inputs/InputText';
import { ActionButton } from '@shared/components/inputs/ActionButton';
import { PasswordRequirementsChecklist } from '../../user/features/settings/components/PasswordRequirementsChecklist';
import {
  arePasswordRequirementsMet,
  evaluatePasswordRequirements,
} from '../../user/features/settings/validations/accountSettingsValidationSchema';

const installRegisterFonts = () => {
  const fontLinks = [
    {
      id: 'register-google-fonts-main',
      href: 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap'
    },
    {
      id: 'register-google-fonts-material',
      href: 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap'
    }
  ];

  fontLinks.forEach((linkData) => {
    if (!document.getElementById(linkData.id)) {
      const link = document.createElement('link');
      link.id = linkData.id;
      link.rel = 'stylesheet';
      link.href = linkData.href;
      document.head.appendChild(link);
    }
  });

  if (!document.getElementById('register-material-symbols-style')) {
    const style = document.createElement('style');
    style.id = 'register-material-symbols-style';
    style.textContent = `.material-symbols-outlined {
      font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
    }`;
    document.head.appendChild(style);
  }
};

const applySystemThemeToRoot = () => {
  const root = document.documentElement;
  root.dataset.theme = 'light';
  root.dataset.themeMode = 'light';
  root.dataset.systemTheme = 'academic';
};

const INITIAL_FORM_DATA = {
  name: '',
  surname: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
};

const hasBasicRequiredFields = (formData) =>
  Boolean(
    formData.name.trim()
    && formData.surname.trim()
    && formData.email.trim()
    && formData.password
    && formData.confirmPassword
  );

const INPUT_LABEL_STYLE = {
  fontFamily: 'Manrope, sans-serif',
};

export const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [formErrors, setFormErrors] = useState({});
  const [accountCreated, setAccountCreated] = useState(false);
  const [createdEmail, setCreatedEmail] = useState('');
  const { loading, error, setError, registerUser } = useRegister();

  useEffect(() => {
    installRegisterFonts();
    applySystemThemeToRoot();

    return () => {
      delete document.documentElement.dataset.systemTheme;
    };
  }, []);

  const requirements = useMemo(() => {
    return evaluatePasswordRequirements({
      newPassword: formData.password,
    });
  }, [formData.password]);

  const areRequirementsMet = arePasswordRequirementsMet(requirements);
  const doesConfirmationMatch =
    formData.confirmPassword.length > 0 && formData.confirmPassword === formData.password;

  const isSubmitEnabled =
    hasBasicRequiredFields(formData)
    && areRequirementsMet
    && doesConfirmationMatch
    && !loading;

  const handleFieldChange = (fieldName) => (event) => {
    const value = event.target.value;

    setFormData((previous) => ({
      ...previous,
      [fieldName]: value,
    }));

    setFormErrors((previous) => ({
      ...previous,
      [fieldName]: null,
    }));

    if (error) {
      setError('');
    }
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.name.trim()) {
      nextErrors.name = 'El nombre es obligatorio.';
    }

    if (!formData.surname.trim()) {
      nextErrors.surname = 'El apellido paterno es obligatorio.';
    }

    if (!formData.email.trim()) {
      nextErrors.email = 'El correo es obligatorio.';
    }

    if (!formData.password) {
      nextErrors.password = 'La contraseña es obligatoria.';
    } else if (!areRequirementsMet) {
      nextErrors.password = 'La contraseña aún no cumple todos los requisitos.';
    }

    if (!formData.confirmPassword) {
      nextErrors.confirmPassword = 'Debes confirmar la contraseña.';
    } else if (!doesConfirmationMatch) {
      nextErrors.confirmPassword = 'La confirmación no coincide con la contraseña.';
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    const result = await registerUser(formData);

    if (result.success) {
      setAccountCreated(true);
      setCreatedEmail(result?.data?.email || formData.email);
      return;
    }

    setFormErrors((previous) => ({
      ...previous,
      ...result.fieldErrors,
    }));
  };

  const handleGoLanding = () => {
    navigate('/');
  };

  const showRegisterForm = accountCreated === false;

  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--bg-base)] text-[var(--text-primary)]" style={{ fontFamily: 'Inter, sans-serif' }}>
      <AuthTopBar showActionButton={false} showNavigation={false} logoClickable logoHref="/" />

      <main className="relative flex min-h-screen flex-grow items-center justify-center overflow-hidden px-4 pt-24 pb-12">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -top-[10%] -right-[5%] h-[40%] w-[40%] rounded-full bg-[var(--accent-subtle)] opacity-60 blur-3xl" />
          <div className="absolute -bottom-[5%] -left-[5%] h-[30%] w-[30%] rounded-full bg-[var(--accent-subtle)] opacity-40 blur-3xl" />
        </div>

        <div className="z-10 w-full max-w-[560px]">
          <div className="rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-8 shadow-[0_12px_32px_-4px_rgba(25,27,35,0.06)] md:p-12">
            {showRegisterForm ? (
              <>
                <div className="mb-8 text-center">
                  <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-xl bg-[var(--accent)]">
                    <span className="material-symbols-outlined text-3xl text-[var(--text-on-accent)]">person_add</span>
                  </div>
                  <h1 className="mb-2 text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    Crear cuenta
                  </h1>
                  <p className="text-[var(--text-secondary)]">Completa tus datos para registrarte</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input
                      label="Nombre(s)"
                      type="text"
                      value={formData.name}
                      onChange={handleFieldChange('name')}
                      placeholder="Tu nombre"
                      required
                      error={formErrors.name}
                      colorVariant="default"
                      labelStyle={INPUT_LABEL_STYLE}
                    />

                    <Input
                      label="Apellido paterno"
                      type="text"
                      value={formData.surname}
                      onChange={handleFieldChange('surname')}
                      placeholder="Tu apellido"
                      required
                      error={formErrors.surname}
                      colorVariant="default"
                      labelStyle={INPUT_LABEL_STYLE}
                    />
                  </div>

                  <Input
                    label="Apellido materno (opcional)"
                    type="text"
                    value={formData.lastName}
                    onChange={handleFieldChange('lastName')}
                    placeholder="Tu apellido materno"
                    error={formErrors.lastName}
                    colorVariant="default"
                    labelStyle={INPUT_LABEL_STYLE}
                  />

                  <Input
                    label="Correo electrónico"
                    type="email"
                    value={formData.email}
                    onChange={handleFieldChange('email')}
                    placeholder="correo@ejemplo.com"
                    required
                    error={formErrors.email}
                    colorVariant="default"
                    labelStyle={INPUT_LABEL_STYLE}
                  />

                  <Input
                    label="Contraseña"
                    type="password"
                    value={formData.password}
                    onChange={handleFieldChange('password')}
                    placeholder="••••••••"
                    required
                    error={formErrors.password}
                    colorVariant="default"
                    labelStyle={INPUT_LABEL_STYLE}
                  />

                  <PasswordRequirementsChecklist requirements={requirements} />

                  <Input
                    label="Confirmar contraseña"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleFieldChange('confirmPassword')}
                    placeholder="••••••••"
                    required
                    error={formErrors.confirmPassword}
                    colorVariant="default"
                    labelStyle={INPUT_LABEL_STYLE}
                  />

                  {error ? (
                    <div
                      className="rounded-xl px-4 py-3 text-sm"
                      style={{
                        border: '1px solid var(--error-border, #fecaca)',
                        backgroundColor: 'var(--error-subtle, #fef2f2)',
                        color: 'var(--error, #dc2626)',
                      }}
                    >
                      {error}
                    </div>
                  ) : null}

                  <ActionButton
                    type="submit"
                    label="Crear cuenta"
                    loading={loading}
                    loadingLabel="Creando cuenta..."
                    disabled={!isSubmitEnabled}
                    variant="default"
                    className="shadow-lg shadow-[var(--accent-subtle)]"
                  />
                </form>

                <div className="mt-6 text-center">
                  <p className="text-[var(--text-secondary)]">
                    ¿Ya tienes cuenta?{' '}
                    <Link to="/login" className="font-medium text-[var(--accent)] hover:underline">
                      Inicia sesión
                    </Link>
                  </p>
                </div>
              </>
            ) : (
              <div className="space-y-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent-subtle)] text-[var(--accent)]">
                  <MailCheck className="h-8 w-8" />
                </div>

                <div className="space-y-2">
                  <h1 className="text-2xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'Manrope, sans-serif' }}>
                    Cuenta creada
                  </h1>
                  <p className="text-[var(--text-secondary)]">
                    Tu cuenta fue creada correctamente. Ahora debes verificar tu correo para poder iniciar sesión.
                  </p>
                  {createdEmail ? (
                    <p className="text-sm font-medium text-[var(--text-primary)]">Correo: {createdEmail}</p>
                  ) : null}
                </div>

                <ActionButton
                  type="button"
                  onClick={handleGoLanding}
                  label="Ir a la landing"
                  variant="default"
                  className="shadow-lg shadow-[var(--accent-subtle)]"
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
