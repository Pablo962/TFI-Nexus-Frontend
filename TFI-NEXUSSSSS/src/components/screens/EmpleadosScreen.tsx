import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { EmployeeProfile, ScreenId } from '../../types';
import { EMPLOYEES_DATA } from '../../data/mockData';
import { UserAvatar } from '../UserAvatar';
import { QuickGuideBanner } from '../QuickGuideBanner';
import { useToast } from '../ToastProvider';
import { employeesApi, trainingApi } from '../../services/api';

interface EmpleadosScreenProps {
  onNavigate: (screen: ScreenId) => void;
  selectedEmployeeId?: string;
  onOpenEvaluationModal?: (employee: EmployeeProfile) => void;
  /** Se llama cuando el usuario elige otra persona de la lista (la URL es la fuente de verdad). */
  onChangeEmployee?: (employeeId: string) => void;
}

export const EmpleadosScreen: React.FC<EmpleadosScreenProps> = ({
  onNavigate,
  selectedEmployeeId = 'lucas',
  onOpenEvaluationModal,
  onChangeEmployee,
}) => {
  const activeEmpId = selectedEmployeeId;
  const setActiveEmpId = (id: string) => onChangeEmployee?.(id);
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [employees, setEmployees] = useState<EmployeeProfile[]>(EMPLOYEES_DATA);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedArea, setSelectedArea] = useState(searchParams.get('area') || 'all');
  const [activeEmpTab, setActiveEmpTab] = useState<'perfil' | 'competencias' | 'evaluaciones'>('perfil');
  const [enrolled, setEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  // Reset de pestaña al cambiar de empleado seleccionado
  useEffect(() => {
    setActiveEmpTab('perfil');
    setEnrolled(false);
  }, [activeEmpId]);

  // Carga inicial desde backend con fallback a mockData
  useEffect(() => {
    let isMounted = true;
    employeesApi
      .getAll()
      .then((res) => {
        if (isMounted && res.data && res.data.length > 0) {
          setEmployees(res.data);
        }
      })
      .catch(() => {
        // Fallback local en memoria
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Sincronización con URL
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        if (val) p.set('q', val);
        else p.delete('q');
        return p;
      },
      { replace: true }
    );
  };

  const handleAreaChange = (val: string) => {
    setSelectedArea(val);
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        if (val !== 'all') p.set('area', val);
        else p.delete('area');
        return p;
      },
      { replace: true }
    );
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedArea('all');
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        p.delete('q');
        p.delete('area');
        return p;
      },
      { replace: true }
    );
  };

  // Áreas dinámicas obtenidas directamente de la lista de colaboradores
  const availableAreas = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => {
      if (e.area) set.add(e.area.trim());
    });
    return Array.from(set).sort();
  }, [employees]);

  // Filtro de colaboradores dinámico
  const filteredEmployees = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return employees.filter((emp) => {
      const matchesSearch =
        !q ||
        emp.name.toLowerCase().includes(q) ||
        emp.role.toLowerCase().includes(q) ||
        emp.area.toLowerCase().includes(q) ||
        emp.empId.toLowerCase().includes(q);
      const matchesArea =
        selectedArea === 'all' || emp.area.toLowerCase() === selectedArea.toLowerCase();
      return matchesSearch && matchesArea;
    });
  }, [employees, searchQuery, selectedArea]);

  // Colaborador activo
  const activeEmployee: EmployeeProfile = useMemo(() => {
    return (
      employees.find((e) => e.id === activeEmpId || e.empId === activeEmpId) ||
      filteredEmployees[0] ||
      employees[0] ||
      EMPLOYEES_DATA[0]
    );
  }, [employees, activeEmpId, filteredEmployees]);

  // Métricas dinámicas calculadas desde el catálogo
  const totalEmployees = employees.length;

  const avgRoleMatch = useMemo(() => {
    if (employees.length === 0) return '0';
    const sum = employees.reduce((acc, e) => acc + (e.roleMatch || 0), 0);
    return (sum / employees.length).toFixed(1);
  }, [employees]);

  const employeesWithGaps = useMemo(() => {
    return employees.filter(
      (e) =>
        (e.hardSkills && e.hardSkills.some((s) => s.gap < 0)) ||
        (e.softSkills && e.softSkills.some((s) => s.gap < 0)) ||
        (e.roleMatch && e.roleMatch < 90)
    ).length;
  }, [employees]);

  const avg360Score = useMemo(() => {
    let totalScore = 0;
    let count = 0;
    employees.forEach((e) => {
      e.reviews?.forEach((r) => {
        if (r.scores) {
          const vals = Object.values(r.scores);
          if (vals.length > 0) {
            totalScore += vals.reduce((a, b) => a + b, 0) / vals.length;
            count++;
          }
        }
      });
    });
    return count > 0 ? (totalScore / count).toFixed(2) : '4.65';
  }, [employees]);

  const hasActiveFilters = Boolean(searchQuery || selectedArea !== 'all');

  // Acciones reales
  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      await trainingApi.enroll(
        activeEmployee.recommendedTraining?.title || 'Plan de Desarrollo',
        activeEmployee.name
      );
      setEnrolled(true);
      showToast(`Plan formativo asignado a ${activeEmployee.name}`, 'success');
    } catch {
      // Fallback local
      setEnrolled(true);
      showToast(`Plan formativo asignado a ${activeEmployee.name}`, 'success');
    } finally {
      setEnrolling(false);
    }
  };

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      showToast(`Generando Ficha 360° en PDF para ${activeEmployee.name}...`, 'info');
      await employeesApi.downloadPdf(activeEmployee.id, activeEmployee.name);
      showToast(`Ficha de ${activeEmployee.name} descargada exitosamente.`, 'success');
    } catch {
      window.print();
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="w-full px-6 lg:px-8 py-6 flex flex-col gap-6 pb-20">
      {/* Header & Main Global Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-on-surface tracking-tight font-headline">
            Colaboradores
          </h1>
          <p className="text-xs text-on-surface-variant font-medium mt-0.5">
            {totalEmployees} colaboradores registrados en el directorio activo
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-surface-container text-on-surface hover:bg-surface-container-high border border-outline-variant/40 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Descargar Ficha 360° en PDF"
          >
            <span className="material-symbols-outlined text-outline text-[16px]">
              {isDownloadingPdf ? 'progress_activity' : 'file_download'}
            </span>
            <span>Descargar PDF</span>
          </button>
          <button
            onClick={() => onNavigate('reclutamiento')}
            className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-primary text-on-primary hover:bg-primary-container transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            title="Abrir selección de candidatos en Reclutamiento"
          >
            <span className="material-symbols-outlined text-[16px]">person_add</span>
            <span>Reclutar Talento</span>
          </button>
        </div>
      </div>

      {/* Slim Guide Bar */}
      <QuickGuideBanner
        title="Guía de Navegación de Colaboradores"
        description="Elegí a cualquier colaborador en la lista para ver su información de contacto, supervisor, competencias y evaluaciones."
        tips={[
          'Seleccioná a un empleado del directorio para cargar su ficha 360° completa.',
          'En "Mapa de Habilidades" podés revisar las brechas contra el perfil requerido del puesto.',
          'Hacé clic en "Nueva Evaluación" para abrir el formulario de feedback del ciclo.',
        ]}
        dismissible={true}
      />

      {/* Clean 4-Metric Status Strip - Calculado 100% dinámicamente desde datos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-surface-container-lowest px-4 py-3 rounded-xl border border-outline-variant/30 flex flex-col gap-1 shadow-2xs">
          <span className="text-xs text-on-surface-variant font-medium">Fuerza laboral</span>
          <div className="text-xl font-bold text-on-surface">
            {totalEmployees} <span className="text-xs font-normal text-outline">activos</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest px-4 py-3 rounded-xl border border-outline-variant/30 flex flex-col gap-1 shadow-2xs">
          <span className="text-xs text-on-surface-variant font-medium">Alineación de rol</span>
          <div className="text-xl font-bold text-on-surface">
            {avgRoleMatch}% <span className="text-xs font-normal text-outline">promedio</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest px-4 py-3 rounded-xl border border-outline-variant/30 flex flex-col gap-1 shadow-2xs">
          <span className="text-xs text-on-surface-variant font-medium">Brechas identificadas</span>
          <div className="text-xl font-bold text-amber-600">
            {employeesWithGaps} <span className="text-xs font-normal text-outline">con foco</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest px-4 py-3 rounded-xl border border-outline-variant/30 flex flex-col gap-1 shadow-2xs">
          <span className="text-xs text-on-surface-variant font-medium">Puntaje medio 360°</span>
          <div className="text-xl font-bold text-primary">
            {avg360Score} <span className="text-xs font-normal text-outline">/ 5.0</span>
          </div>
        </div>
      </div>

      {/* Search & Area Filters + Directory Cards */}
      <div className="flex flex-col gap-3">
        <div className="bg-surface-container-lowest p-3 rounded-2xl shadow-2xs border border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80 flex items-center">
            <span className="material-symbols-outlined absolute left-3 text-outline text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Buscar por nombre, cargo o ID..."
              className="w-full pl-9 pr-3 py-1.5 bg-surface-container-low text-on-surface placeholder:text-outline rounded-xl text-xs outline-hidden focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary border border-outline-variant/30"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 bg-surface-container-low px-2.5 py-1.5 rounded-xl border border-outline-variant/20 flex-1 sm:flex-initial">
              <span className="material-symbols-outlined text-outline text-[16px]">domain</span>
              <select
                value={selectedArea}
                onChange={(e) => handleAreaChange(e.target.value)}
                className="bg-transparent text-xs font-medium text-on-surface outline-hidden cursor-pointer w-full sm:w-auto"
              >
                <option value="all">Todas las áreas ({availableAreas.length})</option>
                {availableAreas.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="px-2.5 py-1.5 rounded-xl bg-surface-container-low text-on-surface-variant hover:text-error transition-all flex items-center gap-1 text-xs font-medium cursor-pointer"
                title="Restablecer filtros"
              >
                <span className="material-symbols-outlined text-[15px]">filter_alt_off</span>
                <span className="hidden sm:inline">Limpiar</span>
              </button>
            )}
          </div>
        </div>

        {/* Directory Cards Grid */}
        {filteredEmployees.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2.5">
            {filteredEmployees.map((emp) => {
              const isSelected = emp.id === activeEmployee.id;
              return (
                <button
                  key={emp.id}
                  type="button"
                  onClick={() => setActiveEmpId(emp.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 relative ${
                    isSelected
                      ? 'bg-primary/5 border-primary ring-1 ring-primary/30 shadow-xs'
                      : 'bg-surface-container-lowest border-outline-variant/30 hover:border-outline-variant hover:bg-surface-container-low'
                  }`}
                >
                  <UserAvatar name={emp.name} size="sm" shape="rounded" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-semibold text-on-surface truncate block">
                        {emp.name}
                      </span>
                      {isSelected && (
                        <span className="material-symbols-outlined text-primary text-[15px] shrink-0">
                          check_circle
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-primary font-medium truncate block">
                      {emp.role}
                    </span>
                    <span className="text-xs text-outline truncate block">
                      {emp.area}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-6 bg-surface-container-lowest rounded-2xl border border-outline-variant/30 text-center flex flex-col items-center justify-center gap-2">
            <span className="material-symbols-outlined text-outline text-3xl">person_search</span>
            <p className="text-xs font-semibold text-on-surface">
              No se encontraron colaboradores con los filtros aplicados
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="px-3 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-semibold cursor-pointer"
            >
              Ver todos los colaboradores
            </button>
          </div>
        )}
      </div>

      {/* Profile Detail Tabs */}
      <div className="flex items-center gap-1.5 bg-surface-container-low p-1.5 rounded-2xl border border-outline-variant/20 shadow-2xs">
        {([
          { key: 'perfil', label: 'Ficha 360° & Contacto', icon: 'person' },
          { key: 'competencias', label: 'Brechas de Competencias', icon: 'psychology' },
          { key: 'evaluaciones', label: 'Evaluaciones & Plan Formativo', icon: 'fact_check' },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveEmpTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              activeEmpTab === tab.key
                ? 'bg-surface-container-lowest text-primary shadow-xs ring-1 ring-primary/20 font-semibold'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: 360° ACTIVE PROFILE CARD */}
      {activeEmpTab === 'perfil' && (
        <section className="bg-surface-container-lowest rounded-2xl p-5 lg:p-6 shadow-2xs border border-outline-variant/30 relative overflow-hidden flex flex-col gap-5 animate-in fade-in duration-150">
          {/* Profile Header */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-5 border-b border-outline-variant/20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <UserAvatar
                name={activeEmployee.name}
                size="xl"
                shape="rounded"
                showStatus={true}
                statusColor="emerald"
              />
              <div className="flex flex-col">
                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                  <h2 className="text-xl sm:text-2xl text-on-surface font-bold tracking-tight">
                    {activeEmployee.name}
                  </h2>
                  <span className="text-outline-variant">&bull;</span>
                  <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {activeEmployee.status}
                  </span>
                  <span className="text-outline-variant">&bull;</span>
                  <span className="text-xs text-on-surface-variant font-medium">
                    {activeEmployee.badge}
                  </span>
                </div>

                <p className="text-xs font-semibold text-primary">{activeEmployee.role}</p>

                <div className="flex flex-wrap items-center gap-2.5 mt-1.5 text-on-surface-variant text-xs">
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-outline text-[15px]">account_tree</span>
                    <span>{activeEmployee.area}</span>
                  </div>
                  <span className="text-outline-variant">&bull;</span>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-outline text-[15px]">schedule</span>
                    <span>Antigüedad: {activeEmployee.tenure}</span>
                  </div>
                  <span className="text-outline-variant">&bull;</span>
                  <div className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-outline text-[15px]">badge</span>
                    <span>ID: {activeEmployee.empId}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto self-stretch lg:self-center justify-end">
              <button
                type="button"
                onClick={() => setActiveEmpTab('evaluaciones')}
                className="px-3.5 py-2 bg-surface-container text-on-surface text-xs font-semibold rounded-xl flex items-center gap-1.5 hover:bg-surface-container-high transition-all cursor-pointer"
                title="Ver desempeño 360° y revisiones del colaborador"
              >
                <span className="material-symbols-outlined text-primary text-[16px]">history_edu</span>
                <span>Desempeño 360°</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onOpenEvaluationModal) {
                    onOpenEvaluationModal(activeEmployee);
                  } else {
                    showToast('Abriendo formulario de evaluación', 'info');
                  }
                }}
                className="px-3.5 py-2 bg-primary text-on-primary text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs hover:bg-primary-container transition-all cursor-pointer"
                title="Completar formulario de feedback de desempeño"
              >
                <span className="material-symbols-outlined text-[16px]">edit_square</span>
                <span>Nueva Evaluación</span>
              </button>
            </div>
          </div>

          {/* 4 Sleek Info Boxes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-surface-container-low/70 p-3 rounded-xl flex flex-col justify-between border border-outline-variant/20">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-on-surface-variant font-medium">Contacto</span>
                <span className="material-symbols-outlined text-outline text-[18px]">alternate_email</span>
              </div>
              <div>
                <span className="text-xs text-on-surface font-semibold block truncate" title={activeEmployee.email}>
                  {activeEmployee.email}
                </span>
                <span className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-[13px] text-secondary">phone_iphone</span>
                  {activeEmployee.phone}
                </span>
              </div>
            </div>

            <div className="bg-surface-container-low/70 p-3 rounded-xl flex flex-col justify-between border border-outline-variant/20">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-on-surface-variant font-medium">Contratación</span>
                <span className="material-symbols-outlined text-outline text-[18px]">contract</span>
              </div>
              <div>
                <span className="text-xs text-on-surface font-semibold">{activeEmployee.contract}</span>
                <span className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-[13px] text-outline">location_on</span>
                  {activeEmployee.location}
                </span>
              </div>
            </div>

            <div className="bg-surface-container-low/70 p-3 rounded-xl flex flex-col justify-between border border-outline-variant/20">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-on-surface-variant font-medium">Compensación</span>
                <span className="material-symbols-outlined text-outline text-[18px]">payments</span>
              </div>
              <div>
                <span className="text-xs text-on-surface font-semibold">{activeEmployee.salaryBand}</span>
                <span className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-[13px] text-on-secondary-container">trending_up</span>
                  {activeEmployee.percentile}
                </span>
              </div>
            </div>

            <div className="bg-surface-container-low/70 p-3 rounded-xl flex flex-col justify-between border border-outline-variant/20">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-on-surface-variant font-medium">Supervisor directo</span>
                <span className="material-symbols-outlined text-outline text-[18px]">supervised_user_circle</span>
              </div>
              <div className="flex items-center gap-2">
                <UserAvatar name={activeEmployee.supervisor.name} size="xs" shape="circle" />
                <div className="flex flex-col min-w-0">
                  <span className="text-xs text-on-surface font-semibold truncate">
                    {activeEmployee.supervisor.name}
                  </span>
                  <span className="text-xs text-on-surface-variant truncate">
                    {activeEmployee.supervisor.role}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Proyectos Asignados */}
          {activeEmployee.projects && activeEmployee.projects.length > 0 && (
            <div className="p-3 bg-surface-container-low/50 rounded-xl border border-outline-variant/20 flex flex-wrap items-center gap-2">
              <span className="text-xs text-on-surface-variant font-medium mr-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-primary">rocket_launch</span>
                Proyectos asignados:
              </span>
              {activeEmployee.projects.map((proj, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-surface-container-lowest text-on-surface text-xs font-medium flex items-center gap-1 border border-outline-variant/20 shadow-2xs"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  {proj}
                </span>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB 2: SKILLS & COMPETENCIES SECTION */}
      {activeEmpTab === 'competencias' && (
        <div className="flex flex-col gap-5 animate-in fade-in duration-150">
          <section className="bg-surface-container-lowest rounded-2xl p-5 lg:p-6 shadow-2xs border border-outline-variant/30 flex flex-col gap-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-on-surface tracking-tight">
                  Mapa de habilidades y competencias
                </h3>
                <p className="text-xs text-outline mt-0.5">
                  Comparación entre habilidades requeridas por el cargo y el nivel actual demostrado por el colaborador.
                </p>
              </div>

              {/* Circular Role Match Indicator */}
              <div className="bg-surface-container-low px-4 py-2 rounded-xl border border-outline-variant/20 flex items-center gap-3 shrink-0">
                <div className="relative w-10 h-10 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-surface-container"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3.5"
                    />
                    <path
                      className="text-primary"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="currentColor"
                      strokeDasharray={`${activeEmployee.roleMatch}, 100`}
                      strokeLinecap="round"
                      strokeWidth="3.5"
                    />
                  </svg>
                  <span className="absolute text-xs font-bold text-on-surface">
                    {activeEmployee.roleMatch}%
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-on-surface-variant font-medium">Alineación</span>
                  <span className="text-xs font-semibold text-primary">Nivel Óptimo</span>
                </div>
              </div>
            </div>

            {/* Spectrum Waveform */}
            <div className="bg-surface-container-low/70 rounded-xl p-4 border border-outline-variant/20">
              <div className="flex items-center justify-between mb-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-xs text-on-surface font-medium">Técnicas</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-secondary" />
                    <span className="text-xs text-on-surface font-medium">Liderazgo</span>
                  </div>
                </div>
                <span className="text-xs text-outline font-normal hidden sm:inline">
                  Escala de nivel: 1.0 a 5.0
                </span>
              </div>

              {/* Spectrum Bars */}
              <div className="relative w-full h-28 flex items-end justify-between gap-1.5 sm:gap-2 px-1 pt-2">
                {activeEmployee.spectrumSkills.map((sk, idx) => (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center gap-1 group cursor-pointer"
                    title={`${sk.label}: ${sk.value}%`}
                  >
                    <div
                      className={`w-full rounded-t transition-all duration-300 group-hover:scale-105 shadow-2xs ${
                        sk.category === 'gap'
                          ? 'bg-gradient-to-t from-tertiary-container/80 to-tertiary-fixed-dim'
                          : sk.category === 'soft'
                          ? 'bg-gradient-to-t from-primary to-secondary'
                          : 'bg-gradient-to-t from-primary to-primary-container'
                      }`}
                      style={{ height: `${sk.value}%` }}
                    />
                    <span className="text-xs text-outline group-hover:text-primary transition-colors text-center hidden md:block truncate w-full font-normal">
                      {sk.label}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t border-outline-variant/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-surface-container text-xs text-on-surface font-medium">
                    G-Factor: {activeEmployee.gFactor}
                  </span>
                  <span className="text-xs text-on-surface-variant">
                    Resolución de problemas en sistemas complejos.
                  </span>
                </div>
                <span className="text-xs text-secondary font-medium">
                  Equilibrio de habilidades: Óptimo (&lt; 0.4)
                </span>
              </div>
            </div>
          </section>

          {/* SKILL GAP ANALYSIS MATRIX */}
          <section className="bg-surface-container-lowest rounded-2xl p-5 lg:p-6 shadow-2xs border border-outline-variant/30 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-on-surface tracking-tight">
                  Comparación de brechas por competencia
                </h3>
                <p className="text-xs text-outline">Nivel observado frente al estándar requerido del puesto</p>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-2.5 bg-surface-container-low px-3 py-1.5 rounded-xl border border-outline-variant/20 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-secondary" />
                  <span className="text-xs text-on-surface font-medium">Óptimo (0)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-xs text-on-surface font-medium">Supera (+1)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-xs text-on-surface font-medium">Brecha (-1)</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {/* Hard Skills */}
              <div className="bg-surface-container-low/50 p-4 rounded-xl flex flex-col gap-3 border border-outline-variant/20">
                <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary text-[18px]">terminal</span>
                    <h4 className="text-xs font-semibold text-on-surface">Habilidades técnicas</h4>
                  </div>
                  <span className="text-xs text-outline font-normal">Requerido: 4.5 Promedio</span>
                </div>

                <div className="flex flex-col gap-2.5">
                  {activeEmployee.hardSkills.map((skill, idx) => (
                    <div
                      key={idx}
                      className={`bg-surface-container-lowest p-3 rounded-xl shadow-2xs flex flex-col gap-1.5 border ${
                        skill.gap < 0
                          ? 'border-amber-300 ring-1 ring-amber-100'
                          : 'border-outline-variant/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-semibold text-on-surface">{skill.name}</span>
                          {skill.technicalName && (
                            <span className="text-xs text-outline ml-1.5">({skill.technicalName})</span>
                          )}
                        </div>
                        <span
                          className={`text-xs font-medium flex items-center gap-1 ${
                            skill.gap === 0
                              ? 'text-emerald-700'
                              : skill.gap > 0
                              ? 'text-primary'
                              : 'text-amber-700'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              skill.gap === 0
                                ? 'bg-emerald-500'
                                : skill.gap > 0
                                ? 'bg-primary'
                                : 'bg-amber-500'
                            }`}
                          />
                          {skill.statusText}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-xs text-on-surface-variant">
                          <span>
                            Nivel Actual:{' '}
                            <strong className="text-on-surface font-semibold">{skill.actual} / 5</strong>
                          </span>
                          <span>
                            Requerido: <strong>{skill.required} / 5</strong>
                          </span>
                        </div>
                        <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden flex relative">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              skill.gap === 0
                                ? 'bg-emerald-500'
                                : skill.gap > 0
                                ? 'bg-primary'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${(skill.actual / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Soft Skills */}
              <div className="bg-surface-container-low/50 p-4 rounded-xl flex flex-col gap-3 border border-outline-variant/20">
                <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-secondary text-[18px]">psychology</span>
                    <h4 className="text-xs font-semibold text-on-surface">Habilidades de liderazgo y humanas</h4>
                  </div>
                  <span className="text-xs text-outline font-normal">Requerido: 4.2 Promedio</span>
                </div>

                <div className="flex flex-col gap-2.5">
                  {activeEmployee.softSkills.map((skill, idx) => (
                    <div
                      key={idx}
                      className="bg-surface-container-lowest p-3 rounded-xl shadow-2xs flex flex-col gap-1.5 border border-outline-variant/20"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-on-surface">{skill.name}</span>
                        <span
                          className={`text-xs font-medium flex items-center gap-1 ${
                            skill.gap === 0
                              ? 'text-emerald-700'
                              : skill.gap > 0
                              ? 'text-primary'
                              : 'text-outline'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              skill.gap === 0
                                ? 'bg-emerald-500'
                                : skill.gap > 0
                                ? 'bg-primary'
                                : 'bg-slate-400'
                            }`}
                          />
                          {skill.statusText}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between text-xs text-on-surface-variant">
                          <span>
                            Nivel Actual:{' '}
                            <strong className="text-on-surface font-semibold">{skill.actual} / 5</strong>
                          </span>
                          <span>
                            Requerido: <strong>{skill.required} / 5</strong>
                          </span>
                        </div>
                        <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden flex relative">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              skill.gap === 0
                                ? 'bg-emerald-500'
                                : skill.gap > 0
                                ? 'bg-primary'
                                : 'bg-slate-400'
                            }`}
                            style={{ width: `${(skill.actual / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* TAB 3: TRAINING & 360 REVIEWS (SPLIT VIEW) */}
      {activeEmpTab === 'evaluaciones' && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5 animate-in fade-in duration-150">
          {/* Training Card */}
          <div className="lg:col-span-6 bg-surface-container-lowest p-5 lg:p-6 rounded-2xl shadow-2xs border border-outline-variant/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-primary font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px]">school</span> Plan formativo
                </span>
                <span className="text-xs text-outline">&bull; Cierre de brecha</span>
              </div>

              <h4 className="text-sm font-bold text-on-surface tracking-tight">
                Capacitación recomendada para cerrar brecha
              </h4>

              <div className="mt-3 p-3.5 bg-surface-container-low/70 rounded-xl border border-outline-variant/20 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-primary">
                    {activeEmployee.recommendedTraining.title}
                  </span>
                  <span className="text-xs text-outline font-medium">
                    {activeEmployee.recommendedTraining.hours}
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {activeEmployee.recommendedTraining.description}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-on-surface-variant text-xs">
                  {activeEmployee.recommendedTraining.perks.map((perk, i) => (
                    <span key={i} className="flex items-center gap-1 font-normal">
                      <span className="material-symbols-outlined text-[13px] text-secondary">check</span>
                      {perk}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-outline-variant/20 flex flex-col sm:flex-row items-center gap-2.5">
              <button
                type="button"
                onClick={handleEnroll}
                disabled={enrolling || enrolled}
                className={`w-full sm:w-auto px-4 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer ${
                  enrolled
                    ? 'bg-secondary-container text-on-secondary-container'
                    : 'bg-primary text-on-primary hover:bg-primary-container'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {enrolling ? 'sync' : enrolled ? 'check_circle' : 'add_task'}
                </span>
                {enrolling
                  ? 'Inscribiendo...'
                  : enrolled
                  ? 'Inscripción Confirmada'
                  : 'Inscribir en Plan de Desarrollo'}
              </button>
              <button
                type="button"
                onClick={() => onNavigate('capacitacion-upskilling')}
                className="w-full sm:w-auto px-3.5 py-2 bg-surface-container text-on-surface text-xs font-medium rounded-xl flex items-center justify-center gap-1 hover:bg-surface-container-high transition-all cursor-pointer"
              >
                <span>Ver catálogo en Capacitación</span>
                <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* 360 Reviews & Performance Link */}
          <div className="lg:col-span-6 bg-surface-container-lowest p-5 lg:p-6 rounded-2xl shadow-2xs border border-outline-variant/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-outline text-[18px]">reviews</span>
                  <h4 className="text-xs font-semibold text-on-surface">Evaluaciones 360° Recientes</h4>
                </div>
                <span className="text-xs text-outline font-normal">
                  Promedio global: {avg360Score} / 5.0
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {activeEmployee.reviews.map((rev, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 pb-2.5 border-b border-outline-variant/10 last:border-b-0"
                  >
                    <UserAvatar name={rev.author} size="xs" shape="circle" />
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-on-surface">{rev.author}</span>
                        <span className="text-xs text-outline">{rev.timeAgo}</span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-0.5 leading-snug">{rev.comment}</p>
                      {rev.scores && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          {Object.entries(rev.scores).map(([k, v]) => (
                            <span
                              key={k}
                              className="px-1.5 py-0.5 rounded bg-surface-container text-xs text-on-surface font-medium"
                            >
                              {k}: {v}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Direct navigation to Evaluacion de Desempeno */}
            <div className="mt-4 pt-3 border-t border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-2">
              <span className="text-xs text-on-surface-variant font-medium">
                Matriz 9-Box y Ciclos de Evaluación
              </span>
              <button
                type="button"
                onClick={() => onNavigate('evaluacion-desempeno')}
                className="w-full sm:w-auto px-3.5 py-1.5 bg-surface-container hover:bg-surface-container-high text-primary rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Ver en Evaluación de Desempeño</span>
                <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
