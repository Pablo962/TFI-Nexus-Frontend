import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, DEMO_CREDENTIALS } from '../context/AuthContext';
import { UserRole } from '../types';
import { APP_NAME } from '../routes';
import { useToast } from '../components/ToastProvider';
import { useFocusTrap } from '../components/useFocusTrap';

type LoginTab = 'credentials' | 'demo' | 'register';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const { login, loginAs, register, logout, isAuthenticated, isLoading, user } = useAuth();

  const [activeTab, setActiveTab] = useState<LoginTab>('credentials');

  // Form States (Login)
  const [email, setEmail] = useState('admin@nexus.com');
  const [password, setPassword] = useState('Admin1234!');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form States (Register)
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('MANAGER');

  // Forgot Password Modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const forgotModalRef = useFocusTrap<HTMLDivElement>(showForgotModal);

  // Redirect if authenticated
  const from = (location.state as any)?.from || '/';
  useEffect(() => {
    if (isAuthenticated && !isLoading && !errorMessage) {
      // Si el usuario ya está autenticado, no redirigir automáticamente si quiere cambiar de cuenta
    }
  }, [isAuthenticated, isLoading, errorMessage]);

  // Submit Login
  const handleSubmitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMessage('Por favor completá todos los campos requeridos.');
      return;
    }

    setIsSubmitting(true);
    try {
      await login(cleanEmail, password);
      showToast('Sesión iniciada correctamente');
      navigate(from, { replace: true });
    } catch (err: any) {
      setErrorMessage(
        err?.message || 'Credenciales incorrectas. Verificá tu correo y contraseña.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Quick Demo Login
  const handleQuickLogin = async (role: UserRole) => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const creds = DEMO_CREDENTIALS[role];
      setEmail(creds.email);
      setPassword(creds.pass);
      await loginAs(role);
      showToast(`Sesión iniciada como ${creds.user.name}`);
      navigate(from, { replace: true });
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al iniciar sesión con el perfil demo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Register
  const handleSubmitRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      setErrorMessage('Por favor completá todos los datos para registrar la cuenta.');
      return;
    }

    if (regPassword.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        role: regRole,
      });
      showToast(`Cuenta registrada exitosamente para ${regName}`);
      navigate(from, { replace: true });
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error al registrar la nueva cuenta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col lg:flex-row text-on-surface font-body selection:bg-primary/20 selection:text-primary">
      {/* LEFT COLUMN: HERO & ARCHITECTURAL SHOWCASE (Desktop) */}
      <div className="lg:w-1/2 bg-gradient-to-br from-[#090d16] via-[#111827] to-[#030712] text-white p-8 lg:p-14 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-white/10">
        {/* Glow Background Elements */}
        <div className="absolute top-0 right-0 -mr-24 -mt-24 w-96 h-96 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-24 -mb-24 w-96 h-96 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-sm">
            <span className="material-symbols-outlined text-white text-2xl" aria-hidden="true">hub</span>
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight block leading-tight font-headline">
              {APP_NAME}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-white/60 font-medium">
              Ecosistema Integral de Talento &amp; Estructura
            </span>
          </div>
        </div>

        {/* Center Pitch & Architecture Pillars */}
        <div className="relative z-10 my-8 lg:my-0 flex flex-col gap-5 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-medium w-fit">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            NEXUS Enterprise v3.2 • Control RBAC Activo
          </div>

          <h1 className="text-3xl lg:text-4xl font-bold leading-tight tracking-tight font-headline">
            Gestión inteligente de talento, puestos y cadena de valor.
          </h1>

          <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-normal">
            Centralizá el manual descriptivo de puestos (DPT), evaluá competencias con calibración matricial 9-Box y vinculá directamente cada cargo con los eslabones estratégicos de Porter.
          </p>

          {/* Core Architectural Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 flex items-start gap-2.5">
              <span className="material-symbols-outlined text-amber-300 text-lg shrink-0 mt-0.5" aria-hidden="true">
                badge
              </span>
              <div>
                <span className="text-xs font-semibold block text-white">Manual DPT (ISO 9001)</span>
                <span className="text-[11px] text-white/70 leading-snug">
                  Fichas técnicas con perfil, funciones, tareas y riesgos.
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 flex items-start gap-2.5">
              <span className="material-symbols-outlined text-emerald-300 text-lg shrink-0 mt-0.5" aria-hidden="true">
                psychology
              </span>
              <div>
                <span className="text-xs font-semibold block text-white">Matriz de Competencias</span>
                <span className="text-[11px] text-white/70 leading-snug">
                  Análisis de brechas 1-5 y planes de upskilling.
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 flex items-start gap-2.5">
              <span className="material-symbols-outlined text-cyan-300 text-lg shrink-0 mt-0.5" aria-hidden="true">
                schema
              </span>
              <div>
                <span className="text-xs font-semibold block text-white">Cadena de Valor Porter</span>
                <span className="text-[11px] text-white/70 leading-snug">
                  Simulación de impacto en actividades primarias y margen.
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 flex items-start gap-2.5">
              <span className="material-symbols-outlined text-indigo-300 text-lg shrink-0 mt-0.5" aria-hidden="true">
                grid_view
              </span>
              <div>
                <span className="text-xs font-semibold block text-white">Calibración 9-Box</span>
                <span className="text-[11px] text-white/70 leading-snug">
                  Mapeo de potencial vs desempeño y actas oficiales.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Security Info */}
        <div className="relative z-10 flex items-center justify-between text-xs text-white/60 pt-4 border-t border-white/10">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-emerald-400 text-base" aria-hidden="true">verified_user</span>
            <span>Autenticación corporativa segura con tokens JWT</span>
          </div>
          <span className="text-[11px] font-mono text-white/40">TLS 1.3 / AES-256</span>
        </div>
      </div>

      {/* RIGHT COLUMN: LOGIN FORM & WORKFLOW */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-10 lg:p-14">
        <div className="w-full max-w-md flex flex-col gap-5">
          {/* Form Header */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">
                Portal de Acceso
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight font-headline">
              Iniciar Sesión en NEXUS
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
              Ingresá con tus credenciales corporativas o seleccioná un perfil demo de acceso inmediato.
            </p>
          </div>

          {/* Active Session Card (If user is already logged in) */}
          {user && (
            <div className="p-3.5 bg-primary/5 border border-primary/20 rounded-2xl flex items-center justify-between text-xs animate-in fade-in duration-150">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={user.avatar || DEMO_CREDENTIALS.ADMIN_HR.user.avatar}
                  alt={user.name}
                  className="w-9 h-9 rounded-full object-cover shrink-0 border border-primary/20"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-bold text-on-surface truncate">{user.name}</span>
                  </div>
                  <span className="text-[11px] text-outline truncate block">
                    {user.title || user.role} • {user.email}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => navigate(from, { replace: true })}
                  className="px-3 py-1.5 bg-primary text-on-primary rounded-xl font-semibold text-xs hover:bg-primary-container transition-all cursor-pointer shadow-xs"
                >
                  Entrar &rarr;
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="p-1.5 text-outline hover:text-error hover:bg-surface-container rounded-lg transition-all cursor-pointer"
                  title="Cerrar sesión actual"
                  aria-label="Cerrar sesión"
                >
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">logout</span>
                </button>
              </div>
            </div>
          )}

          {/* Navigation Tabs (Credentials / Quick Demo / Register) */}
          <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-2xl border border-outline-variant/30">
            <button
              type="button"
              onClick={() => { setActiveTab('credentials'); setErrorMessage(null); }}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'credentials'
                  ? 'bg-surface-container-lowest text-primary shadow-xs ring-1 ring-primary/20'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]" aria-hidden="true">key</span>
              Credenciales
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('demo'); setErrorMessage(null); }}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'demo'
                  ? 'bg-surface-container-lowest text-primary shadow-xs ring-1 ring-primary/20'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[15px] text-amber-500" aria-hidden="true">bolt</span>
              Acceso Rápido
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('register'); setErrorMessage(null); }}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'register'
                  ? 'bg-surface-container-lowest text-primary shadow-xs ring-1 ring-primary/20'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]" aria-hidden="true">person_add</span>
              Registrarse
            </button>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div
              role="alert"
              className="p-3 bg-error/10 border border-error/30 rounded-xl flex items-start gap-2.5 text-xs text-error animate-in fade-in duration-150"
            >
              <span className="material-symbols-outlined text-base shrink-0 mt-0.5" aria-hidden="true">error</span>
              <span className="font-medium leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: FORMULARIO DE CREDENCIALES */}
          {activeTab === 'credentials' && (
            <form onSubmit={handleSubmitLogin} className="flex flex-col gap-4">
              <div>
                <label htmlFor="login-email" className="text-xs font-semibold text-on-surface block mb-1">
                  Correo Electrónico Corporativo
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-outline text-[18px] pointer-events-none" aria-hidden="true">
                    alternate_email
                  </span>
                  <input
                    id="login-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@nexus.com"
                    className="w-full pl-9 pr-4 py-2.5 bg-surface-container-low text-on-surface placeholder:text-outline rounded-xl text-xs sm:text-sm font-medium outline-none border border-outline-variant/40 focus:border-primary focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="login-password" className="text-xs font-semibold text-on-surface">
                    Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setShowForgotModal(true);
                    }}
                    className="text-[11px] text-primary hover:underline font-medium cursor-pointer"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-outline text-[18px] pointer-events-none" aria-hidden="true">
                    lock
                  </span>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 bg-surface-container-low text-on-surface placeholder:text-outline rounded-xl text-xs sm:text-sm font-medium outline-none border border-outline-variant/40 focus:border-primary focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 p-1 rounded-md text-outline hover:text-on-surface cursor-pointer"
                    title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    <span className="material-symbols-outlined text-[17px]" aria-hidden="true">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none text-on-surface-variant">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-outline-variant text-primary focus:ring-primary/20"
                  />
                  <span>Recordar sesión en este equipo</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-1 py-2.5 px-4 bg-primary text-on-primary rounded-xl font-bold text-xs sm:text-sm hover:bg-primary-container transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-base" aria-hidden="true">progress_activity</span>
                    <span>Validando credenciales...</span>
                  </>
                ) : (
                  <>
                    <span>Ingresar a la Plataforma</span>
                    <span className="material-symbols-outlined text-base" aria-hidden="true">arrow_forward</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: PERFILES DEMO DE ACCESO RÁPIDO (1 CLIC) */}
          {activeTab === 'demo' && (
            <div className="flex flex-col gap-3">
              <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20 text-xs text-on-surface-variant flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500 text-lg shrink-0" aria-hidden="true">info</span>
                <span>Seleccioná cualquiera de los 4 perfiles preconfigurados para explorar las funciones de NEXUS sin ingresar contraseñas.</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* 1. Admin HR */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('ADMIN_HR')}
                  disabled={isSubmitting}
                  className="p-3 bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 hover:border-primary/40 rounded-2xl flex flex-col gap-2 transition-all text-left cursor-pointer group disabled:opacity-50"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                      ADMIN_HR
                    </span>
                    <span className="material-symbols-outlined text-outline group-hover:text-primary text-[18px]" aria-hidden="true">
                      arrow_forward
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-on-surface block group-hover:text-primary">
                      Directora de Personas
                    </span>
                    <span className="text-[11px] text-outline block">
                      Acceso total a todos los módulos y comités.
                    </span>
                  </div>
                </button>

                {/* 2. Manager */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('MANAGER')}
                  disabled={isSubmitting}
                  className="p-3 bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 hover:border-primary/40 rounded-2xl flex flex-col gap-2 transition-all text-left cursor-pointer group disabled:opacity-50"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-700 border border-blue-500/20">
                      MANAGER
                    </span>
                    <span className="material-symbols-outlined text-outline group-hover:text-primary text-[18px]" aria-hidden="true">
                      arrow_forward
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-on-surface block group-hover:text-primary">
                      Martín Krause
                    </span>
                    <span className="text-[11px] text-outline block">
                      VP de Ingeniería • Gestión y calibración.
                    </span>
                  </div>
                </button>

                {/* 3. Recruiter */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('RECRUITER')}
                  disabled={isSubmitting}
                  className="p-3 bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 hover:border-primary/40 rounded-2xl flex flex-col gap-2 transition-all text-left cursor-pointer group disabled:opacity-50"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 border border-amber-500/20">
                      RECRUITER
                    </span>
                    <span className="material-symbols-outlined text-outline group-hover:text-primary text-[18px]" aria-hidden="true">
                      arrow_forward
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-on-surface block group-hover:text-primary">
                      Camila Navarro
                    </span>
                    <span className="text-[11px] text-outline block">
                      Líder de Selección • Vacantes y postulantes.
                    </span>
                  </div>
                </button>

                {/* 4. Employee */}
                <button
                  type="button"
                  onClick={() => handleQuickLogin('EMPLOYEE')}
                  disabled={isSubmitting}
                  className="p-3 bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 hover:border-primary/40 rounded-2xl flex flex-col gap-2 transition-all text-left cursor-pointer group disabled:opacity-50"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-700 border border-purple-500/20">
                      EMPLOYEE
                    </span>
                    <span className="material-symbols-outlined text-outline group-hover:text-primary text-[18px]" aria-hidden="true">
                      arrow_forward
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-on-surface block group-hover:text-primary">
                      Lucas Valenzuela
                    </span>
                    <span className="text-[11px] text-outline block">
                      Arquitecto Principal • Perfil 360° y cursos.
                    </span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: REGISTRO DE NUEVO USUARIO */}
          {activeTab === 'register' && (
            <form onSubmit={handleSubmitRegister} className="flex flex-col gap-3.5">
              <div>
                <label htmlFor="reg-name" className="text-xs font-semibold text-on-surface block mb-1">
                  Nombre Completo
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-outline text-[18px] pointer-events-none" aria-hidden="true">
                    person
                  </span>
                  <input
                    id="reg-name"
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Ej. Ing. Daniel Moreno"
                    className="w-full pl-9 pr-4 py-2 bg-surface-container-low text-on-surface placeholder:text-outline rounded-xl text-xs sm:text-sm font-medium outline-none border border-outline-variant/40 focus:border-primary focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-email" className="text-xs font-semibold text-on-surface block mb-1">
                  Correo Electrónico
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-outline text-[18px] pointer-events-none" aria-hidden="true">
                    mail
                  </span>
                  <input
                    id="reg-email"
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="daniel@nexus.com"
                    className="w-full pl-9 pr-4 py-2 bg-surface-container-low text-on-surface placeholder:text-outline rounded-xl text-xs sm:text-sm font-medium outline-none border border-outline-variant/40 focus:border-primary focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="reg-role" className="text-xs font-semibold text-on-surface block mb-1">
                  Rol Solicitado
                </label>
                <select
                  id="reg-role"
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-surface-container-low text-on-surface rounded-xl text-xs sm:text-sm font-medium outline-none border border-outline-variant/40 focus:border-primary focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                >
                  <option value="ADMIN_HR">Administrador General de RRHH (ADMIN_HR)</option>
                  <option value="MANAGER">Gerente de Área / Evaluador (MANAGER)</option>
                  <option value="RECRUITER">Especialista en Selección (RECRUITER)</option>
                  <option value="EMPLOYEE">Colaborador / Funcional (EMPLOYEE)</option>
                </select>
              </div>

              <div>
                <label htmlFor="reg-password" className="text-xs font-semibold text-on-surface block mb-1">
                  Contraseña (mínimo 6 caracteres)
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-outline text-[18px] pointer-events-none" aria-hidden="true">
                    lock
                  </span>
                  <input
                    id="reg-password"
                    type="password"
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-4 py-2 bg-surface-container-low text-on-surface placeholder:text-outline rounded-xl text-xs sm:text-sm font-medium outline-none border border-outline-variant/40 focus:border-primary focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-1 py-2.5 px-4 bg-primary text-on-primary rounded-xl font-bold text-xs sm:text-sm hover:bg-primary-container transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-base" aria-hidden="true">progress_activity</span>
                    <span>Registrando cuenta...</span>
                  </>
                ) : (
                  <>
                    <span>Registrar e Ingresar</span>
                    <span className="material-symbols-outlined text-base" aria-hidden="true">check</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer Information */}
          <div className="text-center text-[10px] text-outline pt-2 border-t border-outline-variant/20 flex items-center justify-between">
            <span>NEXUS HR Platform &bull; v3.2 Enterprise</span>
            <span>Seguridad &bull; Soporte 24/7</span>
          </div>
        </div>
      </div>

      {/* Modal: Recuperación de Contraseña */}
      {showForgotModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="forgot-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowForgotModal(false)}
        >
          <div
            ref={forgotModalRef}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-2xl p-6 flex flex-col gap-4 text-xs"
          >
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl" aria-hidden="true">lock_reset</span>
                <h3 id="forgot-modal-title" className="text-sm font-bold text-on-surface">
                  Recuperación de Contraseña
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="p-1 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                aria-label="Cerrar modal"
              >
                <span className="material-symbols-outlined text-lg" aria-hidden="true">close</span>
              </button>
            </div>

            <p className="text-on-surface-variant leading-relaxed">
              En este entorno corporativo de demostración, podés restablecer tu clave ingresando con cualquiera de los 4 perfiles preconfigurados de <strong>Acceso Rápido</strong>, o enviar un enlace de recuperación al correo institucional:
            </p>

            <div>
              <label htmlFor="forgot-email-input" className="text-xs font-semibold text-on-surface block mb-1">
                Correo Corporativo
              </label>
              <input
                id="forgot-email-input"
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="usuario@nexus.com"
                className="w-full px-3 py-2 bg-surface-container-low text-on-surface rounded-xl border border-outline-variant/40 outline-none text-xs"
              />
            </div>

            <div className="p-3 bg-primary/5 rounded-xl border border-primary/20 text-on-surface-variant space-y-1">
              <span className="font-semibold text-on-surface block text-[11px]">Credenciales Demo por Defecto:</span>
              <p className="text-[11px] font-mono text-outline">admin@nexus.com &bull; Admin1234!</p>
              <p className="text-[11px] font-mono text-outline">manager@nexus.com &bull; Manager1234!</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium text-on-surface hover:bg-surface-container transition-all cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  showToast(`Se enviaron instrucciones de recuperación a ${forgotEmail || 'tu correo'}`);
                  setShowForgotModal(false);
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-primary text-on-primary hover:bg-primary-container transition-all cursor-pointer shadow-xs"
              >
                Enviar Enlace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
