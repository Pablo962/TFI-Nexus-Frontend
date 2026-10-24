import React, { useState, useEffect, useMemo } from 'react';
import { PorterActivity, ScreenId } from '../../types';
import { PORTER_ACTIVITIES } from '../../data/mockData';
import { UserAvatar } from '../UserAvatar';
import { QuickGuideBanner } from '../QuickGuideBanner';
import { useToast } from '../ToastProvider';
import { useFocusTrap } from '../useFocusTrap';
import { reportsApi, porterApi } from '../../services/api';

interface ValueMapScreenProps {
  onNavigate: (screen: ScreenId) => void;
  onSelectEmployee?: (employeeId: string) => void;
}

// Actividades de soporte transversales (Porter Support Activities)
const SUPPORT_ACTIVITIES = [
  {
    code: 'SUP-01',
    name: 'Infraestructura Corporativa',
    desc: 'Gobierno TI, Legal, Finanzas y cumplimiento SOC2.',
    headcount: 14,
    coverage: 96,
    status: 'optimal' as const,
    tier: 'Tier E6/E7',
  },
  {
    code: 'SUP-02',
    name: 'Gestión del Talento Humano',
    desc: 'Análisis NEXUS, matrices de competencias y planes de carrera.',
    headcount: 9,
    coverage: 92,
    status: 'optimal' as const,
    tier: 'Estratégico',
  },
  {
    code: 'SUP-03',
    name: 'Desarrollo Tecnológico & I+D',
    desc: 'Modelos predictivos de IA, patentes y arquitectura cloud resiliente.',
    headcount: 28,
    coverage: 99,
    status: 'optimal' as const,
    tier: 'Misión Crítica',
  },
  {
    code: 'SUP-04',
    name: 'Servicios en la Nube & Compras',
    desc: 'Optimización de consumo cloud y contratos de infraestructura.',
    headcount: 6,
    coverage: 86,
    status: 'alert' as const,
    tier: 'Refuerzo requerido',
  },
];

