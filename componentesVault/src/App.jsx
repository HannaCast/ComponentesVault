import {
  ArrowRight,
  CheckCircle2,
  Cloud,
  FileText,
  Folder,
  Lock,
  Search,
  Share2,
  Shield,
  Sparkles,
  Upload,
  Users,
} from 'lucide-react';
import {
  FileCard,
  MetricCard,
  PlanCard,
  StorageUsage,
  VaultBrand,
  VaultButton,
  VaultFeatureCard,
  VaultIconBadge,
  VaultNewItemMenu,
  VaultSearchBar,
  VaultTopbar,
  WorkspaceCard,
} from './components';

const newItemOptions = [
  { key: 'folder', label: 'Nueva carpeta', description: 'Organiza tus archivos', icon: Folder, tone: 'cyan' },
  { key: 'document', label: 'Documento', description: 'Crea documentos en segundos', icon: FileText, tone: 'neutral' },
  { key: 'upload-file', label: 'Subir archivo', description: 'Desde tu dispositivo', icon: Upload, tone: 'primary' },
];

function FeatureTile({ icon, title, text, tone = 'primary' }) {
  return (
    <article className="rounded-[var(--radius-card)] border border-[var(--border-default)] bg-white p-6 shadow-[var(--shadow-card)]">
      <VaultIconBadge icon={icon} tone={tone} />
      <h3 className="mt-6 text-lg font-bold text-[var(--text-primary)]">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]">{text}</p>
    </article>
  );
}

