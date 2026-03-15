import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  GraduationCap,
  BookOpen,
  Users,
  Clock,
  CheckCircle,
  ArrowRight,
  Zap,
  BarChart,
  Shield
} from 'lucide-react';
import { useApp } from '@context/AppContext';

const getHomePathByRole = (role) => {
  const normalizedRole = String(role || '').toLowerCase();
  return normalizedRole.includes('admin') ? '/admin' : '/user';
};

export const Landing = () => {
  const navigate = useNavigate();
  const { user, restoreSession } = useApp();

  const handleLoginNavigation = async () => {
    if (user) {
      navigate(getHomePathByRole(user.role));
      return;
    }

    const restoredUser = await restoreSession();
    if (restoredUser) {
      navigate(getHomePathByRole(restoredUser.role));
      return;
    }

    navigate('/login');
  };

  const features = [
    {
      icon: Calendar,
      title: 'Generación Automática',
      description: 'Crea horarios académicos optimizados en minutos, no en horas.'
    },
    {
      icon: Users,
      title: 'Gestión Completa',
      description: 'Administra profesores, materias, grupos y aulas desde un solo lugar.'
    },
    {
      icon: Zap,
      title: 'Rápido y Eficiente',
      description: 'Interfaz intuitiva diseñada para maximizar tu productividad.'
    },
    {
      icon: BarChart,
      title: 'Control Total',
      description: 'Bitácora completa de todas las operaciones del sistema.'
    },
    {
      icon: Clock,
      title: 'Ahorra Tiempo',
      description: 'Reduce el tiempo de planificación de horarios hasta en un 90%.'
    },
    {
      icon: Shield,
      title: 'Seguro y Confiable',
      description: 'Tus datos académicos protegidos y siempre disponibles.'
    }
  ];

  const benefits = [
    'Gestión de múltiples universidades',
    'Configuración de carreras y materias',
    'Control de disponibilidad de profesores',
    'Administración de aulas y espacios',
    'Asignación inteligente de grupos',
    'Reportes y estadísticas en tiempo real'
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">EduSchedule</span>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleLoginNavigation}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => navigate('/registro')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Registrarse
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full mb-6">
              <Zap className="w-4 h-4" />
              <span className="text-sm font-medium">Sistema de Gestión Académica</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Genera Horarios
              <span className="block text-blue-600">en Minutos</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              La plataforma completa para maestros universitarios que desean optimizar
              la planificación de horarios académicos de forma inteligente y eficiente.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate('/registro')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
              >
                Comenzar Gratis
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={handleLoginNavigation}
                className="w-full sm:w-auto px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 transition-colors text-lg font-medium"
              >
                Iniciar Sesión
              </button>
            </div>
          </div>

          {/* Hero Image/Illustration */}
          <div className="mt-16 relative">
            <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
              <div className="grid grid-cols-7 gap-2">
                {/* Simplified Calendar Visualization */}
                <div className="col-span-7 grid grid-cols-7 gap-2 mb-4">
                  {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
                    <div key={day} className="text-center text-sm font-medium text-gray-600 py-2">
                      {day}
                    </div>
                  ))}
                </div>
                {[...Array(28)].map((_, i) => (
                  <div
                    key={i}
                    className={`aspect-square rounded-lg flex items-center justify-center text-sm font-medium ${
                      i % 7 === 5 || i % 7 === 6
                        ? 'bg-gray-100 text-gray-400'
                        : i % 3 === 0
                        ? 'bg-blue-500 text-white'
                        : i % 3 === 1
                        ? 'bg-purple-500 text-white'
                        : i % 3 === 2
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-50 text-gray-600'
                    }`}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Todo lo que necesitas
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Herramientas poderosas diseñadas específicamente para la gestión
              académica universitaria.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="p-6 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Potencia tu Gestión Académica
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                EduSchedule te proporciona todas las herramientas necesarias para
                administrar horarios académicos de manera profesional y eficiente.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate('/registro')}
                className="mt-8 flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Crear mi cuenta gratis
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-200">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <GraduationCap className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">Universidad Configurada</div>
                      <div className="text-sm text-gray-600">3 carreras activas</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                    <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">45 Materias</div>
                      <div className="text-sm text-gray-600">12 profesores asignados</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                    <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">Horarios Generados</div>
                      <div className="text-sm text-gray-600">8 grupos programados</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            ¿Listo para optimizar tus horarios?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Únete a los maestros que ya están ahorrando tiempo con EduSchedule
          </p>
          <button
            onClick={() => navigate('/registro')}
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-lg font-medium"
          >
            Comenzar ahora
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">EduSchedule</span>
            </div>
            <p className="text-gray-400 text-sm">
              © 2026 EduSchedule. Sistema de Gestión de Horarios Académicos.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
