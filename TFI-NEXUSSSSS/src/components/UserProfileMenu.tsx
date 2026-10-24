import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, DEMO_CREDENTIALS } from '../context/AuthContext';
import { UserRole } from '../types';
import { UserAvatar } from './UserAvatar';

export const UserProfileMenu: React.FC = () => {
  const navigate = useNavigate();
  const { user, role, permissions, loginAs, logout, openLoginModal } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) {
    return (
      <button
        onClick={() => navigate('/login')}
        className="px-3 py-1.5 rounded-lg bg-primary text-on-primary font-semibold text-xs hover:bg-primary-container transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
      >
        <span className="material-symbols-outlined text-[16px]">login</span>
        Iniciar Sesión
      </button>
    );
  }

  const roleLabels: Record<UserRole, { label: string; badgeColor: string }> = {
    ADMIN_HR: { label: 'Administrador RRHH', badgeColor: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20' },
    MANAGER: { label: 'Líder / Manager', badgeColor: 'bg-blue-500/10 text-blue-700 border-blue-500/20' },
    RECRUITER: { label: 'Atracción de Talento', badgeColor: 'bg-amber-500/10 text-amber-800 border-amber-500/20' },
    EMPLOYEE: { label: 'Colaborador', badgeColor: 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20' },
  };

  const currentRoleMeta = roleLabels[role] || { label: role, badgeColor: 'bg-surface-container text-on-surface' };

  return (
    <div className="relative" ref={menuRef}>
      {/* Profile Button in Header */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 pl-2 sm:pl-2.5 pr-1.5 py-1 rounded-lg hover:bg-surface-container transition-colors border border-transparent hover:border-outline-variant/40 cursor-pointer text-left"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Menú de usuario y permisos"
      >
        <UserAvatar
          name={user.name}
          size="sm"
          shape="rounded"
          showStatus={true}
          statusColor={role === 'ADMIN_HR' ? 'emerald' : 'primary'}
        />
        <div className="hidden sm:flex flex-col text-left">
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold text-on-surface leading-tight truncate max-w-[140px]">
              {user.name}
            </span>
          </div>
          <span className="text-[10px] text-outline leading-tight font-medium">
            {role === 'ADMIN_HR' ? 'Administrador' : user.area || role}
          </span>
        </div>
        <span className="material-symbols-outlined text-outline text-[18px]">
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-76 bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant/40 p-3.5 z-50 animate-in fade-in duration-100 flex flex-col gap-3">
          {/* User Card */}
          <div className="flex items-start gap-2.5 pb-2.5 border-b border-outline-variant/30">
            <UserAvatar name={user.name} size="sm" shape="rounded" />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold text-on-surface block truncate">
                {user.name}
              </span>
              <span className="text-[11px] text-outline block truncate">
                {user.email}
              </span>
              <span className={`inline-block mt-1 px-1.5 py-0.2 rounded text-[10px] font-medium border ${currentRoleMeta.badgeColor}`}>
                {currentRoleMeta.label}
              </span>
            </div>
          </div>

          {/* Permissions Overview */}
          <div className="p-2.5 bg-surface-container-low rounded-lg flex flex-col gap-1 text-xs">
            <div className="flex items-center justify-between text-[11px] font-medium text-outline">
              <span>Permisos activos:</span>
              <span className="text-primary font-semibold">
                {role === 'ADMIN_HR' ? 'Acceso Total (16/16)' : `${permissions.length} activos`}
              </span>
            </div>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {role === 'ADMIN_HR' ? (
                <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-800 text-[10px] font-medium">
                  ✓ Control Total de Estructura y RRHH
                </span>
              ) : null}
              {role !== 'ADMIN_HR' && permissions.slice(0, 2).map((p) => (
                <span key={p} className="px-1.5 py-0.2 rounded bg-surface-container text-outline text-[10px] font-medium">
                  {p}
                </span>
              ))}
            </div>
          </div>

          {/* Quick Switch Profiles */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-outline">
              Cambiar rol demo:
            </span>
            <div className="grid grid-cols-2 gap-1">
              {(Object.keys(DEMO_CREDENTIALS) as UserRole[]).map((r) => {
                const isSelected = role === r;
                return (
                  <button
                    key={r}
                    onClick={() => {
                      loginAs(r);
                      setIsOpen(false);
                    }}
                    className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-all text-left flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-primary text-on-primary'
                        : 'bg-surface-container-low hover:bg-surface-container text-on-surface'
                    }`}
                  >
                    <span>{r === 'ADMIN_HR' ? 'Admin' : r}</span>
                    {isSelected && <span className="material-symbols-outlined text-xs">check</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-outline-variant/30 flex items-center justify-between gap-2">
            <button
              onClick={() => {
                setIsOpen(false);
                openLoginModal();
              }}
              className="text-xs text-primary font-medium hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">switch_account</span>
              Otra cuenta
            </button>
            <button
              onClick={() => {
                logout();
                setIsOpen(false);
                navigate('/login');
              }}
              className="text-xs text-rose-600 font-medium hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              Salir
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