function App() {
  return (
    <main className="min-h-screen overflow-hidden bg-[var(--bg-base)] text-[var(--text-primary)]">
      <header className="sticky top-0 z-30 border-b border-[var(--border-subtle)] bg-white/85 px-6 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <VaultBrand />
          <nav className="hidden items-center gap-8 text-sm font-semibold text-[var(--text-secondary)] md:flex">
            <a href="#funciones" className="hover:text-[var(--accent)]">Funciones</a>
            <a href="#seguridad" className="hover:text-[var(--accent)]">Seguridad</a>
            <a href="#equipos" className="hover:text-[var(--accent)]">Equipos</a>
            <a href="#planes" className="hover:text-[var(--accent)]">Planes</a>
          </nav>
          <div className="flex items-center gap-3">
            <VaultButton variant="ghost" size="sm">Iniciar sesion</VaultButton>
            <VaultButton size="sm">Crear cuenta</VaultButton>
          </div>
        </div>
      </header>

      <section className="relative px-6 py-20 sm:py-24">
        <div className="absolute left-1/2 top-0 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-[var(--accent-subtle)] blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-white px-4 py-2 text-sm font-semibold text-[var(--accent)] shadow-sm">
              <Sparkles className="h-4 w-4" />
              Tu nube personal y colaborativa
            </div>
            <h1 className="max-w-3xl text-5xl font-black leading-tight tracking-tight text-[var(--text-primary)] sm:text-6xl">
              Guarda, organiza y comparte tus archivos desde un solo lugar.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--text-secondary)]">
              Infinity Vault es una plataforma de almacenamiento en la nube tipo Drive para gestionar documentos,
              carpetas, archivos compartidos y espacios de equipo con una experiencia rapida, moderna y segura.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <VaultButton icon={ArrowRight} size="lg">Empezar gratis</VaultButton>
              <VaultButton variant="secondary" size="lg">Ver demo</VaultButton>
            </div>
            <div className="mt-8 grid gap-4 text-sm font-semibold text-[var(--text-secondary)] sm:grid-cols-3">
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> 5 GB gratis</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Compartir archivos</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Acceso seguro</span>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/40 bg-white/70 p-4 shadow-[var(--shadow-soft)] backdrop-blur">
            <div className="overflow-hidden rounded-[1.5rem] border border-[var(--border-default)] bg-[var(--bg-elevated)] shadow-[var(--shadow-card)]">
              <VaultTopbar searchValue="" onSearchChange={() => undefined} notificationCount={2} />
              <div className="space-y-5 p-5">
                <div className="grid grid-cols-2 gap-4">
                  <MetricCard icon="file" value="1,248" label="Archivos" />
                  <MetricCard icon="storage" value="25 GB" label="usados" progress={25} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FileCard icon="file" title="Propuesta Comercial.docx" size="2.4 MB" date="Hoy" favorite />
                  <FileCard icon="folder" title="Documentos Personales" type="Carpeta" date="Ayer" shared />
                </div>
                <VaultNewItemMenu items={newItemOptions} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="funciones" className="px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-[var(--accent)]">Funciones</p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">Todo para trabajar con tus archivos</h2>
            <p className="mt-4 text-[var(--text-secondary)]">
              Administra tu unidad personal, archivos recientes, destacados, compartidos y carpetas de equipo sin perder el control.
            </p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <FeatureTile icon={Cloud} title="Almacenamiento en la nube" text="Sube documentos, imagenes, presentaciones y carpetas completas desde cualquier dispositivo." />
            <FeatureTile icon={Search} title="Busqueda inteligente" text="Encuentra archivos por nombre, tipo, carpeta o espacio compartido en segundos." tone="cyan" />
            <FeatureTile icon={Share2} title="Compartir facilmente" text="Comparte archivos y carpetas con otras personas o equipos de trabajo." tone="purple" />
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-[2rem] bg-[var(--gradient-hero)] p-8 text-white shadow-[var(--shadow-soft)]">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-white/70">Organizacion</p>
            <h2 className="mt-3 text-3xl font-black">Tu unidad siempre ordenada.</h2>
            <p className="mt-4 leading-7 text-white/80">
              Crea carpetas, marca archivos destacados, revisa los recientes y administra lo compartido contigo desde una interfaz clara.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <VaultFeatureCard icon="folder" title="Carpetas" description="Agrupa documentos por proyecto, cliente o equipo." />
              <VaultFeatureCard icon="file" title="Archivos" description="Visualiza informacion clave de cada documento." />
            </div>
          </div>

          <div className="rounded-[2rem] border border-[var(--border-default)] bg-white p-6 shadow-[var(--shadow-card)]">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-black">Archivos recientes</h3>
                <p className="text-sm text-[var(--text-secondary)]">Accede rapido a lo que acabas de usar.</p>
              </div>
              <VaultButton variant="secondary" size="sm">Ver todos</VaultButton>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <FileCard icon="file" title="Presupuesto Q2.xlsx" size="1.7 MB" date="Ayer" />
              <FileCard icon="file" title="Presentacion Cliente.pptx" size="5 MB" date="18 jun" shared />
              <FileCard icon="folder" title="Analisis de Datos" type="Carpeta" date="17 jun" favorite />
            </div>
          </div>
        </div>
      </section>

      <section id="seguridad" className="px-6 py-16">
        <div className="mx-auto grid max-w-7xl items-center gap-8 rounded-[2rem] border border-[var(--border-default)] bg-white p-8 shadow-[var(--shadow-card)] lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-[var(--accent)]">Seguridad</p>
            <h2 className="mt-3 text-3xl font-black">Tus documentos protegidos y siempre disponibles.</h2>
            <p className="mt-4 leading-7 text-[var(--text-secondary)]">
              Infinity Vault esta pensado para comunicar confianza: acceso protegido, cifrado, permisos y recuperacion desde papelera.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <FeatureTile icon={Shield} title="Proteccion" text="Diseñado para flujos con seguridad y permisos." />
            <FeatureTile icon={Lock} title="Acceso privado" text="Controla quien puede ver o editar tus archivos." tone="purple" />
            <FeatureTile icon={Folder} title="Recuperacion" text="Administra archivos eliminados antes de borrarlos definitivamente." tone="cyan" />
          </div>
        </div>
      </section>

      <section id="equipos" className="px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-[var(--accent)]">Equipos</p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">Colabora en unidades compartidas</h2>
            <p className="mt-4 text-[var(--text-secondary)]">
              Crea espacios para marketing, desarrollo, diseno o cualquier equipo que necesite trabajar con archivos comunes.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            <WorkspaceCard title="Marketing" description="Campanas, materiales promocionales y recursos de marca." meta="12 miembros" role="Manager" />
            <WorkspaceCard title="Desarrollo" description="Documentacion tecnica, recursos y archivos de producto." meta="8 miembros" role="Gestor" />
            <WorkspaceCard title="Diseno" description="Mockups, assets visuales y entregables creativos." meta="5 miembros" role="Colaborador" />
          </div>
        </div>
      </section>

      <section id="planes" className="px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-[var(--accent)]">Planes</p>
            <h2 className="mt-3 text-3xl font-black sm:text-4xl">Escala cuando necesites mas espacio</h2>
            <p className="mt-4 text-[var(--text-secondary)]">
              Empieza gratis y crece a planes con mas almacenamiento, soporte y funciones colaborativas.
            </p>
          </div>
          <div className="mb-6 rounded-[var(--radius-card)] border border-[var(--border-default)] bg-white p-5 shadow-[var(--shadow-card)]">
            <StorageUsage label="80 GB de 100 GB usados" percent={80} />
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            <PlanCard name="Free" price="€0" features={['5 GB de almacenamiento', 'Acceso basico', 'Compartir archivos']} />
            <PlanCard name="Pro" price="€9.99" selected features={['100 GB de almacenamiento', 'Soporte prioritario', 'Colaboracion avanzada', 'Versionado de archivos']} />
            <PlanCard name="Business" price="€29.99" features={['1 TB de almacenamiento', 'Soporte 24/7', 'Equipos ilimitados', 'API personalizada']} />
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl rounded-[2rem] bg-[var(--gradient-hero)] p-8 text-center text-white shadow-[var(--shadow-soft)]">
          <h2 className="text-3xl font-black">Lleva tus archivos a Infinity Vault.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-white/80">
            Centraliza tu informacion, comparte con tu equipo y accede a tus documentos desde donde estes.
          </p>
          <div className="mt-8 flex justify-center">
            <VaultButton icon={ArrowRight} size="lg" className="bg-white text-[var(--accent)]">Crear cuenta gratis</VaultButton>
          </div>
        </div>
      </section>
    </main>
  );
}

export default App;
