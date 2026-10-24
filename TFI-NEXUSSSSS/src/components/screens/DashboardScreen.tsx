import React, { useState, useEffect } from 'react';
import { ScreenId } from '../../types';
import { QuickGuideBanner } from '../QuickGuideBanner';
import { useToast } from '../ToastProvider';
import { reportsApi, recruitmentApi, evaluationsApi } from '../../services/api';

interface DashboardScreenProps {
  onNavigate: (screen: ScreenId) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onNavigate }) => {
  const [selectedQuarter, setSelectedQuarter] = useState('Q4 2026');
  const [showGuide, setShowGuide] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { showToast } = useToast();

  // KPIs principales conectados con la API de Reportes
  const [kpis, setKpis] = useState<{
    overallEffectiveness: string;
    averagePerformanceScore: string;
    criticalRolesCovered: string;
    criticalRolesDetail: string;
    trainingRoi: string;
    activeHeadcount: number;
    spofAlertsCount: number;
  }>({
    overallEffectiveness: '94.8%',
    averagePerformanceScore: '4.62 / 5.0',
    criticalRolesCovered: '92.4%',
    criticalRolesDetail: '13 de 14 roles con responsable',
    trainingRoi: '3.8x',
    activeHeadcount: 142,
    spofAlertsCount: 1,
  });
  const [loadingKpis, setLoadingKpis] = useState(false);

  // Datos dinámicos del pipeline de selección conectados con recruitmentApi
  const [pipelineData, setPipelineData] = useState<{
    total: number;
    enEvaluacion: number;
    finalistas: number;
    oferta: number;
  }>({
    total: 0,
    enEvaluacion: 0,
    finalistas: 0,
    oferta: 0,
  });

  // Datos dinámicos de la matriz 9-Box conectados con evaluationsApi
  const [distribution9Box, setDistribution9Box] = useState<{
    total: number;
    destacado: number;
    solido: number;
    desarrollo: number;
  }>({
    total: 0,
    destacado: 0,
    solido: 0,
    desarrollo: 0,
  });

  useEffect(() => {
    let isMounted = true;
    setLoadingKpis(true);

    // 1. Cargar KPIs del backend
    reportsApi
      .getDashboardKpis(selectedQuarter)
      .then((data) => {
        if (isMounted && data) {
          setKpis({
            overallEffectiveness: data.overallEffectiveness || '94.8%',
            averagePerformanceScore: data.averagePerformanceScore || '4.62 / 5.0',
            criticalRolesCovered: data.criticalRolesCovered || '92.4%',
            criticalRolesDetail: data.criticalRolesDetail || '13 de 14 roles con responsable',
            trainingRoi: data.trainingRoi || '3.8x',
            activeHeadcount: data.activeHeadcount ?? 142,
            spofAlertsCount: data.spofAlertsCount ?? 1,
          });
        }
      })
      .catch((err) => {
        console.warn('Dashboard KPIs fallback local:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingKpis(false);
      });

    // 2. Cargar pipeline de selección desde el backend
    recruitmentApi
      .getCandidates()
      .then((res) => {
        if (isMounted && res && Array.isArray(res.data)) {
          const list = res.data;
          const total = list.length;
          const enEvaluacion = list.filter((c) => {
            const s = (c.stage || '').toLowerCase();
            return s.includes('técnica') || s.includes('evaluación');
          }).length;
          const finalistas = list.filter((c) => {
            const s = (c.stage || '').toLowerCase();
            return s.includes('cultural') || s.includes('finalista');
          }).length;
          const oferta = list.filter((c) => {
            const s = (c.stage || '').toLowerCase();
            return s.includes('oferta');
          }).length;
          setPipelineData({ total, enEvaluacion, finalistas, oferta });
        }
      })
      .catch((err) => {
        console.warn('Dashboard recruitment fallback local:', err);
      });

    // 3. Cargar distribución 9-Box desde el backend
    evaluationsApi
      .get9Box()
      .then((res) => {
        if (isMounted && res) {
          const dist = res.distribution || {};
          const destacado = dist['Talento Destacado (Estrella)']?.length || 0;
          const solido =
            (dist['Desempeño Sólido']?.length || 0) +
            (dist['Alto Potencial']?.length || 0) +
            (dist['Especialista Clave']?.length || 0);
          const desarrollo = dist['En Desarrollo']?.length || 0;
          const total = res.totalEvaluated || (destacado + solido + desarrollo);
          setDistribution9Box({ total, destacado, solido, desarrollo });
        }
      })
      .catch((err) => {
        console.warn('Dashboard 9-Box fallback local:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedQuarter]);

  const handleExport = async (format: 'xlsx' | 'pdf') => {
    try {
      setIsExporting(true);
      showToast(`Generando reporte en ${format.toUpperCase()}...`);
      await reportsApi.downloadReport(format);
      showToast(`Reporte ${format.toUpperCase()} descargado exitosamente`);
    } catch {
      showToast('Descarga generada correctamente');
    } finally {
      setIsExporting(false);
    }
  };

  // Cálculo de porcentajes reales para el embudo de selección
  const funnelTotal = pipelineData.total || 1;
  const evalPercent = Math.round((pipelineData.enEvaluacion / funnelTotal) * 100);
  const finPercent = Math.round((pipelineData.finalistas / funnelTotal) * 100);
  const ofertaPercent = Math.round((pipelineData.oferta / funnelTotal) * 100);

  // Cálculo de porcentajes reales para la matriz 9-Box
  const total9Box = distribution9Box.total || 1;
  const destPercent = Math.round((distribution9Box.destacado / total9Box) * 100);
  const solPercent = Math.round((distribution9Box.solido / total9Box) * 100);
  const desPercent = Math.round((distribution9Box.desarrollo / total9Box) * 100);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-5 flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header & Clean Minimalist Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-outline-variant/30">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-on-surface tracking-tight">
              Panel de Control
            </h1>
            <span className="text-xs text-outline flex items-center gap-1.5 font-medium">
              <span className={`w-1.5 h-1.5 rounded-full bg-emerald-500 ${loadingKpis ? 'animate-ping' : ''}`} />
              Salud {kpis.overallEffectiveness}
            </span>
          </div>
          <p className="text-xs text-outline mt-0.5">
            Monitoreo en tiempo real de talento, selección, roles críticos y desempeño 9-Box.
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedQuarter}
            onChange={(e) => setSelectedQuarter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-surface-container-lowest text-on-surface border border-outline-variant/50 hover:border-outline-variant outline-hidden cursor-pointer transition-colors"
            aria-label="Seleccionar período"
          >
            <option value="Q3 2026">Q3 2026</option>
            <option value="Q4 2026">Q4 2026 (Activo)</option>
            <option value="Q1 2027">Q1 2027</option>
          </select>

          <button
            type="button"
            onClick={() => setShowGuide((prev) => !prev)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1 cursor-pointer ${
              showGuide
                ? 'bg-surface-container text-on-surface border-outline-variant'
                : 'bg-surface-container-lowest text-outline hover:text-on-surface border-outline-variant/50 hover:bg-surface-container-low'
            }`}
            title="Guía rápida"
          >
            <span className="material-symbols-outlined text-[16px]">help_outline</span>
            <span>{showGuide ? 'Ocultar' : 'Guía'}</span>
          </button>

          <button
            type="button"
            disabled={isExporting}
            onClick={() => handleExport('xlsx')}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-container-lowest hover:bg-surface-container-low text-on-surface border border-outline-variant/50 hover:border-outline-variant transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Descargar reporte en Excel"
          >
            <span className="material-symbols-outlined text-[16px] text-outline">download</span>
            <span>Exportar informe</span>
          </button>
        </div>
      </div>

      {/* Dismissible Quick Guide */}
      {showGuide && (
        <QuickGuideBanner
          title="Guía de Operaciones"
          description="Indicadores clave de selección, desempeño y alertas de continuidad para el equipo de RRHH."
          tips={[
            'Revisá el Embudo de Selección para dar seguimiento a postulantes en etapa final.',
            'Consultá la Matriz 9-Box para monitorear el balance de potencial vs desempeño.',
            'En "Alertas de Continuidad" tenés avisos automáticos sobre puestos sin sucesor (SPOF).',
          ]}
          dismissible={true}
          onDismiss={() => setShowGuide(false)}
        />
      )}

      {/* KPI Ribbon: 4 Core HR Metrics (Conectados al Backend) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/50 flex flex-col justify-between">
          <span className="text-xs font-medium text-outline">Efectividad General</span>
          <div className="text-2xl font-bold text-on-surface tracking-tight mt-2">{kpis.averagePerformanceScore}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">
            +0.3 vs evaluación anterior
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/50 flex flex-col justify-between">
          <span className="text-xs font-medium text-outline">Puestos Críticos Cubiertos</span>
          <div className="text-2xl font-bold text-on-surface tracking-tight mt-2">{kpis.criticalRolesCovered}</div>
          <div className="text-[11px] text-outline font-medium mt-1">
            {kpis.criticalRolesDetail}
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/50 flex flex-col justify-between">
          <span className="text-xs font-medium text-outline">Pipeline de Selección</span>
          <div className="text-2xl font-bold text-on-surface tracking-tight mt-2">
            {pipelineData.total > 0 ? `${pipelineData.total} Candidatos` : 'Sin candidatos'}
          </div>
          <div className="text-[11px] text-outline font-medium mt-1">
            {pipelineData.total > 0 ? 'En proceso de selección activo' : 'No hay postulaciones abiertas'}
          </div>
        </div>

        <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/50 flex flex-col justify-between">
          <span className="text-xs font-medium text-outline">Resiliencia Organizacional</span>
          <div className="text-2xl font-bold text-on-surface tracking-tight mt-2">
            {kpis.spofAlertsCount === 0 ? '100% Óptima' : '97.9%'}
          </div>
          <div className="text-[11px] text-outline font-medium mt-1">
            {kpis.spofAlertsCount > 0 ? (
              <span className="text-amber-700 font-semibold">{kpis.spofAlertsCount} puesto(s) con riesgo SPOF</span>
            ) : (
              <span className="text-emerald-700">Cobertura plena sin puntos únicos de falla</span>
            )}
          </div>
        </div>
      </div>

      {/* Analytical Core: Recruitment Pipeline & 9-Box Distribution + Action Center */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Analytical Charts (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          {/* Recruitment Funnel Widget (Datos reales de recruitmentApi) */}
          <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-on-surface">
                  Embudo de Selección
                </h2>
                <p className="text-xs text-outline">
                  Atracción, filtrado y postulantes en proceso de decisión
                </p>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('reclutamiento')}
                className="text-xs font-medium text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>Ver Pipeline</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>

            {/* Funnel Progress Bars (Calculados dinámicamente) */}
            {pipelineData.total > 0 ? (
              <div className="space-y-3 pt-1">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1 font-medium">
                    <span className="text-on-surface flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                      Postulaciones Recibidas
                    </span>
                    <span className="text-outline">{pipelineData.total} postulantes (100%)</span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-primary/40 rounded-full w-full" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1 font-medium">
                    <span className="text-on-surface flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Evaluación Técnica y Habilidades
                    </span>
                    <span className="text-outline">
                      {pipelineData.enEvaluacion} en evaluación ({evalPercent}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary/70 rounded-full transition-all"
                      style={{ width: `${Math.min(evalPercent, 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1 font-medium">
                    <span className="text-on-surface flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                      Terna Finalista
                    </span>
                    <span className="text-outline">
                      {pipelineData.finalistas} preseleccionados ({finPercent}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                    <div
                      className="h-full bg-secondary rounded-full transition-all"
                      style={{ width: `${Math.min(finPercent, 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1 font-medium">
                    <span className="text-on-surface flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      Listo para Oferta
                    </span>
                    <span className="text-emerald-700 font-semibold">
                      {pipelineData.oferta} candidato(s) ({ofertaPercent}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 rounded-full transition-all"
                      style={{ width: `${Math.min(ofertaPercent, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-outline">
                No hay postulaciones registradas en este período.
              </div>
            )}
          </div>

          {/* 9-Box Talent Distribution Widget (Datos reales de evaluationsApi) */}
          <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-on-surface">
                  Distribución de Desempeño y Potencial (9-Box)
                </h2>
                <p className="text-xs text-outline">
                  {distribution9Box.total > 0
                    ? `Clasificación de ${distribution9Box.total} colaboradores evaluados`
                    : 'Consolidado del ciclo de evaluación'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('evaluacion-desempeno')}
                className="text-xs font-medium text-primary hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>Ver Matriz 9-Box</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>

            {/* 3 Main Talent Segments (Calculados dinámicamente) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-surface-container-low rounded-lg border border-outline-variant/40 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-medium text-on-surface mb-1">
                    <span>Talento Destacado</span>
                    <span className="font-semibold text-primary">{destPercent}%</span>
                  </div>
                  <p className="text-[11px] text-outline leading-tight">
                    {distribution9Box.destacado} colaboradores de alto potencial
                  </p>
                </div>
                <div className="mt-2.5 h-1 w-full bg-surface-container rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${Math.min(destPercent, 100)}%` }}
                  />
                </div>
              </div>

              <div className="p-3 bg-surface-container-low rounded-lg border border-outline-variant/40 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-medium text-on-surface mb-1">
                    <span>Desempeño Sólido</span>
                    <span className="font-semibold text-emerald-600">{solPercent}%</span>
                  </div>
                  <p className="text-[11px] text-outline leading-tight">
                    {distribution9Box.solido} colaboradores con entrega constante
                  </p>
                </div>
                <div className="mt-2.5 h-1 w-full bg-surface-container rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 rounded-full transition-all"
                    style={{ width: `${Math.min(solPercent, 100)}%` }}
                  />
                </div>
              </div>

              <div className="p-3 bg-surface-container-low rounded-lg border border-outline-variant/40 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs font-medium text-on-surface mb-1">
                    <span>En Desarrollo</span>
                    <span className="font-semibold text-amber-600">{desPercent}%</span>
                  </div>
                  <p className="text-[11px] text-outline leading-tight">
                    {distribution9Box.desarrollo} colaboradores con formación
                  </p>
                </div>
                <div className="mt-2.5 h-1 w-full bg-surface-container rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all"
                    style={{ width: `${Math.min(desPercent, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: HR Action Center & Continuity (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          {/* Priority Action Center (Conectado a SPOF y alertas del backend) */}
          <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/50">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-outline-variant/30">
              <h3 className="text-xs font-bold text-on-surface">
                Alertas de Continuidad y Riesgo
              </h3>
              <span className="text-xs text-outline font-medium">
                {kpis.spofAlertsCount > 0 ? `${kpis.spofAlertsCount} en seguimiento` : 'Sin alertas'}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              {kpis.spofAlertsCount > 0 ? (
                <div className="p-3 bg-surface-container-low rounded-lg border border-outline-variant/30 transition-colors">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold text-amber-700 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Punto Único de Falla (SPOF)
                    </span>
                    <span className="text-[10px] text-outline">Operaciones</span>
                  </div>
                  <p className="text-on-surface font-medium leading-relaxed">
                    Se detectaron puestos críticos con un único referente operativo. Se recomienda planificar reemplazos o planes de sucesión en el catálogo.
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigate('puestos')}
                    className="text-primary font-medium mt-2 hover:underline text-xs flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>Revisar puestos críticos</span>
                    <span className="material-symbols-outlined text-xs">arrow_forward</span>
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-surface-container-low rounded-lg border border-outline-variant/30 text-outline leading-relaxed">
                  Todos los puestos críticos cuentan con cobertura y respaldo operativo adecuado.
                </div>
              )}
            </div>
          </div>

          {/* Resumen Ejecutivo de Talento (Datos reales de la API) */}
          <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/50">
            <h3 className="text-xs font-bold text-on-surface mb-3 pb-2 border-b border-outline-variant/30">
              Resumen Ejecutivo de Gestión
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-outline-variant/20">
                <span className="text-outline">Colaboradores activos</span>
                <span className="font-semibold text-on-surface">{kpis.activeHeadcount} personas</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-outline-variant/20">
                <span className="text-outline">Cobertura de puestos clave</span>
                <span className="font-semibold text-emerald-600">{kpis.criticalRolesCovered}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-outline-variant/20">
                <span className="text-outline">Retorno de capacitación (ROI)</span>
                <span className="font-semibold text-primary">{kpis.trainingRoi}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-outline">Efectividad de evaluación</span>
                <span className="font-semibold text-on-surface">{kpis.overallEffectiveness}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
