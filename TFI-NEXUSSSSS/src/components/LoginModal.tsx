import React, { useState } from 'react';
import { useAuth, DEMO_CREDENTIALS } from '../context/AuthContext';
import { UserRole } from '../types';
import { useFocusTrap } from './useFocusTrap';
import { useToast } from './ToastProvider';

export const LoginModal: React.FC = () => {
  const { isLoginModalOpen, closeLoginModal, login, loginAs, register, isLoading, user } = useAuth();
  const { showToast } = useToast();

  const [modalTab, setModalTab] = useState<'demo' | 'credentials' | 'register'>('demo');

  // Credentials State
  const [email, setEmail] = useState('admin@nexus.com');
  const [password, setPassword] = useState('Admin1234!');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Register State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('MANAGER');

  const dialogRef = useFocusTrap<HTMLDivElement>(isLoginModalOpen);

  if (!isLoginModalOpen) return null;

  // Handle Credentials Submit
  const handleSubmitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email.trim(), password);
      showToast('Sesión iniciada con éxito');
      closeLoginModal();
    } catch (err: any) {
      setError(err?.message || 'Error al iniciar sesión. Verifique sus credenciales.');
    }
  };

  // Handle Quick Switch
  const handleQuickSwitch = async (role: UserRole) => {
    setError(null);
    try {
      await loginAs(role);
      showToast(`Cambiado a perfil ${DEMO_CREDENTIALS[role].user.name}`);
      closeLoginModal();
    } catch (err: any) {
      setError(err?.message || 'Error al cambiar de cuenta.');
    }
  };

  // Handle Register Submit
  const handleSubmitRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      setError('Por favor completá todos los campos requeridos.');
      return;
    }
    try {
      await register({
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        role: regRole,
      });
      showToast(`Cuenta creada para ${regName}`);
      closeLoginModal();
    } catch (err: any) {
      setError(err?.message || 'Error al registrar la nueva cuenta.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-login-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={closeLoginModal}
    >
      <div
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
        className="bg-surface-container-lowest w-full max-w-lg rounded-3xl border border-outline-variant/40 shadow-2xl p-6 sm:p-7 flex flex-col gap-5 relative max-h-[90vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={closeLoginModal}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-outline hover:text-on-surface transition-colors cursor-pointer"
          aria-label="Cerrar modal"
        >
          <span className="material-symbols-outlined text-lg" aria-hidden="true">close</span>
        </button>

        {/* Modal Header */}
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-8 h-8 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-2xs">
              <span className="material-symbols-outlined text-base" aria-hidden="true">lock</span>
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Control de Accesos &amp; Identidad
            </span>
          </div>
          <h2 id="modal-login-title" className="text-xl sm:text-2xl font-bold text-on-surface font-headline tracking-tight">
            Iniciar Sesión o Cambiar Cuenta
          </h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Accedé a las funciones y permisos correspondientes a tu rol en la organización.
          </p>
        </div>

        {/* Current Active User Banner */}
        {user && (
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-2xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <div className="min-w-0">
                <span className="font-bold text-on-surface truncate block">{user.name}</span>
                <span className="text-[11px] text-outline truncate block">
                  {user.email} &bull; {user.role}
                </span>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary uppercase shrink-0">
              Sesión Activa
            </span>
          </div>
        )}

        {/* Navigation Tabs in Modal */}
        <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-2xl border border-outline-variant/30">
          <button
            type="button"
            onClick={() => { setModalTab('demo'); setError(null); }}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              modalTab === 'demo'
                ? 'bg-surface-container-lowest text-primary shadow-xs ring-1 ring-primary/20'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[15px] text-amber-500" aria-hidden="true">bolt</span>
            Acceso Rápido
          </button>

          <button
            type="button"
            onClick={() => { setModalTab('credentials'); setError(null); }}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              modalTab === 'credentials'
                ? 'bg-surface-container-lowest text-primary shadow-xs ring-1 ring-primary/20'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]" aria-hidden="true">key</span>
            Credenciales
          </button>

          <button
            type="button"
            onClick={() => { setModalTab('register'); setError(null); }}
            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              modalTab === 'register'
                ? 'bg-surface-container-lowest text-primary shadow-xs ring-1 ring-primary/20'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]" aria-hidden="true">person_add</span>
            Registrar
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            role="alert"
            className="p-3 bg-error/10 border border-error/30 rounded-xl text-error text-xs flex items-center gap-2 animate-in fade-in duration-150"
          >
            <span className="material-symbols-outlined text-sm shrink-0" aria-hidden="true">error</span>
            <span className="font-medium leading-relaxed">{error}</span>
          </div>
        )}

        {/* TAB 1: DEMO QUICK ACCESS (1-CLICK) */}
        {modalTab === 'demo' && (
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-bold text-outline uppercase tracking-wider">
              Seleccionar perfil corporativo demo:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {(Object.entries(DEMO_CREDENTIALS) as [UserRole, (typeof DEMO_CREDENTIALS)[UserRole]][]).map(
                ([roleKey, item]) => {
                  const isActive = user?.role === roleKey;
                  return (
                    <button
                      key={roleKey}
                      type="button"
                      onClick={() => handleQuickSwitch(roleKey)}
                      disabled={isLoading}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 disabled:opacity-50 group ${
                        isActive
                          ? 'bg-primary/10 border-primary text-primary font-bold shadow-2xs'
                          : 'bg-surface-container-low border-outline-variant/30 text-on-surface hover:border-primary/40 hover:bg-surface-container'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          roleKey === 'ADMIN_HR'
                            ? 'bg-emerald-500/10 text-emerald-700'
                            : roleKey === 'MANAGER'
                            ? 'bg-blue-500/10 text-blue-700'
                            : roleKey === 'RECRUITER'
                            ? 'bg-amber-500/10 text-amber-700'
                            : 'bg-purple-500/10 text-purple-700'
                        }`}>
                          {roleKey}
                        </span>
                        {isActive ? (
                          <span className="material-symbols-outlined text-xs text-primary" aria-hidden="true">check_circle</span>
                        ) : (
                          <span className="material-symbols-outlined text-outline group-hover:text-primary text-[15px]" aria-hidden="true">arrow_forward</span>
                        )}
                      </div>
                      <div>
                        <span className="text-xs font-bold text-on-surface block truncate group-hover:text-primary">
                          {item.user.name}
                        </span>
                        <span className="text-[10px] text-outline truncate block">
                          {item.user.title}
                        </span>
                      </div>
                    </button>
                  );
                },
              )}
            </div>
          </div>
        )}

        {/* TAB 2: CREDENTIALS FORM */}
        {modalTab === 'credentials' && (
          <form onSubmit={handleSubmitLogin} className="flex flex-col gap-3.5">
            <div>
              <label htmlFor="modal-email" className="text-xs font-bold text-on-surface block mb-1">
                Correo Electrónico
              </label>
              <input
                id="modal-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@nexus.com"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 text-xs text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>

            <div>
              <label htmlFor="modal-password" className="text-xs font-bold text-on-surface block mb-1">
                Contraseña
              </label>
              <div className="relative flex items-center">
                <input
                  id="modal-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 text-xs text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 p-1 text-outline hover:text-on-surface cursor-pointer"
                  title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                >
                  <span className="material-symbols-outlined text-[16px]" aria-hidden="true">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-1 py-2.5 px-4 bg-primary text-on-primary hover:bg-primary-container rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm" aria-hidden="true">login</span>
              {isLoading ? 'Verificando...' : 'Iniciar Sesión'}
            </button>
          </form>
        )}

        {/* TAB 3: REGISTER NEW USER */}
        {modalTab === 'register' && (
          <form onSubmit={handleSubmitRegister} className="flex flex-col gap-3">
            <div>
              <label htmlFor="modal-reg-name" className="text-xs font-bold text-on-surface block mb-1">
                Nombre Completo
              </label>
              <input
                id="modal-reg-name"
                type="text"
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="Ej. Ing. Daniel Moreno"
                className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 text-xs text-on-surface outline-none focus:border-primary"
              />
            </div>

            <div>
              <label htmlFor="modal-reg-email" className="text-xs font-bold text-on-surface block mb-1">
                Correo Corporativo
              </label>
              <input
                id="modal-reg-email"
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                placeholder="daniel@nexus.com"
                className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 text-xs text-on-surface outline-none focus:border-primary"
              />
            </div>

            <div>
              <label htmlFor="modal-reg-role" className="text-xs font-bold text-on-surface block mb-1">
                Rol Asignado
              </label>
              <select
                id="modal-reg-role"
                value={regRole}
                onChange={(e) => setRegRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 text-xs text-on-surface outline-none focus:border-primary cursor-pointer"
              >
                <option value="ADMIN_HR">Administrador General de RRHH (ADMIN_HR)</option>
                <option value="MANAGER">Gerente de Área / Evaluador (MANAGER)</option>
                <option value="RECRUITER">Especialista en Selección (RECRUITER)</option>
                <option value="EMPLOYEE">Colaborador / Funcional (EMPLOYEE)</option>
              </select>
            </div>

            <div>
              <label htmlFor="modal-reg-password" className="text-xs font-bold text-on-surface block mb-1">
                Contraseña
              </label>
              <input
                id="modal-reg-password"
                type="password"
                required
                minLength={6}
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-xl bg-surface-container-low border border-outline-variant/40 text-xs text-on-surface outline-none focus:border-primary"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-1 py-2.5 px-4 bg-primary text-on-primary hover:bg-primary-container rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm" aria-hidden="true">person_add</span>
              {isLoading ? 'Registrando...' : 'Registrar e Ingresar'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
