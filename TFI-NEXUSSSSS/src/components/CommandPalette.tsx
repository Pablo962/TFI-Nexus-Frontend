import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { JOB_POSITIONS, EMPLOYEES_DATA } from '../data/mockData';
import { MODULES } from '../routes';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

type ResultItem = {
  id: string;
  label: string;
  sublabel?: string;
  icon: string;
  path: string;
  category: 'Navegación' | 'Puestos' | 'Colaboradores';
};

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedIdx, setSelectedIdx] = useState(0);

  // Focus y reset al abrir
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIdx(0);
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const results = useMemo<ResultItem[]>(() => {
    const q = query.toLowerCase().trim();

    // Sin query: mostrar módulos principales de navegación
    if (!q) {
      return MODULES.map((m) => ({
        id: m.path,
        label: m.title,
        sublabel: m.subtitle,
        icon: m.icon,
        path: m.path,
        category: 'Navegación' as const,
      }));
    }

    const navResults: ResultItem[] = MODULES.filter(
      (m) => m.title.toLowerCase().includes(q) || m.subtitle.toLowerCase().includes(q)
    ).map((m) => ({
      id: m.path,
      label: m.title,
      sublabel: m.subtitle,
      icon: m.icon,
      path: m.path,
      category: 'Navegación' as const,
    }));

    const jobResults: ResultItem[] = JOB_POSITIONS.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        j.code.toLowerCase().includes(q) ||
        j.department.toLowerCase().includes(q)
    )
      .slice(0, 5)
      .map((j) => ({
        id: j.code,
        label: j.title,
        sublabel: `${j.code} • ${j.department}`,
        icon: j.status === 'critical' ? 'vpn_key' : 'work',
        path: `/puestos/${j.code}`,
        category: 'Puestos' as const,
      }));

    const empResults: ResultItem[] = EMPLOYEES_DATA.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.role.toLowerCase().includes(q) ||
        e.area.toLowerCase().includes(q) ||
        e.empId.toLowerCase().includes(q)
    )
      .slice(0, 5)
      .map((e) => ({
        id: e.id,
        label: e.name,
        sublabel: `${e.role} • ${e.area}`,
        icon: 'person',
        path: `/personas/${e.id}`,
        category: 'Colaboradores' as const,
      }));

    return [...navResults, ...jobResults, ...empResults].slice(0, 12);
  }, [query]);

  const clampedIdx = Math.min(selectedIdx, Math.max(0, results.length - 1));

  const handleSelect = useCallback(
    (item: ResultItem) => {
      navigate(item.path);
      onClose();
    },
    [navigate, onClose]
  );

  // Navegación por teclado
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIdx((prev) => (prev + 1 >= results.length ? 0 : prev + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIdx((prev) => (prev - 1 < 0 ? Math.max(0, results.length - 1) : prev - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[clampedIdx]) {
          handleSelect(results[clampedIdx]);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose, results, clampedIdx, handleSelect]);

  if (!isOpen) return null;

  // Agrupar por categoría manteniendo el orden
  const grouped = results.reduce<Record<string, { item: ResultItem; globalIdx: number }[]>>(
    (acc, item, idx) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push({ item, globalIdx: idx });
      return acc;
    },
    {}
  );

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center pt-16 sm:pt-24 px-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      {/* Fondo borroso */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" aria-hidden="true" />

      {/* Panel flotante de comandos */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Paleta de comandos"
        className="relative w-full max-w-xl bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/40 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra de entrada */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-outline-variant/20">
          <span className="material-symbols-outlined text-primary text-xl">search</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIdx(0);
            }}
            placeholder="Buscar módulos, puestos, colaboradores (ej: Lucas, Arquitecto, Cadena)..."
            className="flex-1 bg-transparent text-sm text-on-surface placeholder:text-outline outline-hidden font-medium"
            aria-label="Buscar en NEXUS"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container cursor-pointer"
              title="Borrar texto"
            >
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container text-[10px] font-mono font-bold text-outline border border-outline-variant/30">
            ESC
          </kbd>
        </div>

        {/* Lista de resultados */}
        <div className="overflow-y-auto max-h-96 p-2" role="listbox">
          {results.length === 0 ? (
            <div className="py-10 text-center text-sm text-on-surface-variant flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-outline text-3xl">search_off</span>
              <p>
                No se encontraron resultados para <strong>«{query}»</strong>
              </p>
              <p className="text-xs text-outline">Probá buscando por nombre, código de puesto o módulo.</p>
            </div>
          ) : (
            Object.entries(grouped).map(([category, entries]) => (
              <div key={category} className="mb-2">
                <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-outline">
                  {category}
                </div>
                {entries.map(({ item, globalIdx }) => {
                  const isActive = globalIdx === clampedIdx;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIdx(globalIdx)}
                      className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer ${
                        isActive
                          ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
                          : 'hover:bg-surface-container-low text-on-surface'
                      }`}
                    >
                      <span
                        className={`material-symbols-outlined text-[20px] ${
                          isActive ? 'text-primary' : 'text-outline'
                        }`}
                      >
                        {item.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs sm:text-sm font-bold block truncate">{item.label}</span>
                        {item.sublabel && (
                          <span className="text-[11px] text-on-surface-variant truncate block">
                            {item.sublabel}
                          </span>
                        )}
                      </div>
                      {isActive && (
                        <span className="hidden sm:inline text-[10px] font-mono text-primary font-bold bg-primary-fixed/50 px-1.5 py-0.5 rounded">
                          Enter ↵
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Pie informativo */}
        <div className="px-4 py-2 border-t border-outline-variant/20 bg-surface-container-low/50 flex items-center justify-between text-[11px] text-outline">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="bg-surface-container border border-outline-variant/30 rounded px-1 font-mono text-[10px]">
                ↑↓
              </kbd>
              Navegar
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-surface-container border border-outline-variant/30 rounded px-1 font-mono text-[10px]">
                ↵
              </kbd>
              Abrir
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-surface-container border border-outline-variant/30 rounded px-1 font-mono text-[10px]">
                Esc
              </kbd>
              Cerrar
            </span>
          </div>
          <span className="font-semibold text-primary">NEXUS QuickNav</span>
        </div>
      </div>
    </div>
  );
};
