import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfileMenu } from './UserProfileMenu';

interface HeaderProps {
  selectedCampus: string;
  onSelectCampus: (campus: string) => void;
  onToggleMobileSidebar?: () => void;
  isSidebarCollapsed?: boolean;
  onOpenCommandPalette?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedCampus,
  onSelectCampus,
  onToggleMobileSidebar,
  isSidebarCollapsed = false,
  onOpenCommandPalette,
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Fecha actual formateada en español
  const today = new Date();
  const rawDate = new Intl.DateTimeFormat('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(today);
  const formattedCurrentDate =
    rawDate.charAt(0).toUpperCase() + rawDate.slice(1);

  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: 'Nueva sugerencia de curso',
      desc: 'Ing. Lucas Valenzuela puede beneficiarse del curso de Gestión de Costos en la Nube.',
      time: 'Hace 10 min',
      path: '/capacitacion',
      unread: true,
    },
    {
      id: 2,
      title: 'Nuevo candidato recomendado',
      desc: 'Mateo Silveira tiene un 96% de afinidad para el puesto de Arquitecto.',
      time: 'Hace 45 min',
      path: '/reclutamiento',
      unread: true,
    },
    {
      id: 3,
      title: 'Evaluación lista para revisión',
      desc: 'El comité revisó las notas del ciclo actual.',
      time: 'Hace 2 horas',
      path: '/desempeno',
      unread: false,
    },
  ]);

  const quickLinks = [
    { label: 'Sofía Méndez (Líder de Ingeniería en IA)', path: '/personas/sofia' },
    { label: 'Ing. Lucas Valenzuela (Arquitecto Principal de Nube)', path: '/personas/lucas' },
    { label: 'PUE-2026-ARCH-03 (Arquitecto de Nube e IA)', path: '/puestos/PUE-2026-ARCH-03' },
    { label: 'Áreas y Actividades: Operaciones Centrales', path: '/cadena-valor' },
    { label: 'Selección de Personal (12 candidatos en proceso)', path: '/reclutamiento' },
    { label: 'Ver matriz de desempeño (9 cajas)', path: '/desempeno' },
    { label: 'Capacitación: catálogo de cursos', path: '/capacitacion' },
  ];

  const filteredLinks = quickLinks.filter((item) =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  return (
    <header
      className={`fixed top-0 left-0 ${
        isSidebarCollapsed ? 'lg:left-20' : 'lg:left-72'
      } right-0 h-16 bg-surface-container-lowest/85 backdrop-blur-md z-30 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 sm:gap-6 border-b border-outline-variant/40 transition-all duration-300 ease-in-out`}
    >
      {/* Mobile Menu Button + Search Bar */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-xl">
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer shrink-0"
          title="Abrir menú de navegación"
          aria-label="Abrir menú"
        >
          <span className="material-symbols-outlined text-xl">menu</span>
        </button>

        <div className="relative flex items-center w-full">
          <span className="material-symbols-outlined absolute left-3 text-outline/80 pointer-events-none text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onClick={() => onOpenCommandPalette?.()}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchResults(true);
            }}
            onFocus={() => {
              if (onOpenCommandPalette) {
                onOpenCommandPalette();
              } else {
                setShowSearchResults(true);
              }
            }}
            onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
            placeholder="Buscar puestos, personas, módulos..."
            className="w-full pl-9 pr-16 py-1.5 bg-surface-container-low text-on-surface placeholder:text-outline text-xs sm:text-sm rounded-lg outline-none border border-outline-variant/50 focus:border-primary/50 focus:bg-surface-container-lowest transition-all"
          />
          {onOpenCommandPalette && (
            <button
              type="button"
              onClick={onOpenCommandPalette}
              className="absolute right-2 px-1.5 py-0.5 rounded bg-surface-container text-[10px] font-mono font-semibold text-outline hover:text-on-surface border border-outline-variant/40 transition-all cursor-pointer hidden sm:flex items-center gap-0.5"
              title="Abrir buscador rápido (Ctrl+K)"
            >
              <span>Ctrl+K</span>
            </button>
          )}
        </div>

        {/* Live Search Quick Results Dropdown */}
        {showSearchResults && searchQuery.trim().length > 0 && (
          <div className="absolute top-full left-4 sm:left-6 right-4 sm:right-6 max-w-xl mt-1.5 bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant/40 p-1.5 z-50 animate-in fade-in duration-100">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-outline px-3 py-1">
              Accesos Rápidos
            </div>
            {filteredLinks.length > 0 ? (
              filteredLinks.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    navigate(item.path);
                    setSearchQuery('');
                    setShowSearchResults(false);
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium text-on-surface hover:bg-surface-container-low hover:text-primary transition-colors flex items-center justify-between cursor-pointer"
                >
                  <span>{item.label}</span>
                  <span className="text-[11px] text-primary font-semibold">Ir →</span>
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-xs text-on-surface-variant">
                No se encontraron resultados para &quot;{searchQuery}&quot;.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Current Date Minimalist */}
        <div className="hidden xl:flex items-center gap-1.5 text-xs text-outline font-medium px-2 py-1">
          <span className="material-symbols-outlined text-[16px] text-outline/80">
            calendar_today
          </span>
          <span>{formattedCurrentDate}</span>
        </div>

        {/* Campus Selector Minimalist */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-surface-container-low rounded-lg text-on-surface border border-outline-variant/40 hover:border-outline-variant/70 transition-colors">
          <span className="material-symbols-outlined text-outline text-[16px]">
            domain
          </span>
          <select
            value={selectedCampus}
            onChange={(e) => onSelectCampus(e.target.value)}
            className="bg-transparent text-xs font-semibold text-on-surface outline-none cursor-pointer"
            aria-label="Seleccionar sede u oficina"
          >
            <option value="Campus Central">Campus Central</option>
            <option value="Sede Concepción">Sede Concepción</option>
            <option value="Sede Monteros">Sede Monteros</option>
            <option value="Sede Alberdi">Sede Alberdi</option>
          </select>
        </div>

        {/* Notifications Button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative h-8 w-8 flex items-center justify-center rounded-lg text-outline hover:text-on-surface hover:bg-surface-container transition-all cursor-pointer"
            title="Ver notificaciones"
            aria-label="Notificaciones"
          >
            <span className="material-symbols-outlined text-[19px]">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary" />
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifications && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} aria-hidden="true" />
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant/40 p-3 z-50 animate-in fade-in duration-100">
                <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20 mb-2">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-bold text-on-surface">
                      Notificaciones
                    </h4>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-primary/10 text-primary">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[11px] font-medium text-primary hover:underline cursor-pointer"
                    >
                      Marcar leídas
                    </button>
                  )}
                </div>

                <div className="space-y-1.5 max-h-72 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, unread: false } : x)));
                        navigate(n.path);
                        setShowNotifications(false);
                      }}
                      className={`p-2.5 rounded-lg cursor-pointer transition-colors text-left ${
                        n.unread
                          ? 'bg-primary/5 hover:bg-primary/10 border-l-2 border-primary'
                          : 'hover:bg-surface-container-low'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-semibold text-on-surface">{n.title}</span>
                        <span className="text-[10px] text-outline">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-on-surface-variant leading-snug">{n.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* User Profile & Permissions Menu */}
        <div className="pl-1 sm:pl-2 border-l border-outline-variant/30 flex items-center">
          <UserProfileMenu />
        </div>
      </div>
    </header>
  );
};