export const ValueMapScreen: React.FC<ValueMapScreenProps> = ({
  onNavigate,
  onSelectEmployee,
}) => {
  const { showToast } = useToast();
  const [activities, setActivities] = useState<PorterActivity[]>(PORTER_ACTIVITIES);
  const [selectedActivityId, setSelectedActivityId] = useState<number>(2); // Default: Operaciones Core
  const [activeLayer, setActiveLayer] = useState<'primary' | 'support' | 'all'>('primary');
  const [activeDetailTab, setActiveDetailTab] = useState<'roles' | 'skills' | 'talent' | 'ai'>('roles');
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [simulationHeadcount, setSimulationHeadcount] = useState(38);
  const [simulationBudget, setSimulationBudget] = useState(120);
  const simulationModalRef = useFocusTrap<HTMLDivElement>(showSimulateModal);

  // Conexión dinámica con API de Porter
  useEffect(() => {
    let isMounted = true;
    porterApi
      .getAll()
      .then((res) => {
        if (isMounted && res && res.data && res.data.length > 0) {
          setActivities(res.data);
        }
      })
      .catch(() => {
        // Fallback resiliente a PORTER_ACTIVITIES
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Eslabón activo seleccionado
  const selectedActivity: PorterActivity = useMemo(() => {
    return activities.find((a) => a.id === selectedActivityId) || activities[0] || PORTER_ACTIVITIES[0];
  }, [activities, selectedActivityId]);

  // Métricas dinámicas calculadas desde las actividades
  const metrics = useMemo(() => {
    const totalCount = activities.length;
    const totalHeadcount = activities.reduce((acc, a) => acc + (a.headcount || 0), 0);
    const alertCount = activities.filter((a) => a.coverageStatus === 'alert').length;
    const avgCoverage =
      totalCount > 0
        ? Math.round(activities.reduce((acc, a) => acc + (a.coverage || 0), 0) / totalCount)
        : 95;
    return { totalCount, totalHeadcount, alertCount, avgCoverage };
  }, [activities]);

  // Manejador para simulación de recursos
  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowSimulateModal(false);
    try {
      const res = await porterApi.simulate(
        selectedActivity.id,
        simulationHeadcount,
        simulationBudget,
      );
      showToast(res.message || 'Simulación procesada exitosamente.');
    } catch {
      showToast(
        `Simulación aplicada: Eslabón "${selectedActivity.name}" ajustado a ${simulationHeadcount} colaboradores (+$${simulationBudget}k USD). Cobertura proyectada: 99.4%.`
      );
    }
  };

  // Mapeo dinámico hacia perfil del empleado
  const handleGoToTalent = (name: string) => {
    const lower = name.toLowerCase();
    let empId = 'lucas';
    if (lower.includes('sofía') || lower.includes('sofia')) empId = 'sofia';
    else if (lower.includes('carlos')) empId = 'carlos';
    else if (lower.includes('valeria') || lower.includes('camila')) empId = 'valeria';
    else if (lower.includes('laura')) empId = 'laura';
    else if (lower.includes('marcos') || lower.includes('hernán') || lower.includes('diego')) empId = 'lucas';

    if (onSelectEmployee) {
      onSelectEmployee(empId);
      return;
    }
    onNavigate('empleados');
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-5 flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Cabecera & Acciones Principales */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-outline-variant/30">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-on-surface tracking-tight">
            Cadena de Valor
          </h1>
          <p className="text-xs text-outline mt-0.5">
            Eslabones primarios y actividades de soporte según el modelo estratégico de Porter.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setShowSimulateModal(true)}
            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-medium bg-surface-container text-on-surface hover:bg-surface-container-high border border-outline-variant/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-primary text-[16px]">alt_route</span>
            <span>Simular Reasignación</span>
          </button>
          <button
            type="button"
            onClick={async () => {
              try {
                showToast('Descargando informe de Cadena de Valor...');
                await reportsApi.downloadReport('xlsx');
                showToast('Informe descargado exitosamente.');
              } catch {
                showToast('Informe de Cadena de Valor generado en formato local.');
              }
            }}
            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-semibold bg-primary text-on-primary hover:bg-primary-container transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            <span>Descargar Informe</span>
          </button>
        </div>
      </div>

      {/* Guía Rápida */}
      <QuickGuideBanner
        title="Guía de la Cadena de Valor"
        description="Recorrido de valor operativo y asignación de talento clave por eslabón."
        tips={[
          'Hacé clic en cualquiera de los 5 eslabones primarios para inspeccionar roles, habilidades y talento.',
          'Usá las pestañas superiores para alternar entre Eslabones Primarios y Actividades de Soporte.',
          'La cobertura por debajo del 90% alerta brechas que requieren contratación o plan de capacitación.',
        ]}
        dismissible={true}
      />

      {/* Tira de 4 Métricas Dinámicas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="bg-surface-container-lowest px-4 py-3 rounded-xl border border-outline-variant/40 flex flex-col gap-1 shadow-2xs">
          <span className="text-xs text-on-surface-variant font-medium">Eslabones primarios</span>
          <div className="text-xl font-bold text-on-surface">
            {metrics.totalCount} <span className="text-xs font-normal text-outline">etapas activas</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest px-4 py-3 rounded-xl border border-outline-variant/40 flex flex-col gap-1 shadow-2xs">
          <span className="text-xs text-on-surface-variant font-medium">Talento asignado</span>
          <div className="text-xl font-bold text-on-surface">
            {metrics.totalHeadcount} <span className="text-xs font-normal text-outline">colaboradores</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest px-4 py-3 rounded-xl border border-outline-variant/40 flex flex-col gap-1 shadow-2xs">
          <span className="text-xs text-on-surface-variant font-medium">Brechas en alerta</span>
          <div className="text-xl font-bold text-amber-600 flex items-center gap-1.5">
            <span>{metrics.alertCount}</span>
            <span className="text-xs font-normal text-outline">
              {metrics.alertCount > 0 ? 'requiere atención' : 'todo óptimo'}
            </span>
          </div>
        </div>

        <div className="bg-surface-container-lowest px-4 py-3 rounded-xl border border-outline-variant/40 flex flex-col gap-1 shadow-2xs">
          <span className="text-xs text-on-surface-variant font-medium">Cobertura operativa promedio</span>
          <div className="text-xl font-bold text-emerald-600">
            {metrics.avgCoverage}% <span className="text-xs font-normal text-outline">global</span>
          </div>
        </div>
      </div>

      {/* Selector de Capas: Primarias, Soporte o Integral */}
      <div className="bg-surface-container-lowest px-4 py-2.5 rounded-2xl border border-outline-variant/40 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl border border-outline-variant/20">
          {([
            { id: 'primary', label: `Eslabones Primarios (${activities.length})`, icon: 'view_column' },
            { id: 'support', label: `Actividades de Soporte (${SUPPORT_ACTIVITIES.length})`, icon: 'layers' },
            { id: 'all', label: 'Vista Integral', icon: 'grid_view' },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveLayer(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                activeLayer === tab.id
                  ? 'bg-surface-container-lowest text-primary shadow-xs font-semibold'
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Leyenda de Estado */}
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-on-surface-variant font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            Óptimo (&ge;90%)
          </span>
          <span className="flex items-center gap-1.5 text-on-surface-variant font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            Alerta (&lt;90%)
          </span>
        </div>
      </div>

      {/* PIPELINE SECUENCIAL DE PORTER (Flujo de Eslabones Primarios) */}
      {(activeLayer === 'primary' || activeLayer === 'all') && (
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between pb-1 border-b border-outline-variant/20">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">alt_route</span>
              <h2 className="text-sm font-bold text-on-surface">
                Flujo Secuencial de Eslabones Primarios
              </h2>
            </div>
            <span className="text-xs text-outline">
              Hacé clic en cualquier etapa para inspeccionar su detalle
            </span>
          </div>

          {/* Grilla Secuencial con Conexión Fluida */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {activities.map((activity, idx) => {
              const isSelected = selectedActivity.id === activity.id;
              const isAlert = activity.coverageStatus === 'alert';

              return (
                <div
                  key={activity.id}
                  onClick={() => setSelectedActivityId(activity.id)}
                  className={`relative p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between min-h-[145px] text-left ${
                    isSelected
                      ? 'bg-primary/5 border-primary ring-2 ring-primary/40 shadow-xs scale-102'
                      : 'bg-surface-container-lowest hover:bg-surface-container-low border-outline-variant/30 hover:border-outline-variant/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                        isSelected ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-outline'
                      }`}
                    >
                      {activity.step}
                    </span>
                    <span
                      className={`text-xs font-semibold flex items-center gap-1 px-2 py-0.5 rounded-md ${
                        isAlert ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${isAlert ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      />
                      {activity.coverage}%
                    </span>
                  </div>

                  <div className="my-2">
                    <h3 className="text-xs font-bold text-on-surface leading-snug line-clamp-1">
                      {activity.name}
                    </h3>
                    <p className="text-[11px] text-outline truncate mt-0.5">
                      {activity.subname}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between text-[11px] text-outline">
                    <span>{activity.headcount} personas</span>
                    <span className="font-semibold text-primary">{activity.costEfficiency}</span>
                  </div>

                  {/* Indicador de flecha entre pasos en pantallas grandes */}
                  {idx < activities.length - 1 && (
                    <div className="hidden md:flex absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-surface-container-lowest border border-outline-variant/40 items-center justify-center text-outline shadow-2xs z-10 pointer-events-none">
                      <span className="material-symbols-outlined text-[12px]">chevron_right</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Barra de Margen de Valor de Porter */}
          <div className="p-3.5 bg-surface-container-low rounded-xl border border-outline-variant/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                M
              </span>
              <div>
                <span className="font-bold text-on-surface text-xs">
                  Margen de Valor Agregado Total (+24.8%)
                </span>
                <p className="text-outline text-xs mt-0.5">
                  La articulación de los 5 eslabones primarios genera una rentabilidad neta sostenida de negocio.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                Resultado Operativo Proyectado
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVIDADES DE SOPORTE TRANSVERSALES (Si se selecciona Soporte o Vista Integral) */}
      {(activeLayer === 'support' || activeLayer === 'all') && (
        <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/40 shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between pb-1 border-b border-outline-variant/20">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">layers</span>
              <h2 className="text-sm font-bold text-on-surface">
                Actividades de Soporte Transversales (Infraestructura y Talento)
              </h2>
            </div>
            <span className="text-xs text-outline">
              Capas de apoyo que potencian a los eslabones primarios
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {SUPPORT_ACTIVITIES.map((sup) => {
              const isAlert = sup.status === 'alert';
              return (
                <div
                  key={sup.code}
                  className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/20 flex flex-col justify-between text-left gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-mono font-bold text-outline">{sup.code}</span>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                          isAlert ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${isAlert ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        />
                        {sup.coverage}%
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-on-surface leading-snug">{sup.name}</h4>
                    <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">{sup.desc}</p>
                  </div>

                  <div className="pt-2 border-t border-outline-variant/20 text-xs text-outline flex items-center justify-between">
                    <span>{sup.headcount} colaboradores</span>
                    <span className="font-semibold text-on-surface">{sup.tier}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* INSPECTOR DETALLADO DEL ESLABÓN SELECCIONADO (Estructura con Pestañas Internas) */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-xs border border-outline-variant/40 p-5 flex flex-col gap-5">
        {/* Encabezado del Eslabón Activo */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-outline-variant/20">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center font-mono font-bold text-sm shadow-xs shrink-0">
              {selectedActivity.step}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-on-surface">
                  {selectedActivity.name} &bull; {selectedActivity.subname}
                </h3>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                    selectedActivity.coverageStatus === 'alert'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {selectedActivity.coverage}% Cobertura
                </span>
              </div>
              <p className="text-xs text-outline mt-0.5">
                {selectedActivity.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs shrink-0">
            <div className="px-3 py-1.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-center">
              <span className="text-[10px] text-outline uppercase block">Asignados</span>
              <span className="font-bold text-on-surface">{selectedActivity.headcount} pers.</span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-surface-container-low border border-outline-variant/30 text-center">
              <span className="text-[10px] text-outline uppercase block">Eficiencia</span>
              <span className="font-bold text-primary">{selectedActivity.costEfficiency}</span>
            </div>
          </div>
        </div>

        {/* Selector de Pestañas de Detalle */}
        <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl border border-outline-variant/20 w-full sm:w-auto self-start text-xs">
          {([
            { id: 'roles', label: `Puestos y Roles (${selectedActivity.rolesList.length})`, icon: 'badge' },
            { id: 'skills', label: `Matriz de Habilidades (${selectedActivity.skillsMatrix.length})`, icon: 'analytics' },
            { id: 'talent', label: `Top Talento Referente (${selectedActivity.topTalent.length})`, icon: 'stars' },
            { id: 'ai', label: 'Diagnóstico NEXUS AI', icon: 'psychology' },
          ] as const).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveDetailTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                activeDetailTab === tab.id
                  ? 'bg-surface-container-lowest text-primary shadow-xs font-semibold'
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* PESTAÑA 1: Puestos y Roles Clave */}
        {activeDetailTab === 'roles' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs text-outline font-medium">
                Cargos que ejecutan este eslabón y su nivel de impacto estratégico
              </span>
              <button
                type="button"
                onClick={() => onNavigate('puestos')}
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>Catálogo de Puestos</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {selectedActivity.rolesList.map((role, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-surface-container-low rounded-xl border border-outline-variant/20 flex items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <span className="material-symbols-outlined text-[18px]">{role.icon}</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-on-surface leading-tight">{role.name}</h4>
                      <span className="text-[11px] text-outline mt-0.5 block">{role.count}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-surface-container-highest text-on-surface shrink-0">
                    {role.impact}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PESTAÑA 2: Matriz de Habilidades y Brechas */}
        {activeDetailTab === 'skills' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs text-outline font-medium">
                Comparativa entre el nivel real del equipo vs. el requerido por el negocio
              </span>
              <span className="text-xs text-outline">Escala de 1 a 5.0</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {selectedActivity.skillsMatrix.map((item, idx) => {
                const isOptimal = item.status === 'optimal';
                const percent = Math.min((item.actual / 5.0) * 100, 100);
                const benchmarkPercent = Math.min((item.expected / 5.0) * 100, 100);

                return (
                  <div
                    key={idx}
                    className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/20 flex flex-col gap-2 shadow-2xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="text-xs font-bold text-on-surface block leading-tight">
                          {item.name}
                        </span>
                        {item.technicalName && (
                          <span className="text-[11px] text-outline block mt-0.5">
                            {item.technicalName}
                          </span>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-xs font-bold ${isOptimal ? 'text-primary' : 'text-amber-600'}`}>
                          {item.actual} / 5.0
                        </span>
                        <span className="text-[10px] text-outline block">
                          (Req: {item.expected})
                        </span>
                      </div>
                    </div>

                    {/* Barra de progreso comparativa */}
                    <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden relative my-1">
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-on-surface z-10"
                        style={{ left: `${benchmarkPercent}%` }}
                        title={`Requerido: ${item.expected}`}
                      />
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isOptimal ? 'bg-primary' : 'bg-amber-500'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-outline-variant/20">
                      <span className={`font-semibold ${isOptimal ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {item.note}
                      </span>
                      <span className="text-[11px] text-outline">
                        {item.status === 'optimal' ? 'Óptimo' : 'Brecha detectada'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PESTAÑA 3: Top Talento Referente */}
        {activeDetailTab === 'talent' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs text-outline font-medium">
                Colaboradores de alto desempeño asignados a este eslabón
              </span>
              <span className="text-xs text-primary font-semibold">
                {selectedActivity.topTalent.length} referentes
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {selectedActivity.topTalent.map((person, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/20 flex flex-col justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-start gap-3">
                    <UserAvatar name={person.name} size="md" shape="rounded" />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-on-surface truncate">
                        {person.name}
                      </h4>
                      <p className="text-[11px] text-outline truncate">{person.role}</p>
                      <div className="flex items-center gap-1.5 mt-1 text-xs">
                        <span className="font-bold text-primary">{person.match} fit</span>
                        <span className="text-outline">&bull;</span>
                        <span className="text-[11px] text-on-surface-variant">{person.tag}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between text-xs">
                    <span className="text-emerald-700 flex items-center gap-1 font-semibold text-xs">
                      <span className="material-symbols-outlined text-[15px]">trending_up</span>
                      <span>{person.impactText}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleGoToTalent(person.name)}
                      className="font-semibold text-primary hover:underline flex items-center gap-0.5 cursor-pointer text-xs"
                    >
                      <span>Perfil 360°</span>
                      <span className="material-symbols-outlined text-[14px]">chevron_right</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PESTAÑA 4: Diagnóstico NEXUS AI */}
        {activeDetailTab === 'ai' && (
          <div className="flex flex-col gap-4">
            <div className="p-4 bg-primary/5 rounded-2xl border border-primary/20 flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-xl">psychology</span>
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold text-on-surface">Recomendación Predictiva NEXUS AI</h4>
                <p className="text-xs text-on-surface-variant leading-relaxed mt-1">
                  {selectedActivity.aiRecommendation}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate('capacitacion-upskilling')}
                className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">school</span>
                <span>Asignar Plan de Capacitación</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('reclutamiento')}
                className="px-4 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-medium border border-outline-variant/30 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px] text-primary">person_add</span>
                <span>Abrir Vacante en Reclutamiento</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: SIMULADOR DE REASIGNACIÓN DE RECURSOS */}
      {showSimulateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div
            ref={simulationModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="simulation-modal-title"
            className="bg-surface-container-lowest max-w-md w-full rounded-3xl p-6 shadow-2xl border border-outline-variant/40 flex flex-col gap-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">science</span>
                </div>
                <h3 id="simulation-modal-title" className="text-base font-bold text-on-surface">
                  Simulador de Reasignación
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSimulateModal(false)}
                className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-outline cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleSimulate} className="flex flex-col gap-4 text-xs">
              <div>
                <label className="font-semibold text-on-surface block mb-1">
                  Eslabón a Reforzar:
                </label>
                <div className="p-2.5 bg-surface-container-low rounded-xl font-bold text-on-surface text-xs border border-outline-variant/20">
                  {selectedActivity.name} &bull; {selectedActivity.subname}
                </div>
              </div>

              <div>
                <div className="flex justify-between font-semibold text-on-surface mb-1">
                  <span>Colaboradores asignados:</span>
                  <span className="text-primary font-bold">{simulationHeadcount} personas</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="60"
                  value={simulationHeadcount}
                  onChange={(e) => setSimulationHeadcount(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-semibold text-on-surface mb-1">
                  <span>Presupuesto capacitación / reskilling:</span>
                  <span className="text-primary font-bold">${simulationBudget}k USD</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="300"
                  step="10"
                  value={simulationBudget}
                  onChange={(e) => setSimulationBudget(Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>

              <div className="p-3 bg-surface-container-low rounded-xl text-outline text-xs leading-relaxed border border-outline-variant/20">
                <strong className="text-on-surface font-semibold">Proyección:</strong> Con {simulationHeadcount} personas y ${simulationBudget}k USD, la cobertura se estima en <strong>99.4%</strong> (-85% riesgo de demoras).
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setShowSimulateModal(false)}
                  className="px-3.5 py-1.5 rounded-xl text-outline font-semibold hover:bg-surface-container cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary text-on-primary font-bold hover:bg-primary-container shadow-xs cursor-pointer flex items-center gap-1.5 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                  <span>Aplicar Simulación</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
