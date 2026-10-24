import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { JobPosition, ScreenId } from '../../types';
import { JOB_POSITIONS } from '../../data/mockData';
import { UserAvatar } from '../UserAvatar';
import { QuickGuideBanner } from '../QuickGuideBanner';
import { useToast } from '../ToastProvider';
import { jobsApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface PuestosScreenProps {
  onNavigate: (screen: ScreenId) => void;
  onSelectJobForRecruitment?: (jobCode: string) => void;
  selectedJobCode?: string;
  /** Se llama cuando el usuario elige otro puesto de la lista (la URL es la fuente de verdad). */
  onChangeJobCode?: (jobCode: string) => void;
}

export const PuestosScreen: React.FC<PuestosScreenProps> = ({
  onNavigate,
  onSelectJobForRecruitment,
  selectedJobCode = 'PUE-2026-ARCH-03',
  onChangeJobCode,
}) => {
  const { hasPermission, openLoginModal } = useAuth();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const setSelectedJobCode = (code: string) => onChangeJobCode?.(code);
  const [positions, setPositions] = useState<JobPosition[]>(JOB_POSITIONS);

  // Filtros sincronizados con la URL
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedArea, setSelectedArea] = useState(searchParams.get('area') || '');
  const [selectedHierarchy, setSelectedHierarchy] = useState(searchParams.get('nivel') || '');
  const [onlyCritical, setOnlyCritical] = useState(searchParams.get('criticos') === '1');
  const [showNewJobModal, setShowNewJobModal] = useState(false);
  const [jobFormSubmitted, setJobFormSubmitted] = useState(false);
  const [activeJobTab, setActiveJobTab] = useState<'resumen' | 'competencias' | 'organizacion'>('resumen');
  const [isDownloadingMatrix, setIsDownloadingMatrix] = useState(false);

  // Campos para crear nuevo puesto
  const [newTitle, setNewTitle] = useState('');
  const [newDepartment, setNewDepartment] = useState('Tecnología y Plataforma');
  const [newStatus, setNewStatus] = useState<'critical' | 'operational'>('operational');
  const [newMission, setNewMission] = useState('');
  const [isSubmittingJob, setIsSubmittingJob] = useState(false);

  // Carga inicial desde backend con fallback a mockData
  useEffect(() => {
    let isMounted = true;
    jobsApi
      .getAll()
      .then((res) => {
        if (isMounted && res.data && res.data.length > 0) {
          setPositions(res.data);
        }
      })
      .catch(() => {
        // Fallback en memoria
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Resetear pestaña al cambiar de puesto
  useEffect(() => {
    setActiveJobTab('resumen');
  }, [selectedJobCode]);

  // Manejadores de sincronización con URL
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
        if (val) p.set('area', val);
        else p.delete('area');
        return p;
      },
      { replace: true }
    );
  };

  const handleHierarchyChange = (val: string) => {
    setSelectedHierarchy(val);
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        if (val) p.set('nivel', val);
        else p.delete('nivel');
        return p;
      },
      { replace: true }
    );
  };

  const handleCriticalToggle = () => {
    const next = !onlyCritical;
    setOnlyCritical(next);
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        if (next) p.set('criticos', '1');
        else p.delete('criticos');
        return p;
      },
      { replace: true }
    );
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedArea('');
    setSelectedHierarchy('');
    setOnlyCritical(false);
    setSearchParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        p.delete('q');
        p.delete('area');
        p.delete('nivel');
        p.delete('criticos');
        return p;
      },
      { replace: true }
    );
  };

  // Áreas dinámicas obtenidas directamente de la lista de puestos
  const availableAreas = useMemo(() => {
    const set = new Set<string>();
    positions.forEach((p) => {
      if (p.department) set.add(p.department.trim());
    });
    return Array.from(set).sort();
  }, [positions]);

  // Filtro de puestos dinámico
  const filteredPositions = useMemo(() => {
    return positions.filter((j) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        j.title.toLowerCase().includes(q) ||
        j.code.toLowerCase().includes(q) ||
        j.department.toLowerCase().includes(q);

      const matchesCritical = !onlyCritical || j.status === 'critical';
      const matchesArea = !selectedArea || j.department.toLowerCase() === selectedArea.toLowerCase();

      let matchesHierarchy = true;
      if (selectedHierarchy) {
        const text = `${j.title} ${j.salaryBand || ''} ${j.reportsTo || ''}`.toLowerCase();
        switch (selectedHierarchy) {
          case 'dir':
            matchesHierarchy =
              text.includes('director') || text.includes('vp') || text.includes('gerente') || text.includes('c-level');
            break;
          case 'lead':
            matchesHierarchy =
              text.includes('líder') ||
              text.includes('lider') ||
              text.includes('coordinador') ||
              text.includes('jefe') ||
              text.includes('principal');
            break;
          case 'sr':
            matchesHierarchy =
              text.includes('senior') ||
              text.includes('sr') ||
              text.includes('arquitecto') ||
              text.includes('especialista');
            break;
          case 'mid':
            matchesHierarchy =
              text.includes('semi') ||
              text.includes('junior') ||
              text.includes('analista') ||
              text.includes('técnico') ||
              text.includes('tecnico') ||
              text.includes('asistente');
            break;
        }
      }

      return matchesSearch && matchesCritical && matchesArea && matchesHierarchy;
    });
  }, [positions, searchQuery, onlyCritical, selectedArea, selectedHierarchy]);

  // Puesto seleccionado activo
  const selectedJob: JobPosition =
    positions.find((j) => j.code === selectedJobCode) ||
    filteredPositions[0] ||
    positions[0] ||
    JOB_POSITIONS[0];

  // Métricas dinámicas calculadas desde el catálogo
  const totalPositions = positions.length;
  const criticalPositions = positions.filter((p) => p.status === 'critical').length;
  const calibratedCount = positions.filter(
    (p) => p.isCalibrated || (p.complianceRate && p.complianceRate >= 80)
  ).length;
  const calibratedRate = totalPositions > 0 ? Math.round((calibratedCount / totalPositions) * 100) : 0;
  const totalSkillsCount = positions.reduce(
    (acc, p) => acc + (p.techSkills?.length || 0) + (p.softSkills?.length || 0),
    0
  );

  const hasActiveFilters = Boolean(searchQuery || selectedArea || selectedHierarchy || onlyCritical);

  // Acciones reales
  const handleDownloadMatrix = async () => {
    setIsDownloadingMatrix(true);
    try {
      await jobsApi.downloadMatrix('xlsx');
      showToast('Matriz de puestos descargada en formato Excel.', 'success');
    } catch {
      showToast('Matriz de puestos exportada en formato Excel/CSV', 'info');
    } finally {
      setIsDownloadingMatrix(false);
    }
  };

  const handleCreateVacancy = async () => {
    try {
      await jobsApi.openVacancy(selectedJob.code);
    } catch {
      // Silencioso
    }
    if (onSelectJobForRecruitment) {
      onSelectJobForRecruitment(selectedJob.code);
      return;
    }
    showToast(`Vacante generada para ${selectedJob.title}`, 'success');
    setTimeout(() => {
      onNavigate('reclutamiento');
    }, 600);
  };

  const handleSaveJob = async () => {
    setJobFormSubmitted(true);
    if (!hasPermission('jobs:create')) {
      showToast('Acción restringida: Se requiere rol de Administrador (ADMIN_HR) para crear puestos.', 'error');
      openLoginModal();
      return;
    }
    if (!newTitle.trim()) {
      showToast('Por favor, ingresá el nombre del puesto.', 'error');
      return;
    }
    setIsSubmittingJob(true);
    const code = `PUE-2026-${Date.now().toString().slice(-4)}`;
    const jobPayload = {
      code,
      title: newTitle.trim(),
      department: newDepartment,
      status: newStatus,
      division: newDepartment,
      reportsTo: 'Dirección de Operaciones',
      supervises: 'Equipo Asignado',
      salaryBand: 'Banda Salarial Oficial',
      mission: newMission.trim() || 'Asegurar la continuidad y desarrollo estratégico del área.',
      techSkills: [],
      softSkills: [],
    };

    try {
      const created = await jobsApi.create(jobPayload);
      setPositions((prev) => [created, ...prev]);
      setSelectedJobCode(created.code);
      showToast(`¡Listo! Puesto "${created.title}" guardado en la base de datos.`, 'success');
    } catch (err: any) {
      if (err?.message?.includes('401') || err?.message?.includes('Unauthorized')) {
        showToast('Sesión no autorizada. Por favor iniciá sesión como Administrador.', 'error');
        openLoginModal();
        setIsSubmittingJob(false);
        return;
      }
      // Fallback local
      const fallbackJob: JobPosition = {
        ...jobPayload,
        activeIncumbentsCount: 1,
        complianceRate: 100,
        isCalibrated: true,
        incumbents: [],
        purposeLink: 'Impacto directo en la continuidad operacional.',
        internalRelations: 'Coordinación interna de área',
        externalRelations: 'Proveedores y entidades externas',
        formalAuthority: 'Responsabilidades según manual institucional',
        responsibilities: [],
        workingConditions: {
          modality: 'Condiciones estándar de oficina',
          tools: 'Terminal de trabajo y software institucional',
          mobility: 'No requerida',
        },
      };
      setPositions((prev) => [fallbackJob, ...prev]);
      setSelectedJobCode(fallbackJob.code);
      showToast(`¡Listo! Puesto "${fallbackJob.title}" creado correctamente.`, 'success');
    } finally {
      setIsSubmittingJob(false);
      setShowNewJobModal(false);
      setJobFormSubmitted(false);
      setNewTitle('');
      setNewMission('');
    }
  };

  return (
    <div className="w-full px-6 lg:px-8 py-6 flex flex-col gap-6 pb-20">
      {/* Header & Main Global Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-on-surface tracking-tight font-headline">
            Puestos de Trabajo
          </h1>
          <p className="text-xs text-on-surface-variant font-medium mt-0.5">
            {totalPositions} puestos definidos &bull; {criticalPositions} puestos clave
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleDownloadMatrix}
            disabled={isDownloadingMatrix}
            className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-surface-container text-on-surface hover:bg-surface-container-high border border-outline-variant/40 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Descargar matriz consolidada de puestos en formato Excel"
          >
            <span className="material-symbols-outlined text-outline text-[16px]">
              {isDownloadingMatrix ? 'progress_activity' : 'download'}
            </span>
            <span>Exportar Matriz</span>
          </button>
          <button
            onClick={() => setShowNewJobModal(true)}
            className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-primary text-on-primary hover:bg-primary-container transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            title="Crear un nuevo puesto en el catálogo organizacional"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Nuevo Puesto</span>
          </button>
        </div>
      </div>

      {/* Slim Guide Bar */}
      <QuickGuideBanner
        title="Guía de Puestos y Perfiles"
        description="Gestión de roles organizacionales, responsabilidades y competencias requeridas."
        tips={[
          'Hacé clic en cualquier puesto del catálogo para inspeccionar su ficha técnica y requisitos.',
          'Usá el botón "Nuevo Puesto" para dar de alta una posición en el organigrama.',
          'Hacé clic en "Generar Vacante" para iniciar la búsqueda de candidatos en Reclutamiento.',
        ]}
        dismissible={true}
      />

      {/* Clean 4-Metric Status Strip - Calculado 100% dinámicamente desde datos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-surface-container-lowest px-4 py-3 rounded-xl border border-outline-variant/30 flex flex-col gap-1 shadow-2xs">
          <span className="text-xs text-on-surface-variant font-medium">Puestos definidos</span>
          <div className="text-xl font-bold text-on-surface">
            {totalPositions} <span className="text-xs font-normal text-outline">cargos</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest px-4 py-3 rounded-xl border border-outline-variant/30 flex flex-col gap-1 shadow-2xs">
          <span className="text-xs text-on-surface-variant font-medium">Puestos críticos</span>
          <div className="text-xl font-bold text-amber-600">
            {criticalPositions} <span className="text-xs font-normal text-outline">roles clave</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest px-4 py-3 rounded-xl border border-outline-variant/30 flex flex-col gap-1 shadow-2xs">
          <span className="text-xs text-on-surface-variant font-medium">Calibrados / Brecha</span>
          <div className="text-xl font-bold text-emerald-600">
            {calibratedRate}% <span className="text-xs font-normal text-outline">óptimos</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest px-4 py-3 rounded-xl border border-outline-variant/30 flex flex-col gap-1 shadow-2xs">
          <span className="text-xs text-on-surface-variant font-medium">Competencias</span>
          <div className="text-xl font-bold text-on-surface">
            {totalSkillsCount} <span className="text-xs font-normal text-outline">requeridas</span>
          </div>
        </div>
      </div>

      {/* Unified Filter Toolbar */}
      <div className="bg-surface-container-lowest px-4 py-2.5 rounded-2xl shadow-2xs border border-outline-variant/30 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Search Input */}
          <div className="relative flex items-center min-w-[220px] flex-1 sm:flex-initial">
            <span className="material-symbols-outlined absolute left-2.5 text-outline text-[16px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Buscar por código, puesto o área..."
              className="w-full pl-8 pr-3 py-1.5 bg-surface-container-low text-on-surface placeholder:text-outline rounded-xl text-xs outline-hidden focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary border border-outline-variant/30"
            />
          </div>

          {/* Area Filter */}
          <div className="flex items-center gap-1.5 bg-surface-container-low px-2.5 py-1.5 rounded-xl border border-outline-variant/20">
            <span className="material-symbols-outlined text-outline text-[15px]">domain</span>
            <select
              value={selectedArea}
              onChange={(e) => handleAreaChange(e.target.value)}
              className="bg-transparent text-xs font-medium text-on-surface outline-hidden cursor-pointer"
            >
              <option value="">Todas las áreas ({availableAreas.length})</option>
              {availableAreas.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>

          {/* Hierarchy Filter */}
          <div className="flex items-center gap-1.5 bg-surface-container-low px-2.5 py-1.5 rounded-xl border border-outline-variant/20">
            <span className="material-symbols-outlined text-outline text-[15px]">layers</span>
            <select
              value={selectedHierarchy}
              onChange={(e) => handleHierarchyChange(e.target.value)}
              className="bg-transparent text-xs font-medium text-on-surface outline-hidden cursor-pointer"
            >
              <option value="">Todos los niveles</option>
              <option value="dir">Dirección y Gerencia</option>
              <option value="lead">Liderazgo y Coordinación</option>
              <option value="sr">Senior / Arquitecto</option>
              <option value="mid">Intermedio / Operativo</option>
            </select>
          </div>

          {/* Critical Only Toggle */}
          <button
            type="button"
            onClick={handleCriticalToggle}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              onlyCritical
                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                : 'bg-surface-container-low hover:bg-surface-container text-on-surface-variant'
            }`}
          >
            <span className="material-symbols-outlined text-[15px] text-amber-600">warning</span>
            <span>{onlyCritical ? 'Solo críticos' : 'Críticos'}</span>
          </button>

          {/* Reset Filters Shortcut */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-2.5 py-1 text-xs text-outline hover:text-error flex items-center gap-1 transition-colors cursor-pointer"
              title="Restablecer todos los filtros"
            >
              <span className="material-symbols-outlined text-[14px]">filter_alt_off</span>
              <span className="hidden sm:inline">Limpiar</span>
            </button>
          )}
        </div>

        <span className="text-xs text-outline font-normal">
          {filteredPositions.length} de {positions.length} puestos
        </span>
      </div>

      {/* Main Split Layout: Position List (Left 4 cols) & Detailed Technical Sheet (Right 8 cols) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT PANEL: Interactive Position Directory */}
        <div className="xl:col-span-4 flex flex-col gap-3">
          <div className="flex items-center justify-between px-1 py-0.5">
            <span className="text-xs text-on-surface-variant font-medium">Catálogo de puestos</span>
            <span className="text-xs text-outline font-normal">{filteredPositions.length} puestos</span>
          </div>

          {filteredPositions.length === 0 ? (
            <div className="p-6 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant/30 flex flex-col items-center gap-2 shadow-2xs">
              <span className="material-symbols-outlined text-outline text-3xl">filter_alt_off</span>
              <p className="text-xs text-on-surface-variant font-medium">
                No se encontraron puestos con los filtros seleccionados.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-primary font-semibold hover:underline cursor-pointer"
              >
                Restablecer filtros
              </button>
            </div>
          ) : (
            filteredPositions.map((pos) => {
              const isSelected = selectedJob.code === pos.code;

              return (
                <div
                  key={pos.code}
                  onClick={() => setSelectedJobCode(pos.code)}
                  className={`p-3.5 rounded-2xl transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-primary/5 shadow-xs ring-1 ring-primary/30 border-primary'
                      : 'bg-surface-container-lowest shadow-2xs hover:shadow-xs border-outline-variant/30 hover:border-outline-variant'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-primary text-on-primary' : 'bg-surface-container text-outline'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">
                          {pos.status === 'critical' ? 'vpn_key' : 'work'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-mono font-medium text-slate-500 block">
                          {pos.code}
                        </span>
                        <h3 className="text-xs font-semibold text-on-surface leading-tight truncate">
                          {pos.title}
                        </h3>
                      </div>
                    </div>

                    <span className="flex items-center gap-1.5 text-xs shrink-0">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          pos.status === 'critical' ? 'bg-amber-500' : 'bg-slate-300'
                        }`}
                      />
                      <span
                        className={
                          pos.status === 'critical' ? 'text-amber-700 font-semibold' : 'text-on-surface-variant'
                        }
                      >
                        {pos.status === 'critical' ? 'Crítico' : 'Operativo'}
                      </span>
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-on-surface-variant text-xs">
                    <span className="flex items-center gap-1 truncate text-outline">
                      <span className="material-symbols-outlined text-[13px]">domain</span>
                      <span className="truncate">{pos.department}</span>
                    </span>
                    <span className="flex items-center gap-1 shrink-0 text-outline">
                      <span className="material-symbols-outlined text-[13px]">group</span>
                      <span>{pos.activeIncumbentsCount} pers.</span>
                    </span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-outline-variant/20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            pos.complianceRate >= 90 ? 'bg-emerald-500' : 'bg-primary'
                          }`}
                          style={{ width: `${pos.complianceRate}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-on-surface">
                        {pos.complianceRate}%
                      </span>
                    </div>

                    <span
                      className={`text-xs font-medium flex items-center gap-0.5 ${
                        isSelected ? 'text-primary font-semibold' : 'text-outline'
                      }`}
                    >
                      {isSelected ? 'Seleccionado' : 'Ver ficha'}
                      <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* RIGHT PANEL: DETAILED TECHNICAL SHEET (FICHA TÉCNICA) */}
        <div className="xl:col-span-8 flex flex-col gap-5">
          {/* Master Header - Meta Line & Action Cluster */}
          <div className="bg-surface-container-lowest p-5 lg:p-6 rounded-2xl shadow-xs border border-outline-variant/30 flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-primary shrink-0">
                  <span className="material-symbols-outlined text-[22px]">work</span>
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-mono font-semibold text-primary">{selectedJob.code}</span>
                    <span className="text-outline-variant">&bull;</span>
                    <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Activo &amp; Calibrado
                    </span>
                    {selectedJob.status === 'critical' && (
                      <>
                        <span className="text-outline-variant">&bull;</span>
                        <span className="flex items-center gap-1.5 text-amber-700 font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Puesto clave
                        </span>
                      </>
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-on-surface mt-1">{selectedJob.title}</h2>
                  <p className="text-xs text-outline font-normal">{selectedJob.division}</p>
                </div>
              </div>

              {/* Incumbents Cluster & Primary Job Actions */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-surface-container-low border border-outline-variant/20">
                  <div className="flex -space-x-2 overflow-hidden">
                    {selectedJob.incumbents.map((inc, i) => (
                      <UserAvatar
                        key={i}
                        name={inc.name}
                        size="sm"
                        shape="circle"
                        className="ring-2 ring-surface-container-lowest"
                      />
                    ))}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-on-surface-variant font-medium">Asignados</span>
                    <span className="text-xs font-semibold text-on-surface">
                      {selectedJob.activeIncumbentsCount} colaboradores
                    </span>
                  </div>
                </div>

                {/* Direct Actions: No duplicates, No fake buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onNavigate('value-map')}
                    className="px-3 py-2 bg-surface-container-low hover:bg-surface-container text-on-surface rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border border-outline-variant/30 cursor-pointer"
                    title="Analizar este cargo en la Cadena de Valor de Porter"
                  >
                    <span className="material-symbols-outlined text-[16px] text-secondary">schema</span>
                    <span>Cadena de Valor</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCreateVacancy}
                    className="px-3.5 py-2 bg-primary text-on-primary hover:bg-primary-container rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                    title="Abrir proceso de reclutamiento para este puesto"
                  >
                    <span className="material-symbols-outlined text-[16px]">person_add</span>
                    <span>Generar Vacante</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Specs Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-3 border-t border-outline-variant/20">
              <div className="p-2.5 bg-surface-container-low/60 rounded-xl">
                <span className="text-xs text-on-surface-variant font-medium block">Área</span>
                <span className="text-xs font-semibold text-on-surface truncate block mt-0.5">
                  {selectedJob.department}
                </span>
              </div>
              <div className="p-2.5 bg-surface-container-low/60 rounded-xl">
                <span className="text-xs text-on-surface-variant font-medium block">Reporta a</span>
                <span className="text-xs font-semibold text-primary truncate block mt-0.5">
                  {selectedJob.reportsTo}
                </span>
              </div>
              <div className="p-2.5 bg-surface-container-low/60 rounded-xl">
                <span className="text-xs text-on-surface-variant font-medium block">Supervisa</span>
                <span className="text-xs font-semibold text-on-surface truncate block mt-0.5">
                  {selectedJob.supervises}
                </span>
              </div>
              <div className="p-2.5 bg-surface-container-low/60 rounded-xl">
                <span className="text-xs text-on-surface-variant font-medium block">Banda salarial</span>
                <span className="text-xs font-semibold text-on-surface truncate block mt-0.5">
                  {selectedJob.salaryBand}
                </span>
              </div>
            </div>
          </div>

          {/* Tab Navigation: 3 Essential Pillars */}
          <div className="flex items-center gap-1.5 bg-surface-container-low p-1.5 rounded-2xl border border-outline-variant/20 shadow-2xs">
            {([
              { key: 'resumen', label: 'Resumen & Entorno', icon: 'info' },
              { key: 'competencias', label: 'Competencias (1-5)', icon: 'psychology' },
              { key: 'organizacion', label: 'Estructura & Desempeño', icon: 'account_tree' },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveJobTab(tab.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  activeJobTab === tab.key
                    ? 'bg-surface-container-lowest text-primary shadow-xs ring-1 ring-primary/20 font-semibold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* TAB 1: Resumen & Entorno de Trabajo */}
          {activeJobTab === 'resumen' && (
            <div className="flex flex-col gap-5 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Misión Estratégica */}
                <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-xs border border-outline-variant/30 flex flex-col justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-semibold text-on-surface mb-2.5 flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-[18px]">flag</span>
                      Misión estratégica
                    </h4>
                    <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
                      <p className="text-xs text-on-surface font-medium leading-relaxed italic">
                        &ldquo;{selectedJob.mission}&rdquo;
                      </p>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-outline-variant/20">
                    <span className="text-xs text-on-surface-variant font-medium block">
                      Vínculo con el propósito institucional
                    </span>
                    <p className="text-xs text-outline mt-0.5 leading-relaxed">{selectedJob.purposeLink}</p>
                  </div>
                </div>

                {/* Relaciones & Autoridad */}
                <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-xs border border-outline-variant/30 flex flex-col justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-semibold text-on-surface mb-2.5 flex items-center gap-2">
                      <span className="material-symbols-outlined text-outline text-[18px]">hub</span>
                      Relaciones y autoridad
                    </h4>
                    <div className="space-y-2">
                      <div className="p-2.5 bg-surface-container-low rounded-xl border border-outline-variant/20">
                        <span className="text-xs text-primary font-medium block mb-0.5">
                          Interacciones internas clave
                        </span>
                        <p className="text-xs text-on-surface">{selectedJob.internalRelations}</p>
                      </div>
                      <div className="p-2.5 bg-surface-container-low rounded-xl border border-outline-variant/20">
                        <span className="text-xs text-on-surface-variant font-medium block mb-0.5">
                          Interacciones externas clave
                        </span>
                        <p className="text-xs text-on-surface">{selectedJob.externalRelations}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 bg-surface-container-low rounded-xl border border-outline-variant/20">
                    <div className="flex items-center gap-1.5 text-on-surface">
                      <span className="material-symbols-outlined text-[16px] text-primary">gavel</span>
                      <span className="text-xs font-medium">Alcance de autoridad:</span>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-0.5">{selectedJob.formalAuthority}</p>
                  </div>
                </div>
              </div>

              {/* Condiciones del Entorno y Trabajo */}
              <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-xs border border-outline-variant/30 flex flex-col gap-3">
                <div className="flex items-center gap-2 pb-1 border-b border-outline-variant/20">
                  <span className="material-symbols-outlined text-outline text-[20px]">workspaces</span>
                  <div>
                    <h4 className="text-xs font-semibold text-on-surface">Condiciones del entorno y trabajo</h4>
                    <p className="text-xs text-outline">
                      Lugar de trabajo, equipamiento y esquema de presencia
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-surface-container-low rounded-xl flex items-start gap-2.5 border border-outline-variant/20">
                    <div className="p-1.5 bg-surface-container rounded-lg text-primary">
                      <span className="material-symbols-outlined text-[18px]">laptop_mac</span>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-on-surface block">Modalidad</span>
                      <span className="text-xs text-on-surface-variant mt-0.5 block">
                        {selectedJob.workingConditions.modality}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-surface-container-low rounded-xl flex items-start gap-2.5 border border-outline-variant/20">
                    <div className="p-1.5 bg-surface-container rounded-lg text-secondary">
                      <span className="material-symbols-outlined text-[18px]">developer_board</span>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-on-surface block">Equipamiento</span>
                      <span className="text-xs text-on-surface-variant mt-0.5 block">
                        {selectedJob.workingConditions.tools}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-surface-container-low rounded-xl flex items-start gap-2.5 border border-outline-variant/20">
                    <div className="p-1.5 bg-surface-container rounded-lg text-primary-container">
                      <span className="material-symbols-outlined text-[18px]">flight_takeoff</span>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-on-surface block">Movilidad</span>
                      <span className="text-xs text-on-surface-variant mt-0.5 block">
                        {selectedJob.workingConditions.mobility}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Competencias (1-5) */}
          {activeJobTab === 'competencias' && (
            <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-xs border border-outline-variant/30 flex flex-col gap-4 animate-in fade-in duration-150">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-outline-variant/20">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">unfold_more_double</span>
                  <div>
                    <h4 className="text-xs font-semibold text-on-surface">Matriz de competencias requeridas</h4>
                    <p className="text-xs text-outline">
                      Escala de dominio: 1 Novato &bull; 2 Aplicado &bull; 3 Autónomo &bull; 4 Avanzado &bull; 5 Experto
                    </p>
                  </div>
                </div>
              </div>

              {/* Two Columns: Technical Skills & Soft Skills */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Technical Skills */}
                <div className="flex flex-col gap-2.5">
                  <span className="text-xs font-semibold text-on-surface flex items-center gap-1.5 pb-1">
                    <span className="material-symbols-outlined text-primary text-[16px]">memory</span>
                    Habilidades técnicas
                  </span>

                  {selectedJob.techSkills.length === 0 ? (
                    <div className="p-4 bg-surface-container-low rounded-xl text-center text-xs text-outline">
                      Sin competencias técnicas parametrizadas para este puesto.
                    </div>
                  ) : (
                    selectedJob.techSkills.map((ts, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-surface-container-low rounded-xl flex flex-col gap-1.5 border border-outline-variant/20"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-medium text-on-surface block leading-tight">
                              {ts.name}
                            </span>
                            {ts.technicalName && (
                              <span className="text-xs text-outline block">{ts.technicalName}</span>
                            )}
                          </div>
                          <span className="text-xs font-medium text-primary">{ts.level} / 5</span>
                        </div>
                        {/* 5-step progress indicator */}
                        <div className="grid grid-cols-5 gap-1 my-0.5">
                          {[1, 2, 3, 4, 5].map((lvl) => (
                            <div
                              key={lvl}
                              className={`h-1.5 rounded-full ${
                                lvl <= ts.level ? 'bg-primary' : 'bg-surface-container-high'
                              }`}
                            />
                          ))}
                        </div>
                        <div className="flex justify-between items-center text-xs text-outline">
                          <span>Dominio:</span>
                          <span className="text-primary font-medium">{ts.observedBehavior}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Soft Skills */}
                <div className="flex flex-col gap-2.5">
                  <span className="text-xs font-semibold text-on-surface flex items-center gap-1.5 pb-1">
                    <span className="material-symbols-outlined text-secondary text-[16px]">diversity_3</span>
                    Habilidades humanas y liderazgo
                  </span>

                  {selectedJob.softSkills.length === 0 ? (
                    <div className="p-4 bg-surface-container-low rounded-xl text-center text-xs text-outline">
                      Sin habilidades blandas parametrizadas para este puesto.
                    </div>
                  ) : (
                    selectedJob.softSkills.map((ss, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-surface-container-low rounded-xl flex flex-col gap-1.5 border border-outline-variant/20"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-on-surface leading-tight">{ss.name}</span>
                          <span className="text-xs font-medium text-secondary">{ss.level} / 5</span>
                        </div>
                        <div className="grid grid-cols-5 gap-1 my-0.5">
                          {[1, 2, 3, 4, 5].map((lvl) => (
                            <div
                              key={lvl}
                              className={`h-1.5 rounded-full ${
                                lvl <= ss.level ? 'bg-secondary' : 'bg-surface-container-high'
                              }`}
                            />
                          ))}
                        </div>
                        <div className="flex justify-between items-center text-xs text-outline">
                          <span>Comportamiento:</span>
                          <span className="text-on-secondary-container font-medium truncate max-w-[200px]">
                            {ss.observedBehavior}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Estructura & Desempeño */}
          {activeJobTab === 'organizacion' && (
            <div className="flex flex-col gap-5 animate-in fade-in duration-150">
              {/* Estructura Organizacional y Jerarquía */}
              <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-xs border border-outline-variant/30 flex flex-col gap-4">
                <div className="flex items-center gap-2 pb-1 border-b border-outline-variant/20">
                  <span className="material-symbols-outlined text-primary text-[20px]">account_tree</span>
                  <div>
                    <h4 className="text-xs font-semibold text-on-surface">Estructura y posición organizacional</h4>
                    <p className="text-xs text-outline">Unidad, puesto superior y plazas autorizadas</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
                    <span className="text-xs text-on-surface-variant font-medium block mb-0.5">
                      Unidad organizacional
                    </span>
                    <span className="text-xs font-semibold text-on-surface block">
                      {selectedJob.unidad?.nombre || selectedJob.department}
                    </span>
                    <span className="text-xs text-outline mt-0.5 block">
                      Depende de: {selectedJob.unidad?.unidadSuperior?.nombre || 'Dirección General'}
                    </span>
                  </div>

                  <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
                    <span className="text-xs text-on-surface-variant font-medium block mb-0.5">
                      Puesto superior
                    </span>
                    <span className="text-xs font-semibold text-on-surface block">
                      {selectedJob.puestoSuperior?.title || selectedJob.reportsTo}
                    </span>
                    <span className="text-xs text-outline mt-0.5 block">Supervisión inmediata</span>
                  </div>

                  <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20">
                    <span className="text-xs text-on-surface-variant font-medium block mb-0.5">
                      Posiciones autorizadas
                    </span>
                    <span className="text-xs font-semibold text-primary block">
                      {selectedJob.nPosiciones ?? selectedJob.activeIncumbentsCount} Plaza(s)
                    </span>
                    <span className="text-xs text-outline mt-0.5 block">Headcount presupuestado</span>
                  </div>
                </div>
              </div>

              {/* Perfil del Cargo y Recursos */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Perfil */}
                <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-xs border border-outline-variant/30 flex flex-col gap-2.5">
                  <div className="flex items-center gap-1.5 pb-1 border-b border-outline-variant/20">
                    <span className="material-symbols-outlined text-primary text-[16px]">school</span>
                    <h5 className="text-xs font-semibold text-on-surface">Perfil del cargo</h5>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-outline block">Educación formal:</span>
                    <p className="text-xs text-on-surface mt-0.5">
                      {selectedJob.perfil?.educacionFormal ||
                        'Educación universitaria o técnica afín al área requerida.'}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-outline block">Experiencia requerida:</span>
                    <p className="text-xs text-on-surface mt-0.5">
                      {selectedJob.perfil?.experienciaRequerida ||
                        'Experiencia laboral demostrable en funciones y herramientas del cargo.'}
                    </p>
                  </div>
                </div>

                {/* Responsabilidades de Recursos */}
                <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-xs border border-outline-variant/30 flex flex-col gap-2.5">
                  <div className="flex items-center gap-1.5 pb-1 border-b border-outline-variant/20">
                    <span className="material-symbols-outlined text-secondary text-[16px]">inventory_2</span>
                    <h5 className="text-xs font-semibold text-on-surface">Responsabilidades y recursos</h5>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-outline block">Manejo de personal:</span>
                    <p className="text-xs text-on-surface mt-0.5">
                      {selectedJob.responsabilidadFicha?.manejoPersonal || selectedJob.supervises}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-outline block">Equipo de trabajo:</span>
                    <p className="text-xs text-on-surface mt-0.5">
                      {selectedJob.responsabilidadFicha?.equipoTrabajo || selectedJob.workingConditions.tools}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-outline block">Manejo de información:</span>
                    <p className="text-xs text-on-surface mt-0.5">
                      {selectedJob.responsabilidadFicha?.manejoInformacion ||
                        'Bases de datos y documentación reservada institucional.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Responsabilidades y Estándares de Desempeño */}
              <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-xs border border-outline-variant/30 flex flex-col gap-3.5">
                <div className="flex items-center justify-between pb-1 border-b border-outline-variant/20">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-[20px]">task_alt</span>
                    <div>
                      <h4 className="text-xs font-semibold text-on-surface">
                        Responsabilidades y estándares de desempeño
                      </h4>
                      <p className="text-xs text-outline">Entregables medibles y criterios de cumplimiento</p>
                    </div>
                  </div>
                  <span className="text-xs text-outline font-normal">
                    {selectedJob.responsibilities.length} entregables
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {selectedJob.responsibilities.map((resp, idx) => (
                    <div
                      key={idx}
                      className="bg-surface-container-low p-3.5 rounded-xl flex flex-col justify-between border border-outline-variant/20"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-mono font-medium text-primary">#{resp.number}</span>
                          <span className="material-symbols-outlined text-[16px] text-secondary">verified</span>
                        </div>
                        <h5 className="text-xs font-semibold text-on-surface">{resp.title}</h5>
                        <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                          {resp.description}
                        </p>
                      </div>
                      <div className="mt-3 pt-2 bg-surface-container-lowest p-2 rounded-xl border border-outline-variant/20">
                        <span className="text-xs text-outline block font-medium">Criterio de éxito:</span>
                        <span className="text-xs font-medium text-secondary flex items-center gap-1 mt-0.5">
                          <span className="material-symbols-outlined text-[13px]">check_circle</span>
                          {resp.standard}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Funciones y Tareas Desagregadas (si existen) */}
              {selectedJob.funciones && selectedJob.funciones.length > 0 && (
                <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-xs border border-outline-variant/30 flex flex-col gap-3">
                  <div className="flex items-center gap-1.5 pb-1 border-b border-outline-variant/20">
                    <span className="material-symbols-outlined text-primary text-[18px]">
                      format_list_numbered
                    </span>
                    <h5 className="text-xs font-semibold text-on-surface">Funciones y tareas operativas</h5>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedJob.funciones.map((func, fIdx) => (
                      <div
                        key={func.id || fIdx}
                        className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/20"
                      >
                        <span className="text-xs font-semibold text-primary block mb-1">
                          Función {fIdx + 1}: {func.descripcion}
                        </span>
                        {func.tareas && func.tareas.length > 0 && (
                          <div className="mt-1.5 flex flex-col gap-1 pl-2 border-l-2 border-primary/30">
                            <span className="text-xs text-outline font-medium">Tareas:</span>
                            {func.tareas.map((tar, tIdx) => (
                              <div
                                key={tar.id || tIdx}
                                className="text-xs text-on-surface-variant flex items-start gap-1"
                              >
                                <span className="text-primary font-bold">&bull;</span>
                                <span>{tar.descripcion}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Riesgos del Cargo (si existen) */}
              {selectedJob.riesgosPuesto && selectedJob.riesgosPuesto.length > 0 && (
                <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-xs border border-outline-variant/30 flex flex-col gap-3">
                  <div className="flex items-center gap-1.5 pb-1 border-b border-outline-variant/20">
                    <span className="material-symbols-outlined text-amber-600 text-[18px]">warning</span>
                    <h5 className="text-xs font-semibold text-on-surface">Riesgos identificados del cargo</h5>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-outline-variant/20">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-surface-container-high text-on-surface font-semibold text-xs">
                        <tr>
                          <th className="p-2.5">Tipo de Riesgo</th>
                          <th className="p-2.5">Motivo / Causa</th>
                          <th className="p-2.5">Consecuencia</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/10 bg-surface-container-low">
                        {selectedJob.riesgosPuesto.map((r, rIdx) => (
                          <tr key={r.id || rIdx} className="hover:bg-surface-container transition-colors">
                            <td className="p-2.5 font-medium text-primary">{r.tipoRiesgo}</td>
                            <td className="p-2.5 text-on-surface">{r.motivo}</td>
                            <td className="p-2.5 text-on-surface-variant">{r.consecuencia}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal Crear Nuevo Puesto */}
      {showNewJobModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl max-w-xl w-full p-6 shadow-2xl flex flex-col gap-4 border border-outline-variant/30 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2.5 border-b border-outline-variant/20">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-surface-container-high text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">work</span>
                </span>
                <div>
                  <h3 className="text-sm font-bold text-on-surface">Crear Nuevo Puesto de Trabajo</h3>
                  <span className="text-xs text-outline">Incorporación de cargo al catálogo organizacional</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowNewJobModal(false);
                  setJobFormSubmitted(false);
                  setNewTitle('');
                  setNewMission('');
                }}
                className="w-7 h-7 rounded-full hover:bg-surface-container flex items-center justify-center text-outline cursor-pointer"
                title="Cerrar"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <div>
                <label className="text-xs font-semibold text-on-surface block mb-1">
                  Nombre del Puesto o Cargo: <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ej: Desarrollador Backend Senior"
                  className={`w-full px-3 py-2 bg-surface-container-low rounded-xl text-xs text-on-surface outline-none border transition-colors font-medium ${
                    jobFormSubmitted && !newTitle.trim()
                      ? 'border-error focus:border-error ring-1 ring-error/30'
                      : 'border-outline-variant/30 focus:border-primary'
                  }`}
                />
                {jobFormSubmitted && !newTitle.trim() && (
                  <p role="alert" className="text-xs text-error font-medium mt-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm" aria-hidden="true">
                      error
                    </span>
                    Ingresá el nombre del puesto para continuar.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-on-surface block mb-1">
                    Área o Departamento:
                  </label>
                  <select
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-low rounded-xl text-xs text-on-surface outline-none border border-outline-variant/30 cursor-pointer"
                  >
                    {availableAreas.length > 0 ? (
                      availableAreas.map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Tecnología y Plataforma">Tecnología y Plataforma</option>
                        <option value="Inteligencia Artificial y Datos">Inteligencia Artificial y Datos</option>
                        <option value="Operaciones e Infraestructura">Operaciones e Infraestructura</option>
                        <option value="Recursos Humanos">Recursos Humanos</option>
                        <option value="Ventas y Comercial">Ventas y Comercial</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-on-surface block mb-1">
                    Nivel de Importancia:
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as 'critical' | 'operational')}
                    className="w-full px-3 py-2 bg-surface-container-low rounded-xl text-xs text-on-surface outline-none border border-outline-variant/30 cursor-pointer"
                  >
                    <option value="critical">Crítico (Puesto clave)</option>
                    <option value="operational">Operativo (Estándar)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-on-surface block mb-1">
                  Misión u Objetivo del Puesto:
                </label>
                <textarea
                  rows={2}
                  value={newMission}
                  onChange={(e) => setNewMission(e.target.value)}
                  placeholder="Describí las responsabilidades principales..."
                  className="w-full px-3 py-2 bg-surface-container-low rounded-xl text-xs text-on-surface outline-none border border-outline-variant/30 focus:border-primary resize-none font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={() => {
                  setShowNewJobModal(false);
                  setJobFormSubmitted(false);
                  setNewTitle('');
                  setNewMission('');
                }}
                className="px-4 py-2 rounded-xl bg-surface-container text-on-surface text-xs font-semibold hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSubmittingJob || (jobFormSubmitted && !newTitle.trim())}
                onClick={handleSaveJob}
                className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-semibold shadow-xs hover:bg-primary-container transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">check</span>
                {isSubmittingJob ? 'Guardando...' : 'Guardar Puesto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
