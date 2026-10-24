import React, { useState, useEffect, useMemo } from 'react';
import { ScreenId } from '../../types';
import { UserAvatar } from '../UserAvatar';
import { QuickGuideBanner } from '../QuickGuideBanner';
import { useToast } from '../ToastProvider';
import { useFocusTrap } from '../useFocusTrap';
import { evaluationsApi } from '../../services/api';

interface EvaluacionScreenProps {
  onNavigate: (screen: ScreenId) => void;
  onSelectEmployee?: (employeeId: string) => void;
}

export interface EvaluationRecord {
  id: string;
  employeeName: string;
  role: string;
  area: string;
  avatar: string;
  evaluator: string;
  selfScore: number;
  managerScore: number;
  peersScore: number;
  calibratedScore: number;
  box9: 'Talento Destacado (Estrella)' | 'Alto Potencial' | 'Desempeño Sólido' | 'Especialista Clave' | 'En Desarrollo';
  status: 'Calibrado' | 'En Revisión' | 'Pendiente Comité';
  gapAnalysis: string;
  potentialScore: number; // 1-5
  performanceScore: number; // 1-5
}

const INITIAL_RECORDS: EvaluationRecord[] = [
  {
    id: 'lucas',
    employeeName: 'Ing. Lucas Valenzuela',
    role: 'Arquitecto Principal de Plataforma y Nube',
    area: 'Infraestructura y Plataforma',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    evaluator: 'Martín Krause (VP de Ingeniería)',
    selfScore: 4.8,
    managerScore: 4.7,
    peersScore: 4.75,
    calibratedScore: 4.74,
    box9: 'Talento Destacado (Estrella)',
    status: 'Calibrado',
    gapAnalysis: 'Superávit en Alta Disponibilidad y Resiliencia; oportunidad leve en gestión de costos en la nube.',
    potentialScore: 4.9,
    performanceScore: 4.8,
  },
  {
    id: 'sofia',
    employeeName: 'Sofía Méndez',
    role: 'Líder de Ingeniería en Inteligencia Artificial',
    area: 'Algoritmos de Inteligencia Artificial',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    evaluator: 'Elena Rostova (Directora de Inteligencia Artificial)',
    selfScore: 4.9,
    managerScore: 4.85,
    peersScore: 4.95,
    calibratedScore: 4.9,
    box9: 'Talento Destacado (Estrella)',
    status: 'Calibrado',
    gapAnalysis: 'Liderazgo técnico referente; elegible a Ingeniero Principal.',
    potentialScore: 5.0,
    performanceScore: 4.9,
  },
  {
    id: 'marcos',
    employeeName: 'Marcos Varela',
    role: 'Ingeniero Principal de Datos',
    area: 'Plataformas de Datos y Procesamiento en Tiempo Real',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    evaluator: 'Lucas Valenzuela (Arquitecto Principal de Plataforma)',
    selfScore: 4.5,
    managerScore: 4.6,
    peersScore: 4.4,
    calibratedScore: 4.55,
    box9: 'Especialista Clave',
    status: 'Calibrado',
    gapAnalysis: 'Desempeño técnico sobresaliente en procesamiento de eventos y datos; reforzar la mentoría entre equipos.',
    potentialScore: 4.2,
    performanceScore: 4.7,
  },
  {
    id: 'gabriel',
    employeeName: 'Gabriel Pardo',
    role: 'Especialista en Operaciones de Desarrollo e IA',
    area: 'Operaciones de IA e Infraestructura de Cómputo',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    evaluator: 'Sofía Méndez (Líder de IA)',
    selfScore: 4.2,
    managerScore: 4.1,
    peersScore: 4.3,
    calibratedScore: 4.18,
    box9: 'Alto Potencial',
    status: 'En Revisión',
    gapAnalysis: 'Progreso acelerado en orquestación Ray; brecha moderada en seguridad clúster.',
    potentialScore: 4.6,
    performanceScore: 4.1,
  },
  {
    id: 'laura',
    employeeName: 'Lic. Laura Benítez',
    role: 'Arquitecto de Seguridad y Accesos',
    area: 'Ciberseguridad y Cumplimiento Normativo',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
    evaluator: 'Martín Krause (VP de Ingeniería)',
    selfScore: 4.6,
    managerScore: 4.4,
    peersScore: 4.5,
    calibratedScore: 4.48,
    box9: 'Desempeño Sólido',
    status: 'Pendiente Comité',
    gapAnalysis: 'Cero incidentes críticos de seguridad; revisión de banda salarial pendiente.',
    potentialScore: 4.3,
    performanceScore: 4.5,
  },
];

