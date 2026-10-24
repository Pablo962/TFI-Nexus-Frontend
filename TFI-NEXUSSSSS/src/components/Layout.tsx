import React, { Suspense, useEffect, useState } from 'react';
import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Breadcrumbs } from './Breadcrumbs';
import { PageLoader } from './SkeletonLoader';
import { CommandPalette } from './CommandPalette';
import { useBreadcrumbs } from '../hooks/useBreadcrumbs';
import { useAuth } from '../context/AuthContext';
import { APP_NAME } from '../routes';

/** Estructura compartida por todas las páginas: menú, cabecera, ruta de navegación y contenido. */
export const Layout: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [selectedCampus, setSelectedCampus] = useState<string>('Campus Central');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('nexus_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('nexus_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const { pathname } = useLocation();
  const crumbs = useBreadcrumbs();
  const moduleKey = pathname.split('/')[1] ?? '';

  // Al cambiar de módulo: volver arriba y cerrar el menú del celular.
  useEffect(() => {
    window.scrollTo({ top: 0 });
    setIsMobileSidebarOpen(false);
  }, [moduleKey]);

  useEffect(() => setIsMobileSidebarOpen(false), [pathname]);

  // El título de la pestaña indica dónde está el usuario.
  const current = crumbs[crumbs.length - 1]?.label ?? 'Inicio';
  useEffect(() => {
    document.title = `${current} · ${APP_NAME}`;
  }, [current]);

  useEffect(() => {
    if (!isMobileSidebarOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setIsMobileSidebarOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMobileSidebarOpen]);

  // Atajo global Ctrl+K / Cmd+K para abrir la paleta de comandos
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return (
    <div className="min-h-screen bg-surface flex text-on-surface antialiased selection:bg-primary/20 selection:text-primary font-body">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[70] focus:bg-primary focus:text-on-primary focus:px-4 focus:py-2 focus:rounded-lg">
        Saltar al contenido
      </a>

      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebarCollapse}
      />

      <div
        className={`flex-1 ml-0 ${
          isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'
        } flex flex-col min-h-screen min-w-0 transition-all duration-300 ease-in-out`}
      >
        <Header
          selectedCampus={selectedCampus}
          onSelectCampus={setSelectedCampus}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
          isSidebarCollapsed={isSidebarCollapsed}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        />

        <main id="contenido" className="flex-1 mt-16 pb-16 overflow-x-hidden">
          <Breadcrumbs />
          <Suspense fallback={<PageLoader />}>
            <Outlet context={{ selectedCampus }} />
          </Suspense>
        </main>
      </div>

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />
    </div>
  );
};
