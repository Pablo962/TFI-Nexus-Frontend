import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { APP_NAME, MODULES, NAV_GROUPS } from '../routes';

interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

/** Menú lateral con diseño minimalista. Soporta modo expandido y colapsado (solo iconos). */
export const Sidebar: React.FC<SidebarProps> = ({
  isMobileOpen = false,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  return (
    <>
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/30 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      <aside
        aria-label="Menú principal"
        className={`fixed top-0 bottom-0 left-0 bg-surface-container-lowest z-50 flex flex-col border-r border-outline-variant/40 transition-all duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'lg:w-20' : 'lg:w-72'}`}
      >
        {/* Sidebar Header */}
        <div
          className={`h-16 border-b border-outline-variant/30 shrink-0 flex items-center relative ${
            isCollapsed ? 'justify-center px-2' : 'justify-between px-5'
          }`}
        >
          {isCollapsed ? (
            <div className="flex items-center justify-center w-full relative">
              <Link
                to="/"
                onClick={onCloseMobile}
                className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary hover:opacity-90 transition-opacity"
                title={`${APP_NAME} - Ir al inicio`}
                aria-label={`${APP_NAME} - Ir al inicio`}
              >
                <span className="material-symbols-outlined text-[20px]">hub</span>
              </Link>
              <button
                type="button"
                onClick={onToggleCollapse}
                className="hidden lg:flex absolute -right-3.5 top-1 w-5 h-5 rounded-full bg-surface-container-lowest border border-outline-variant/60 items-center justify-center text-outline hover:text-primary hover:border-primary transition-all cursor-pointer z-50"
                title="Expandir menú lateral"
                aria-label="Expandir menú lateral"
              >
                <span className="material-symbols-outlined text-xs">chevron_right</span>
              </button>
            </div>
          ) : (
            <>
              <Link
                to="/"
                onClick={onCloseMobile}
                className="flex items-center gap-2.5 group min-w-0"
                aria-label={`${APP_NAME} - Ir al inicio`}
              >
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary shrink-0">
                  <span className="material-symbols-outlined text-[20px]">hub</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-base tracking-tight text-on-surface font-bold group-hover:text-primary transition-colors truncate">
                    {APP_NAME}
                  </span>
                  <span className="text-[10px] text-outline font-medium truncate">
                    Gestión Integral de Talento
                  </span>
                </div>
              </Link>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  className="hidden lg:flex p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                  title="Colapsar menú lateral"
                  aria-label="Colapsar menú lateral"
                >
                  <span className="material-symbols-outlined text-lg">menu_open</span>
                </button>
                <button
                  type="button"
                  onClick={onCloseMobile}
                  className="lg:hidden p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                  title="Cerrar menú"
                  aria-label="Cerrar menú"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>
            </>
          )}
        </div>

        {/* Navigation Items */}
        <div
          className={`flex-1 overflow-y-auto py-3 space-y-3 ${
            isCollapsed ? 'px-2' : 'px-3'
          }`}
        >
          {NAV_GROUPS.map((group) => (
            <nav key={group.key} aria-label={group.label} className="space-y-0.5">
              {isCollapsed ? (
                <div className="w-6 h-px bg-outline-variant/30 my-2 mx-auto" />
              ) : (
                <div className="px-3 pb-1 pt-1.5">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-outline/70">
                    {group.label}
                  </div>
                </div>
              )}

              {MODULES.filter((m) => m.group === group.key).map((item) => (
                <NavLink
                  key={item.id}
                  to={item.path}
                  end={item.path === '/'}
                  onClick={onCloseMobile}
                  title={isCollapsed ? item.title : undefined}
                  className={({ isActive }) =>
                    `rounded-lg transition-all group flex items-center ${
                      isCollapsed
                        ? `justify-center h-9 w-9 mx-auto ${
                            isActive
                              ? 'bg-primary/10 text-primary font-semibold'
                              : 'text-on-surface-variant hover:bg-surface-container/70 hover:text-on-surface'
                          }`
                        : `justify-between px-3 py-1.5 w-full text-left ${
                            isActive
                              ? 'bg-primary/10 text-primary font-semibold'
                              : 'text-on-surface-variant hover:bg-surface-container/70 hover:text-on-surface'
                          }`
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div
                        className={`flex items-center ${
                          isCollapsed ? 'justify-center relative' : 'gap-2.5 min-w-0'
                        }`}
                      >
                        <span
                          className={`material-symbols-outlined text-[19px] shrink-0 ${
                            isActive ? 'text-primary' : 'text-outline/90 group-hover:text-primary'
                          }`}
                          aria-hidden="true"
                        >
                          {item.icon}
                        </span>
                        {!isCollapsed && (
                          <span
                            className={`text-xs truncate ${
                              isActive ? 'font-semibold text-primary' : 'font-medium text-on-surface'
                            }`}
                          >
                            {item.title}
                          </span>
                        )}
                        {isCollapsed && item.id === 'reclutamiento' && (
                          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-primary" />
                        )}
                      </div>
                      {!isCollapsed && item.id === 'reclutamiento' && (
                        <span
                          className={`text-[10px] font-medium px-1.5 py-0.2 rounded-full shrink-0 ml-1.5 ${
                            isActive ? 'bg-primary/20 text-primary' : 'bg-surface-container text-outline'
                          }`}
                        >
                          12
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          ))}
        </div>

        {/* Footer / Toggle & Help Center */}
        <div className="p-2 border-t border-outline-variant/30 shrink-0">
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={onToggleCollapse}
                className="w-8 h-8 rounded-lg text-outline hover:text-primary hover:bg-surface-container transition-colors flex items-center justify-center cursor-pointer"
                title="Expandir menú lateral"
                aria-label="Expandir menú lateral"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-outline hover:text-primary"
                title="Centro de Ayuda"
              >
                <span className="material-symbols-outlined text-[17px]">help_outline</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-1 px-1">
              <div className="px-2 py-1 rounded-lg bg-surface-container-low flex items-center gap-2 text-xs flex-1 min-w-0">
                <span className="material-symbols-outlined text-outline text-[16px] shrink-0">
                  help_outline
                </span>
                <span className="text-[11px] font-medium text-on-surface-variant truncate">
                  Centro de Ayuda
                </span>
              </div>
              <button
                type="button"
                onClick={onToggleCollapse}
                className="hidden lg:flex p-1.5 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer shrink-0"
                title="Colapsar menú lateral"
                aria-label="Colapsar menú lateral"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