export const EvaluacionScreen: React.FC<EvaluacionScreenProps> = ({
  onNavigate,
  onSelectEmployee,
}) => {
  const { showToast } = useToast();
  const [records, setRecords] = useState<EvaluationRecord[]>(INITIAL_RECORDS);
  const [selectedRecordId, setSelectedRecordId] = useState<string>('lucas');
  const [selectedCycle, setSelectedCycle] = useState<string>('Ciclo Anual 2026 (Calibración Q4)');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'calibrated' | 'pending'>('all');
  const [showCalibrateModal, setShowCalibrateModal] = useState<boolean>(false);
  const [calibrationScore, setCalibrationScore] = useState<number>(4.75);
  const [calibrationNotes, setCalibrationNotes] = useState<string>(
    'Se valida consistencia en entregables de alta disponibilidad y aporte a la estabilidad de la plataforma durante Q4.'
  );
  const [showConfirmApproval, setShowConfirmApproval] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'list' | '9box' | 'committee'>('list');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const [sortConfig, setSortConfig] = useState<{
    key: 'employeeName' | 'calibratedScore' | 'status';
    direction: 'asc' | 'desc';
  }>({
    key: 'calibratedScore',
    direction: 'desc',
  });

  const calibrateModalRef = useFocusTrap<HTMLDivElement>(showCalibrateModal);
  const approvalModalRef = useFocusTrap<HTMLDivElement>(showConfirmApproval);

  useEffect(() => {
    let isMounted = true;
    evaluationsApi
      .getAll()
      .then((res) => {
        if (isMounted && res.data && res.data.length > 0) {
          const mapped: EvaluationRecord[] = res.data.map((d: any) => ({
            id: d.id,
            employeeName: d.employeeName,
            role: d.role,
            area: d.area,
            avatar:
              d.avatar ||
              (d.id.includes('lucas')
                ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
                : d.id.includes('sofia')
                ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80'
                : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80'),
            evaluator: d.evaluator || 'Comité de Calibración Q4',
            selfScore: d.selfScore ?? 4.5,
            managerScore: d.managerScore ?? 4.6,
            peersScore: d.peersScore ?? 4.4,
            calibratedScore: d.calibratedScore ?? 4.7,
            box9: (d.box9 as any) || 'Desempeño Sólido',
            status: (d.status as any) || 'Calibrado',
            gapAnalysis: d.gapAnalysis || 'Evaluación de competencias anual',
            potentialScore: d.potentialScore ?? 4.5,
            performanceScore: d.performanceScore ?? 4.5,
          }));
          setRecords(mapped);
        }
      })
      .catch(() => {
        // Fallback local en memoria
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const activeRecord: EvaluationRecord = useMemo(() => {
    return records.find((r) => r.id === selectedRecordId) || records[0];
  }, [records, selectedRecordId]);

  const handleSaveCalibration = async (e: React.FormEvent) => {
    e.preventDefault();
    let updatedBox9 = activeRecord.box9;
    if (calibrationScore >= 4.7) {
      updatedBox9 = 'Talento Destacado (Estrella)';
    } else if (calibrationScore >= 4.4) {
      updatedBox9 = 'Alto Potencial';
    } else if (calibrationScore >= 4.0) {
      updatedBox9 = 'Desempeño Sólido';
    }

    try {
      const res = await evaluationsApi.calibrate(activeRecord.id, {
        calibratedScore: calibrationScore,
        box9: updatedBox9,
        notes: calibrationNotes,
      });
      setRecords((prev) =>
        prev.map((r) =>
          r.id === activeRecord.id
            ? {
                ...r,
                calibratedScore: calibrationScore,
                box9: updatedBox9,
                status: 'Calibrado',
              }
            : r
        )
      );
      showToast(
        res?.message ||
          `Calibración de ${activeRecord.employeeName} actualizada a ${calibrationScore.toFixed(2)}.`,
        'success'
      );
    } catch {
      setRecords((prev) =>
        prev.map((r) =>
          r.id === activeRecord.id
            ? {
                ...r,
                calibratedScore: calibrationScore,
                box9: updatedBox9,
                status: 'Calibrado',
              }
            : r
        )
      );
      showToast(
        `Calibración de ${activeRecord.employeeName} actualizada a ${calibrationScore.toFixed(2)}.`,
        'success'
      );
    }
    setShowCalibrateModal(false);
  };

  const handleApproveAll = async () => {
    setRecords((prev) => prev.map((r) => ({ ...r, status: 'Calibrado' as const })));
    showToast('Ciclo de calibración aprobado exitosamente.', 'success');
    setShowConfirmApproval(false);
  };

  const handleExport9Box = async () => {
    setIsExporting(true);
    try {
      await evaluationsApi.download9Box('xlsx');
      showToast('Matriz 9-Box descargada exitosamente en formato Excel.', 'success');
    } catch {
      showToast('Matriz 9-Box exportada (modo local).', 'info');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSort = (key: 'employeeName' | 'calibratedScore' | 'status') => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const filteredRecords = records.filter((r) => {
    if (selectedFilter === 'calibrated') return r.status === 'Calibrado';
    if (selectedFilter === 'pending')
      return r.status === 'Pendiente Comité' || r.status === 'En Revisión';
    return true;
  });

  const orderedRecords = [...filteredRecords].sort((a, b) => {
    const { key, direction } = {
      key: sortConfig.key,
      direction: sortConfig.direction === 'asc' ? 1 : -1,
    };

    if (key === 'employeeName') {
      return a.employeeName.localeCompare(b.employeeName) * direction;
    }

    if (key === 'status') {
      return a.status.localeCompare(b.status) * direction;
    }

    return (a.calibratedScore - b.calibratedScore) * direction;
  });

  // Métricas dinámicas calculadas 100% desde los datos
  const totalRecords = records.length;
  const totalEvaluated = records.filter((r) => r.status === 'Calibrado').length;

  const avgPerformance = useMemo(() => {
    if (records.length === 0) return '0.00';
    const sum = records.reduce((acc, r) => acc + (r.calibratedScore || 0), 0);
    return (sum / records.length).toFixed(2);
  }, [records]);

  const starTalentCount = useMemo(() => {
    return records.filter(
      (r) => r.box9 === 'Talento Destacado (Estrella)' || r.calibratedScore >= 4.7
    ).length;
  }, [records]);

  const pendingCalibrationCount = useMemo(() => {
    return records.filter((r) => r.status !== 'Calibrado').length;
  }, [records]);

  // Función de consulta dinámica para la Matriz 9-Box
  const getEmployeesForBox = (
    perfTier: 'low' | 'med' | 'high',
    potTier: 'low' | 'med' | 'high'
  ) => {
    return records.filter((r) => {
      const perf = r.performanceScore ?? r.calibratedScore;
      const pot = r.potentialScore ?? r.calibratedScore;
      const matchPerf =
        perfTier === 'high' ? perf >= 4.6 : perfTier === 'med' ? perf >= 4.1 && perf < 4.6 : perf < 4.1;
      const matchPot =
        potTier === 'high' ? pot >= 4.6 : potTier === 'med' ? pot >= 4.1 && pot < 4.6 : pot < 4.1;
      return matchPerf && matchPot;
    });
  };

  // Curva estadística de distribución de comité
  const countEstrella = starTalentCount;
  const countSolido = records.filter(
    (r) => r.calibratedScore >= 4.2 && r.calibratedScore < 4.7
  ).length;
  const countAcomp = records.filter((r) => r.calibratedScore < 4.2).length;

  const pctEstrella = totalRecords > 0 ? ((countEstrella / totalRecords) * 100).toFixed(1) : '0.0';
  const pctSolido = totalRecords > 0 ? ((countSolido / totalRecords) * 100).toFixed(1) : '0.0';
  const pctAcomp = totalRecords > 0 ? ((countAcomp / totalRecords) * 100).toFixed(1) : '0.0';

  return (
    <div className="w-full px-6 lg:px-8 py-6 flex flex-col gap-6 pb-20">
      {/* Header & Global Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-on-surface tracking-tight font-headline">
            Evaluación de Desempeño
          </h1>
          <p className="text-xs text-on-surface-variant font-medium mt-0.5">
            {records.length} colaboradores en ciclo de evaluación 360° y matriz de talento
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedCycle}
            onChange={(e) => setSelectedCycle(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-medium bg-surface-container text-on-surface border border-outline-variant/40 outline-none cursor-pointer"
          >
            <option value="Ciclo Anual 2026 (Calibración Q4)">Ciclo Anual 2026 (Activo)</option>
            <option value="Mid-Year Review 2026">Revisión Mid-Year 2026</option>
            <option value="Ciclo Anual 2025">Ciclo Anterior 2025</option>
          </select>
          <button
            type="button"
            onClick={() => setShowConfirmApproval(true)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-primary text-on-primary hover:bg-primary-container transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Cerrar y aprobar las calibraciones del ciclo oficial"
          >
            <span className="material-symbols-outlined text-[16px]">assignment_turned_in</span>
            <span>Aprobar Evaluaciones</span>
          </button>
        </div>
      </div>

      {/* Slim Guide Bar */}
      <QuickGuideBanner
        title="Guía de Evaluaciones y Matriz 9-Box"
        description="Rendimiento del colaborador y su potencial de crecimiento futuro mediante consenso 360°."
        tips={[
          'En "Fichas 360°" podés revisar la nota técnica, autoevaluación y feedback de pares.',
          'En "Matriz de 9 Cajas" verás el cuadrante visual que cruza desempeño actual vs potencial.',
          'Al finalizar las calibraciones, usá "Aprobar Evaluaciones" para cerrar el ciclo oficialmente.',
        ]}
        dismissible={true}
      />

      {/* Clean 4-Metric Status Strip - Calculado 100% dinámicamente desde datos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-surface-container-lowest px-4 py-3 rounded-xl border border-outline-variant/30 flex flex-col gap-1 shadow-2xs">
          <span className="text-xs text-on-surface-variant font-medium">Colaboradores calibrados</span>
          <div className="text-xl font-bold text-on-surface">
            {totalEvaluated}{' '}
            <span className="text-xs font-normal text-outline">/ {totalRecords} finalizados</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest px-4 py-3 rounded-xl border border-outline-variant/30 flex flex-col gap-1 shadow-2xs">
          <span className="text-xs text-on-surface-variant font-medium">Promedio desempeño</span>
          <div className="text-xl font-bold text-primary">
            {avgPerformance} <span className="text-xs font-normal text-outline">/ 5.0</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest px-4 py-3 rounded-xl border border-outline-variant/30 flex flex-col gap-1 shadow-2xs">
          <span className="text-xs text-on-surface-variant font-medium">Talento destacado</span>
          <div className="text-xl font-bold text-emerald-600">
            {starTalentCount} <span className="text-xs font-normal text-outline">estrellas</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest px-4 py-3 rounded-xl border border-outline-variant/30 flex flex-col gap-1 shadow-2xs">
          <span className="text-xs text-on-surface-variant font-medium">Pendientes de calibrar</span>
          <div className="text-xl font-bold text-amber-600">
            {pendingCalibrationCount} <span className="text-xs font-normal text-outline">casos</span>
          </div>
        </div>
      </div>

      {/* Tabs Selector: Vista Lista 360°, Matriz 9-Box, Sesión de Comité */}
      <div className="flex items-center gap-1.5 bg-surface-container-low p-1.5 rounded-2xl border border-outline-variant/20 shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveTab('list')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
            activeTab === 'list'
              ? 'bg-surface-container-lowest text-primary shadow-xs ring-1 ring-primary/20 font-semibold'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">fact_check</span>
          <span>Fichas 360° ({filteredRecords.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('9box')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
            activeTab === '9box'
              ? 'bg-surface-container-lowest text-primary shadow-xs ring-1 ring-primary/20 font-semibold'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">grid_view</span>
          <span>Matriz de 9 Cajas (9-Box)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('committee')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
            activeTab === 'committee'
              ? 'bg-surface-container-lowest text-primary shadow-xs ring-1 ring-primary/20 font-semibold'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">groups</span>
          <span>Comité de Calibración</span>
        </button>
      </div>

      {/* TAB 1: Lista de Evaluaciones 360° */}
      {activeTab === 'list' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Columna Izquierda: Listado */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl border border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setSelectedFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    selectedFilter === 'all'
                      ? 'bg-surface-container-lowest text-primary font-semibold shadow-2xs'
                      : 'text-outline hover:text-on-surface'
                  }`}
                >
                  Todos ({records.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFilter('calibrated')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    selectedFilter === 'calibrated'
                      ? 'bg-surface-container-lowest text-primary font-semibold shadow-2xs'
                      : 'text-outline hover:text-on-surface'
                  }`}
                >
                  Calibrados ({totalEvaluated})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedFilter('pending')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    selectedFilter === 'pending'
                      ? 'bg-surface-container-lowest text-primary font-semibold shadow-2xs'
                      : 'text-outline hover:text-on-surface'
                  }`}
                >
                  Pendientes ({pendingCalibrationCount})
                </button>
              </div>

              {/* Sorting toolbar */}
              <div className="flex items-center gap-2 text-xs text-outline">
                <span>Ordenar:</span>
                <button
                  type="button"
                  onClick={() => handleSort('calibratedScore')}
                  className={`px-2.5 py-1 rounded-lg border flex items-center gap-1 cursor-pointer transition-all ${
                    sortConfig.key === 'calibratedScore'
                      ? 'bg-surface-container border-primary text-primary font-semibold'
                      : 'border-outline-variant/30 hover:border-outline-variant text-on-surface'
                  }`}
                >
                  <span>Puntaje</span>
                  {sortConfig.key === 'calibratedScore' && (
                    <span className="material-symbols-outlined text-[14px]">
                      {sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleSort('employeeName')}
                  className={`px-2.5 py-1 rounded-lg border flex items-center gap-1 cursor-pointer transition-all ${
                    sortConfig.key === 'employeeName'
                      ? 'bg-surface-container border-primary text-primary font-semibold'
                      : 'border-outline-variant/30 hover:border-outline-variant text-on-surface'
                  }`}
                >
                  <span>Nombre</span>
                  {sortConfig.key === 'employeeName' && (
                    <span className="material-symbols-outlined text-[14px]">
                      {sortConfig.direction === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                    </span>
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {orderedRecords.map((record) => {
                const isSelected = activeRecord.id === record.id;
                const isCalibrated = record.status === 'Calibrado';

                return (
                  <div
                    key={record.id}
                    onClick={() => setSelectedRecordId(record.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2.5 ${
                      isSelected
                        ? 'bg-surface-container-lowest border-primary ring-1 ring-primary/30 shadow-xs'
                        : 'bg-surface-container-lowest hover:bg-surface-container-low border-outline-variant/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <UserAvatar name={record.employeeName} size="md" shape="rounded" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-on-surface truncate">
                              {record.employeeName}
                            </h3>
                            <span className="flex items-center gap-1 text-xs text-on-surface-variant font-medium shrink-0">
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isCalibrated ? 'bg-emerald-500' : 'bg-amber-500'
                                }`}
                              />
                              {record.status}
                            </span>
                          </div>
                          <p className="text-xs text-outline truncate">{record.role}</p>
                          <p className="text-xs text-outline font-normal mt-0.5 truncate">
                            {record.area}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-lg font-bold text-primary">
                          {record.calibratedScore.toFixed(2)}
                        </div>
                        <span className="text-xs text-outline font-normal">Puntaje final</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20 text-xs">
                      <span className="text-on-surface-variant font-medium">{record.box9}</span>
                      <span className="text-outline">Evaluador: {record.evaluator}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Columna Derecha: Ficha 360° Detalle */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-2xs sticky top-6">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <UserAvatar name={activeRecord.employeeName} size="lg" shape="rounded" />
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-on-surface truncate">
                      {activeRecord.employeeName}
                    </h3>
                    <p className="text-xs text-outline truncate">{activeRecord.role}</p>
                    <p className="text-xs text-primary font-medium mt-0.5 truncate">
                      {activeRecord.area}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-2xl font-bold text-primary">
                    {activeRecord.calibratedScore.toFixed(2)}
                  </div>
                  <span className="text-xs text-outline">Escala 1 a 5</span>
                </div>
              </div>

              {/* Comparativo de Calificaciones 360° */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-surface-container-low rounded-xl text-center text-xs border border-outline-variant/20 my-4">
                <div>
                  <span className="text-outline text-xs block">Autoevaluación</span>
                  <span className="font-bold text-on-surface text-sm mt-0.5 block">
                    {activeRecord.selfScore.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-outline text-xs block">Líder Directo</span>
                  <span className="font-bold text-on-surface text-sm mt-0.5 block">
                    {activeRecord.managerScore.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-outline text-xs block">Pares (360°)</span>
                  <span className="font-bold text-on-surface text-sm mt-0.5 block">
                    {activeRecord.peersScore.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-3 mb-5 text-xs">
                <div className="flex justify-between items-center py-1.5 border-b border-outline-variant/20">
                  <span className="text-outline">Clasificación 9-Box:</span>
                  <span className="font-semibold text-primary">{activeRecord.box9}</span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-outline-variant/20">
                  <span className="text-outline">Estado del Proceso:</span>
                  <span className="flex items-center gap-1.5 font-medium text-on-surface">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        activeRecord.status === 'Calibrado' ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    />
                    {activeRecord.status}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-outline-variant/20">
                  <span className="text-outline">Potencial de Crecimiento:</span>
                  <span className="font-bold text-on-surface">
                    {activeRecord.potentialScore.toFixed(1)} / 5.0
                  </span>
                </div>
                <div className="flex justify-between items-center py-1.5 border-b border-outline-variant/20">
                  <span className="text-outline">Desempeño Operativo:</span>
                  <span className="font-bold text-on-surface">
                    {activeRecord.performanceScore.toFixed(1)} / 5.0
                  </span>
                </div>
              </div>

              <h4 className="text-xs font-semibold text-on-surface mb-1">
                Conclusiones y Análisis de Brecha
              </h4>
              <p className="text-xs text-on-surface-variant leading-relaxed mb-5">
                {activeRecord.gapAnalysis}
              </p>

              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCalibrationScore(activeRecord.calibratedScore);
                    setShowCalibrateModal(true);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">tune</span>
                  <span>Calibrar en Sesión de Comité</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onSelectEmployee) {
                      onSelectEmployee(activeRecord.id);
                      return;
                    }
                    onNavigate('empleados');
                  }}
                  className="w-full py-2 px-4 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-medium border border-outline-variant/40 transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">person</span>
                  <span>Ver Ficha 360° en Colaboradores</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Matriz 9-Box - Cuadrantes 100% interactivos y dinámicos */}
      {activeTab === '9box' && (
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-2xs flex flex-col gap-6 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-outline-variant/20">
            <div>
              <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">grid_view</span>
                Matriz de Desempeño y Potencial (9 Cajas)
              </h2>
              <p className="text-xs text-outline">
                Segmentación estratégica según potencial futuro (eje vertical) y rendimiento actual (eje horizontal).
              </p>
            </div>
            <button
              type="button"
              onClick={handleExport9Box}
              disabled={isExporting}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-surface-container hover:bg-surface-container-high border border-outline-variant/40 text-on-surface flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Descargar matriz en Excel oficial"
            >
              <span className={`material-symbols-outlined text-sm ${isExporting ? 'animate-spin' : ''}`}>
                {isExporting ? 'progress_activity' : 'download'}
              </span>
              <span>{isExporting ? 'Exportando...' : 'Exportar Matriz Excel'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Fila 1: Alto Potencial */}
            {/* 1.1: Bajo Rendimiento / Alto Potencial */}
            {(() => {
              const emps = getEmployeesForBox('low', 'high');
              return (
                <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/20 flex flex-col justify-between min-h-[140px]">
                  <div>
                    <span className="text-xs font-semibold text-primary block">
                      Enigma / Diamante Bruto
                    </span>
                    <p className="text-xs text-outline mt-0.5">Bajo Rendimiento &bull; Alto Potencial</p>
                  </div>
                  <div className="mt-3">
                    {emps.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {emps.map((e) => (
                          <button
                            key={e.id}
                            type="button"
                            onClick={() => {
                              setSelectedRecordId(e.id);
                              setActiveTab('list');
                            }}
                            className="text-xs font-medium px-2 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/20 text-on-surface cursor-pointer text-left"
                          >
                            {e.employeeName} ({e.calibratedScore.toFixed(2)})
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-outline">0 colaboradores</span>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* 1.2: Rendimiento Medio / Alto Potencial */}
            {(() => {
              const emps = getEmployeesForBox('med', 'high');
              return (
                <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/20 flex flex-col justify-between min-h-[140px]">
                  <div>
                    <span className="text-xs font-semibold text-primary block">
                      Alto Potencial / Futuro Líder
                    </span>
                    <p className="text-xs text-outline mt-0.5">Rendimiento Medio &bull; Alto Potencial</p>
                  </div>
                  <div className="mt-3">
                    {emps.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {emps.map((e) => (
                          <button
                            key={e.id}
                            type="button"
                            onClick={() => {
                              setSelectedRecordId(e.id);
                              setActiveTab('list');
                            }}
                            className="text-xs font-medium px-2 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/20 text-on-surface cursor-pointer text-left"
                          >
                            {e.employeeName} ({e.calibratedScore.toFixed(2)})
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-outline">0 colaboradores</span>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* 1.3: Alto Rendimiento / Alto Potencial (Estrella) */}
            {(() => {
              const emps = getEmployeesForBox('high', 'high');
              return (
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/30 flex flex-col justify-between min-h-[140px] shadow-2xs">
                  <div>
                    <span className="text-xs font-bold text-primary flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">star</span>
                      Talento Estrella (Destacado)
                    </span>
                    <p className="text-xs text-outline mt-0.5">Alto Rendimiento &bull; Alto Potencial</p>
                  </div>
                  <div className="mt-3">
                    {emps.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {emps.map((e) => (
                          <button
                            key={e.id}
                            type="button"
                            onClick={() => {
                              setSelectedRecordId(e.id);
                              setActiveTab('list');
                            }}
                            className="text-xs font-semibold px-2 py-1 rounded-lg bg-surface-container-lowest hover:bg-surface-container border border-primary/30 text-primary cursor-pointer text-left shadow-2xs"
                          >
                            {e.employeeName} ({e.calibratedScore.toFixed(2)})
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-outline">0 colaboradores</span>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Fila 2: Potencial Medio */}
            {/* 2.1: Bajo Rendimiento / Potencial Medio */}
            {(() => {
              const emps = getEmployeesForBox('low', 'med');
              return (
                <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/20 flex flex-col justify-between min-h-[140px]">
                  <div>
                    <span className="text-xs font-semibold text-on-surface block">
                      Dilema / Requiere Impulso
                    </span>
                    <p className="text-xs text-outline mt-0.5">Bajo Rendimiento &bull; Potencial Medio</p>
                  </div>
                  <div className="mt-3">
                    {emps.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {emps.map((e) => (
                          <button
                            key={e.id}
                            type="button"
                            onClick={() => {
                              setSelectedRecordId(e.id);
                              setActiveTab('list');
                            }}
                            className="text-xs font-medium px-2 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/20 text-on-surface cursor-pointer text-left"
                          >
                            {e.employeeName} ({e.calibratedScore.toFixed(2)})
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-outline">0 colaboradores</span>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* 2.2: Rendimiento Medio / Potencial Medio */}
            {(() => {
              const emps = getEmployeesForBox('med', 'med');
              return (
                <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/20 flex flex-col justify-between min-h-[140px]">
                  <div>
                    <span className="text-xs font-semibold text-on-surface block">
                      Profesional Clave / Núcleo
                    </span>
                    <p className="text-xs text-outline mt-0.5">Rendimiento Medio &bull; Potencial Medio</p>
                  </div>
                  <div className="mt-3">
                    {emps.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {emps.map((e) => (
                          <button
                            key={e.id}
                            type="button"
                            onClick={() => {
                              setSelectedRecordId(e.id);
                              setActiveTab('list');
                            }}
                            className="text-xs font-medium px-2 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/20 text-on-surface cursor-pointer text-left"
                          >
                            {e.employeeName} ({e.calibratedScore.toFixed(2)})
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-outline">0 colaboradores</span>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* 2.3: Alto Rendimiento / Potencial Medio */}
            {(() => {
              const emps = getEmployeesForBox('high', 'med');
              return (
                <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/20 flex flex-col justify-between min-h-[140px]">
                  <div>
                    <span className="text-xs font-semibold text-on-surface block">
                      Alto Desempeño / Pilar
                    </span>
                    <p className="text-xs text-outline mt-0.5">Alto Rendimiento &bull; Potencial Medio</p>
                  </div>
                  <div className="mt-3">
                    {emps.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {emps.map((e) => (
                          <button
                            key={e.id}
                            type="button"
                            onClick={() => {
                              setSelectedRecordId(e.id);
                              setActiveTab('list');
                            }}
                            className="text-xs font-medium px-2 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/20 text-on-surface cursor-pointer text-left"
                          >
                            {e.employeeName} ({e.calibratedScore.toFixed(2)})
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-outline">0 colaboradores</span>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Fila 3: Bajo Potencial */}
            {/* 3.1: Bajo Rendimiento / Bajo Potencial */}
            {(() => {
              const emps = getEmployeesForBox('low', 'low');
              return (
                <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/20 flex flex-col justify-between min-h-[140px]">
                  <div>
                    <span className="text-xs font-semibold text-amber-700 block">
                      Riesgo / Desalineado
                    </span>
                    <p className="text-xs text-outline mt-0.5">Bajo Rendimiento &bull; Bajo Potencial</p>
                  </div>
                  <div className="mt-3">
                    {emps.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {emps.map((e) => (
                          <button
                            key={e.id}
                            type="button"
                            onClick={() => {
                              setSelectedRecordId(e.id);
                              setActiveTab('list');
                            }}
                            className="text-xs font-medium px-2 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/20 text-amber-800 cursor-pointer text-left"
                          >
                            {e.employeeName} ({e.calibratedScore.toFixed(2)})
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-outline">0 colaboradores</span>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* 3.2: Rendimiento Medio / Bajo Potencial */}
            {(() => {
              const emps = getEmployeesForBox('med', 'low');
              return (
                <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/20 flex flex-col justify-between min-h-[140px]">
                  <div>
                    <span className="text-xs font-semibold text-on-surface block">
                      Especialista Efectivo
                    </span>
                    <p className="text-xs text-outline mt-0.5">Rendimiento Medio &bull; Bajo Potencial</p>
                  </div>
                  <div className="mt-3">
                    {emps.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {emps.map((e) => (
                          <button
                            key={e.id}
                            type="button"
                            onClick={() => {
                              setSelectedRecordId(e.id);
                              setActiveTab('list');
                            }}
                            className="text-xs font-medium px-2 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/20 text-on-surface cursor-pointer text-left"
                          >
                            {e.employeeName} ({e.calibratedScore.toFixed(2)})
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-outline">0 colaboradores</span>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* 3.3: Alto Rendimiento / Bajo Potencial */}
            {(() => {
              const emps = getEmployeesForBox('high', 'low');
              return (
                <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/20 flex flex-col justify-between min-h-[140px]">
                  <div>
                    <span className="text-xs font-semibold text-on-surface block">
                      Experto Confiable
                    </span>
                    <p className="text-xs text-outline mt-0.5">Alto Rendimiento &bull; Bajo Potencial</p>
                  </div>
                  <div className="mt-3">
                    {emps.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {emps.map((e) => (
                          <button
                            key={e.id}
                            type="button"
                            onClick={() => {
                              setSelectedRecordId(e.id);
                              setActiveTab('list');
                            }}
                            className="text-xs font-medium px-2 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/20 text-on-surface cursor-pointer text-left"
                          >
                            {e.employeeName} ({e.calibratedScore.toFixed(2)})
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-outline">0 colaboradores</span>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* TAB 3: Sesión de Comité de Calibración - Estadísticas reales */}
      {activeTab === 'committee' && (
        <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-2xs flex flex-col gap-6 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-outline-variant/20">
            <div>
              <h2 className="text-base font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">groups</span>
                Sesión de Calibración del Comité de Personas
              </h2>
              <p className="text-xs text-outline">
                Alineación de notas y normalización estadística de la curva de distribución de evaluaciones.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowConfirmApproval(true)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-primary text-on-primary hover:bg-primary-container flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-sm">done_all</span>
              <span>Cerrar y Aprobar Sesión</span>
            </button>
          </div>

          {/* Distribución gaussiana real calculada */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/20">
              <div className="text-xs text-on-surface-variant font-medium">
                Distribución Destacado (Meta: 10-15%)
              </div>
              <div className="text-xl font-bold text-emerald-600 mt-1">
                {pctEstrella}% Real{' '}
                <span className="text-xs font-normal text-outline">({countEstrella} de {totalRecords})</span>
              </div>
              <p className="text-xs text-outline mt-1">
                Colaboradores con puntaje de desempeño y potencial sobresaliente ($\ge 4.7$).
              </p>
            </div>

            <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/20">
              <div className="text-xs text-on-surface-variant font-medium">
                Sólido Esperado (Meta: 65-75%)
              </div>
              <div className="text-xl font-bold text-primary mt-1">
                {pctSolido}% Real{' '}
                <span className="text-xs font-normal text-outline">({countSolido} de {totalRecords})</span>
              </div>
              <p className="text-xs text-outline mt-1">
                Distribución óptima de colaboradores altamente competentes y alineados al rol.
              </p>
            </div>

            <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/20">
              <div className="text-xs text-on-surface-variant font-medium">
                Requiere Acompañamiento (Meta: 10-15%)
              </div>
              <div className="text-xl font-bold text-amber-600 mt-1">
                {pctAcomp}% Real{' '}
                <span className="text-xs font-normal text-outline">({countAcomp} de {totalRecords})</span>
              </div>
              <p className="text-xs text-outline mt-1">
                Colaboradores focalizados con planes formativos y seguimiento asignado.
              </p>
            </div>
          </div>

          {/* Barra de progreso consolidada de la curva */}
          <div className="p-4 bg-surface-container-low/70 rounded-xl border border-outline-variant/20 flex flex-col gap-2">
            <span className="text-xs font-semibold text-on-surface">Curva de Distribución Actual:</span>
            <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full transition-all"
                style={{ width: `${pctEstrella}%` }}
                title={`Destacado: ${pctEstrella}%`}
              />
              <div
                className="bg-primary h-full transition-all"
                style={{ width: `${pctSolido}%` }}
                title={`Sólido: ${pctSolido}%`}
              />
              <div
                className="bg-amber-500 h-full transition-all"
                style={{ width: `${pctAcomp}%` }}
                title={`Acompañamiento: ${pctAcomp}%`}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-outline pt-1">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Destacado ({pctEstrella}%)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-primary" />
                Sólido ({pctSolido}%)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Acompañamiento ({pctAcomp}%)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Calibración */}
      {showCalibrateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div
            ref={calibrateModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="calibrate-title"
            className="bg-surface-container-lowest max-w-md w-full rounded-2xl p-6 shadow-2xl border border-outline-variant/40 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">tune</span>
                <h3 id="calibrate-title" className="text-base font-bold text-on-surface">
                  Calibración en Comité
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCalibrateModal(false)}
                className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-outline cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveCalibration} className="flex flex-col gap-4 text-xs">
              <div className="p-3 bg-surface-container-low rounded-xl flex items-center gap-3">
                <UserAvatar name={activeRecord.employeeName} size="md" shape="rounded" />
                <div>
                  <h4 className="font-semibold text-on-surface text-xs">{activeRecord.employeeName}</h4>
                  <p className="text-outline text-xs">{activeRecord.role}</p>
                </div>
              </div>

              <div>
                <div className="flex justify-between font-medium text-on-surface mb-1">
                  <span>Puntaje consensuado:</span>
                  <span className="text-primary font-bold text-sm">
                    {calibrationScore.toFixed(2)} / 5.0
                  </span>
                </div>
                <input
                  type="range"
                  min="3.0"
                  max="5.0"
                  step="0.05"
                  value={calibrationScore}
                  onChange={(e) => setCalibrationScore(parseFloat(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>

              <div>
                <label className="font-medium text-on-surface block mb-1">
                  Acuerdo del Comité / Justificación:
                </label>
                <textarea
                  rows={3}
                  value={calibrationNotes}
                  onChange={(e) => setCalibrationNotes(e.target.value)}
                  className="w-full p-2.5 bg-surface-container-low rounded-xl border border-outline-variant/40 text-on-surface outline-hidden focus:border-primary resize-none text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCalibrateModal(false)}
                  className="px-4 py-2 rounded-xl text-on-surface-variant font-medium hover:bg-surface-container cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-semibold hover:bg-primary-container shadow-xs cursor-pointer"
                >
                  Registrar Calibración
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Aprobación */}
      {showConfirmApproval && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div
            ref={approvalModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="approval-title"
            className="bg-surface-container-lowest max-w-sm w-full rounded-2xl p-6 shadow-2xl border border-outline-variant/40 flex flex-col gap-4 text-xs animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-xl">
                assignment_turned_in
              </span>
              <h3 id="approval-title" className="text-base font-bold text-on-surface">
                Aprobar Evaluaciones
              </h3>
            </div>
            <p className="text-on-surface-variant leading-relaxed">
              ¿Confirmás el cierre oficial del ciclo de evaluación? Las notas calibradas quedarán
              asentadas en los expedientes de desempeño.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmApproval(false)}
                className="px-4 py-2 rounded-xl text-on-surface-variant font-medium hover:bg-surface-container cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleApproveAll}
                className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-semibold hover:bg-primary-container shadow-xs cursor-pointer"
              >
                Confirmar Aprobación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
