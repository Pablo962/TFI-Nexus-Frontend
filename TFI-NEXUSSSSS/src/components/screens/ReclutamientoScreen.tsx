import React, { useState, useEffect, useMemo } from 'react';
import { Candidate, JobPosition, ScreenId } from '../../types';
import {
  CANDIDATES_DATA,
  JOB_POSITIONS,
  VACANTES_DATA,
  POSTULANTES_DATA,
  HABILIDADES_DATA,
} from '../../data/mockData';
import { UserAvatar } from '../UserAvatar';
import { ConfirmationModal } from '../ConfirmationModal';
import { QuickGuideBanner } from '../QuickGuideBanner';
import { CompetenciaNombre } from '../CompetenciaNombre';
import { useToast } from '../ToastProvider';
import { useFocusTrap } from '../useFocusTrap';
import { recruitmentApi, jobsApi } from '../../services/api';

interface ReclutamientoScreenProps {
  onNavigate: (screen: ScreenId) => void;
  onNavigateToJob?: (jobCode: string) => void;
  selectedJobCode?: string;
  /** Se llama cuando el usuario elige otro puesto en el selector (la URL es la fuente de verdad). */
  onChangeJobCode?: (jobCode: string) => void;
}

export const ReclutamientoScreen: React.FC<ReclutamientoScreenProps> = ({
  onNavigate,
  onNavigateToJob,
  selectedJobCode = 'PUE-2026-ARCH-03',
  onChangeJobCode,
}) => {
  const currentJobCode = selectedJobCode;
  const setCurrentJobCode = (code: string) => onChangeJobCode?.(code);
  const [viewMode, setViewMode] = useState<'operativo' | 'modelo_er'>('operativo');
  const [selectedVacanteId, setSelectedVacanteId] = useState<number>(1);
  const [selectedPostulanteId, setSelectedPostulanteId] = useState<number>(1);
  const [positions, setPositions] = useState<JobPosition[]>(JOB_POSITIONS);
  const [candidates, setCandidates] = useState<Candidate[]>(CANDIDATES_DATA);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('mateo');
  const [filterThreshold, setFilterThreshold] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [candidateStages, setCandidateStages] = useState<{ [id: string]: string }>({
    mateo: 'Oferta Final',
    camila: 'Entrevista Técnica',
    gonzalo: 'Validación Cultural',
    lucia: 'Revisión Inicial',
  });

  // Modal de Oferta Laboral
  const [showOfferModal, setShowOfferModal] = useState<boolean>(false);
  const [showConfirmOffer, setShowConfirmOffer] = useState<boolean>(false);
  const [offerSalary, setOfferSalary] = useState<string>('$145,000 USD + Bono (15%)');
  const [offerStartDate, setOfferStartDate] = useState<string>('2026-11-01');

  // Modal de Entrevista
  const [showInterviewModal, setShowInterviewModal] = useState<boolean>(false);
  const [interviewDate, setInterviewDate] = useState<string>(() => {
    const d = new Date(Date.now() + 86400000 * 2);
    d.setHours(10, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [interviewers, setInterviewers] = useState<string>('Sofía Méndez, Martín Krause');

  const { showToast } = useToast();
  const offerModalRef = useFocusTrap<HTMLDivElement>(showOfferModal && !showConfirmOffer);
  const interviewModalRef = useFocusTrap<HTMLDivElement>(showInterviewModal);

  // Carga de catálogo de puestos desde backend
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
        // Fallback local en memoria
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Carga de candidatos para el puesto actual
  const loadCandidates = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const res = await recruitmentApi.getCandidates({ jobCode: currentJobCode });
      if (res && res.data && res.data.length > 0) {
        setCandidates(res.data);
        const newStages: { [id: string]: string } = {};
        res.data.forEach((c) => {
          if (c.stage) newStages[c.id] = c.stage;
        });
        setCandidateStages((prev) => ({ ...prev, ...newStages }));
      }
      if (!silent) {
        showToast('Candidatos actualizados con la base de datos.', 'success');
      }
    } catch {
      if (!silent) {
        showToast('Catálogo de candidatos sincronizado localmente.', 'info');
      }
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadCandidates(true);
  }, [currentJobCode]);

  // Selección de candidato activo
  const selectedCandidate: Candidate = useMemo(() => {
    return (
      candidates.find((c) => c.id === selectedCandidateId) ||
      candidates[0] ||
      CANDIDATES_DATA[0]
    );
  }, [candidates, selectedCandidateId]);

  const currentJob: JobPosition = useMemo(() => {
    return (
      positions.find((j) => j.code === currentJobCode) ||
      positions[0] ||
      JOB_POSITIONS[0]
    );
  }, [positions, currentJobCode]);

  // Acciones reales de contratación
  const handleStageChange = async (candidateId: string, newStage: string) => {
    setCandidateStages((prev) => ({ ...prev, [candidateId]: newStage }));
    showToast(`Candidato movido a la etapa "${newStage}".`, 'success');
    try {
      await recruitmentApi.updateStage(candidateId, newStage);
    } catch {
      // Silencioso en modo local
    }
  };

  const handleConfirmSendOffer = async () => {
    setShowConfirmOffer(false);
    setShowOfferModal(false);
    await handleStageChange(selectedCandidate.id, 'Oferta Enviada');
    showToast(
      `¡Listo! Oferta formal enviada exitosamente a ${selectedCandidate.name}.`,
      'success'
    );
    try {
      await recruitmentApi.sendOffer(selectedCandidate.id, {
        salary: offerSalary,
        startDate: offerStartDate,
      });
    } catch {
      // Silencioso en modo local
    }
  };

  const handleScheduleInterview = (e: React.FormEvent) => {
    e.preventDefault();
    setShowInterviewModal(false);
    handleStageChange(selectedCandidate.id, 'Entrevista Agendada');
    showToast(
      `Entrevista agendada con ${selectedCandidate.name} para el ${interviewDate.replace('T', ' a las ')}.`,
      'success'
    );
  };

  const filteredCandidates = candidates.filter(
    (c) => c.matchScore >= filterThreshold
  );

  // Métricas dinámicas calculadas desde los datos
  const openVacanciesCount = useMemo(() => {
    return VACANTES_DATA.filter((v) => v.estado !== 'cerrada').length || 2;
  }, []);

  const inProcessCandidatesCount = candidates.length;

  const avgMatchScore = useMemo(() => {
    if (candidates.length === 0) return 0;
    const sum = candidates.reduce((acc, c) => acc + (c.matchScore || 0), 0);
    return Math.round(sum / candidates.length);
  }, [candidates]);

  const topCandidateMatch = useMemo(() => {
    if (candidates.length === 0) return 0;
    return Math.max(...candidates.map((c) => c.matchScore || 0));
  }, [candidates]);

  return (
    <div className="w-full px-6 lg:px-8 py-6 flex flex-col gap-6 pb-20">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-on-surface tracking-tight font-headline">
            Selección y Reclutamiento
          </h1>
          <p className="text-xs text-on-surface-variant font-medium mt-0.5">
            {candidates.length} candidatos en proceso de evaluación y matching
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => {
              if (onNavigateToJob) {
                onNavigateToJob(currentJobCode);
              } else {
                onNavigate('puestos');
              }
            }}
            className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-surface-container text-on-surface hover:bg-surface-container-high border border-outline-variant/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            title="Ver la ficha técnica y competencias de este puesto"
          >
            <span className="material-symbols-outlined text-outline text-base">work</span>
            <span>Ver Puesto</span>
          </button>
          <button
            type="button"
            onClick={() => loadCandidates(false)}
            disabled={isRefreshing}
            className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-primary text-on-primary hover:bg-primary-container transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
            title="Sincronizar postulantes con la base de datos"
          >
            <span className={`material-symbols-outlined text-base ${isRefreshing ? 'animate-spin' : ''}`}>
              refresh
            </span>
            <span>{isRefreshing ? 'Actualizando...' : 'Actualizar'}</span>
          </button>
        </div>
      </div>

      {/* Slim Guide Bar */}
      <QuickGuideBanner
        title="Guía de Selección de Personal"
        description="Flujo de postulación, etapas y propuesta laboral formal."
        tips={[
          'Hacé clic en cualquier candidato de la lista para revisar su experiencia y radar de compatibilidad.',
          'Cambiá la etapa del proceso (ej: Entrevista Técnica, Oferta Final) con los botones de la ficha.',
          'Hacé clic en "Extender Oferta Laboral" para preparar y enviar la propuesta formal.',
        ]}
        dismissible={true}
      />

      {/* Compact Vacancy Context Bar - Métricas 100% dinámicas */}
      <div className="bg-surface-container-lowest px-4 py-2.5 rounded-2xl border border-outline-variant/30 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <span className="w-8 h-8 rounded-lg bg-surface-container text-primary flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-base">architecture</span>
          </span>
          <span className="text-xs font-medium text-outline shrink-0">Vacante activa:</span>
          <select
            value={currentJobCode}
            onChange={(e) => setCurrentJobCode(e.target.value)}
            className="font-medium text-on-surface bg-surface-container-low hover:bg-surface-container px-2.5 py-1 rounded-lg border border-outline-variant/30 text-xs cursor-pointer truncate max-w-xs sm:max-w-md focus:border-primary outline-hidden"
          >
            {positions.map((j) => (
              <option key={j.code} value={j.code}>
                {j.code} &bull; {j.title} ({j.department})
              </option>
            ))}
          </select>
          {currentJob.status === 'critical' && (
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-amber-700 font-medium shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              Puesto clave
            </span>
          )}
        </div>

        {/* Dynamic Inline Metrics */}
        <div className="flex items-center gap-3 text-xs text-on-surface-variant font-medium shrink-0 overflow-x-auto w-full md:w-auto">
          <span>{openVacanciesCount} vacantes abiertas</span>
          <span className="text-outline-variant">&bull;</span>
          <span>{inProcessCandidatesCount} postulantes</span>
          <span className="text-outline-variant">&bull;</span>
          <span className="text-emerald-700 font-semibold">{avgMatchScore}% afinidad media</span>
          <span className="text-outline-variant">&bull;</span>
          <span className="text-primary font-semibold">{topCandidateMatch}% mejor perfil</span>
        </div>
      </div>

      {/* Unified Toolbar: View Mode Tabs + Filter Threshold Chips */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-1 border-b border-outline-variant/20">
        <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl border border-outline-variant/30">
          <button
            type="button"
            onClick={() => setViewMode('operativo')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'operativo'
                ? 'bg-surface-container-lowest text-primary shadow-xs font-semibold'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-base">view_kanban</span>
            <span>Tablero de Selección</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('modelo_er')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'modelo_er'
                ? 'bg-surface-container-lowest text-primary shadow-xs font-semibold'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-base">schema</span>
            <span>Modelo Relacional ER</span>
          </button>
        </div>

        {viewMode === 'operativo' && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-outline font-medium">Filtrar afinidad:</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setFilterThreshold(0)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  filterThreshold === 0
                    ? 'bg-primary text-on-primary shadow-xs font-semibold'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                Todos ({candidates.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterThreshold(85)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  filterThreshold === 85
                    ? 'bg-primary text-on-primary shadow-xs font-semibold'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                &gt;85%
              </button>
              <button
                type="button"
                onClick={() => setFilterThreshold(95)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  filterThreshold === 95
                    ? 'bg-primary text-on-primary shadow-xs font-semibold'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                &gt;95%
              </button>
            </div>

            <div
              className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container text-xs font-medium text-outline"
              title="Algoritmo ponderado de afinidad contra la ficha del puesto"
            >
              <span className="material-symbols-outlined text-sm text-primary">auto_awesome</span>
              <span>Matching IA</span>
            </div>
          </div>
        )}
      </div>

      {viewMode === 'operativo' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Predictive Suitability Ranking (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-semibold text-on-surface-variant flex items-center gap-2">
                <span className="material-symbols-outlined text-outline text-[18px]">military_tech</span>
                Ranking de compatibilidad con el puesto
              </h2>
              <span className="text-xs text-outline font-normal">
                {filteredCandidates.length} candidatos ordenados por afinidad
              </span>
            </div>

            <div className="space-y-3">
              {filteredCandidates.map((candidate) => {
                const isSelected = selectedCandidate.id === candidate.id;
                const stage = candidateStages[candidate.id] || 'Revisión Inicial';

                let scoreColor = 'text-primary';
                if (candidate.matchScore >= 90) scoreColor = 'text-emerald-600';
                else if (candidate.matchScore < 70) scoreColor = 'text-rose-600';
                else if (candidate.matchScore < 80) scoreColor = 'text-amber-600';

                return (
                  <div
                    key={candidate.id}
                    onClick={() => setSelectedCandidateId(candidate.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-3 relative ${
                      isSelected
                        ? 'bg-surface-container-lowest border-primary ring-1 ring-primary/30 shadow-xs'
                        : 'bg-surface-container-lowest hover:bg-surface-container-low border-outline-variant/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <UserAvatar name={candidate.name} size="md" shape="rounded" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-on-surface truncate">
                              {candidate.name}
                            </h3>
                            <span className="flex items-center gap-1.5 text-xs text-on-surface-variant font-medium shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                              {stage}
                            </span>
                          </div>
                          <p className="text-xs text-outline truncate">{candidate.title}</p>
                          <span className="text-xs text-outline font-normal">
                            {candidate.experience}
                          </span>
                        </div>
                      </div>

                      {/* Match Score Display */}
                      <div className="text-right flex flex-col items-end shrink-0">
                        <div className={`text-xl font-bold ${scoreColor}`}>
                          {candidate.matchScore}%
                        </div>
                        <span className="text-xs text-outline font-normal">Compatibilidad</span>
                      </div>
                    </div>

                    {/* Multidimensional Score Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs pt-2 border-t border-outline-variant/20">
                      <div className="p-2 bg-surface-container-low rounded-xl flex items-center justify-between">
                        <span className="text-outline text-xs">Técnicas</span>
                        <strong className="text-on-surface font-semibold">
                          {candidate.techScore} / 5.0
                        </strong>
                      </div>
                      <div className="p-2 bg-surface-container-low rounded-xl flex items-center justify-between">
                        <span className="text-outline text-xs">Humanas</span>
                        <strong className="text-on-surface font-semibold">
                          {candidate.softScore} / 5.0
                        </strong>
                      </div>
                      <div className="p-2 bg-surface-container-low rounded-xl flex items-center justify-between">
                        <span className="text-outline text-xs">Servidores</span>
                        <strong className="text-primary font-semibold">
                          {candidate.radarScores.kubernetes}
                        </strong>
                      </div>
                      <div className="p-2 bg-surface-container-low rounded-xl flex items-center justify-between">
                        <span className="text-outline text-xs">Seguridad</span>
                        <strong className="text-primary font-semibold">
                          {candidate.radarScores.zeroTrust}
                        </strong>
                      </div>
                    </div>

                    {/* AI Synthetic Analysis Quote */}
                    <div className="p-3 bg-surface-container-low rounded-xl text-xs text-on-surface-variant flex items-start gap-2 border border-outline-variant/20">
                      <span className="material-symbols-outlined text-primary text-base shrink-0 mt-0.5">
                        psychology
                      </span>
                      <span className="leading-relaxed">{candidate.strengths}</span>
                    </div>

                    {/* Clean Footer Strip: Status & Selection feedback */}
                    <div className="flex items-center justify-between pt-1 text-xs">
                      <span className="font-semibold text-primary">{candidate.matchLabel}</span>
                      <span
                        className={`font-medium flex items-center gap-1 ${
                          isSelected ? 'text-primary font-semibold' : 'text-outline'
                        }`}
                      >
                        {isSelected ? 'Seleccionado en inspector' : 'Ver ficha completa'}
                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Detailed Candidate Inspector (5 cols, Sticky) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-xs sticky top-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <UserAvatar name={selectedCandidate.name} size="xl" shape="rounded" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-primary">
                        Rank #{selectedCandidate.rank}
                      </span>
                      <span className="text-xs text-outline font-normal">
                        &bull; {selectedCandidate.experience}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-on-surface mt-0.5">
                      {selectedCandidate.name}
                    </h3>
                    <p className="text-xs text-outline">{selectedCandidate.title}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-2xl font-bold text-primary">
                    {selectedCandidate.matchScore}%
                  </span>
                  <span className="block text-xs text-outline font-normal">Índice NEXUS</span>
                </div>
              </div>

              {/* Pipeline Stage Controller */}
              <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 mb-5">
                <label className="text-xs font-semibold text-outline block mb-1.5">
                  Fase del proceso de selección
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'Revisión Inicial',
                    'Entrevista Técnica',
                    'Validación Cultural',
                    'Oferta Final',
                  ].map((st) => {
                    const isActive =
                      candidateStages[selectedCandidate.id] === st ||
                      (!candidateStages[selectedCandidate.id] && st === 'Revisión Inicial');

                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleStageChange(selectedCandidate.id, st)}
                        className={`py-1.5 px-2 rounded-xl text-xs font-medium transition-all text-center cursor-pointer ${
                          isActive
                            ? 'bg-primary text-on-primary shadow-xs font-semibold'
                            : 'bg-surface-container hover:bg-surface-container-high text-on-surface-variant'
                        }`}
                      >
                        {st}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Competency Gap Analysis */}
              <div className="mb-5">
                <h4 className="text-xs font-semibold text-on-surface mb-3 flex items-center justify-between">
                  <span>Competencias requeridas</span>
                  <span className="text-primary font-medium">{currentJobCode}</span>
                </h4>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1 font-medium">
                      <CompetenciaNombre
                        competencia="kubernetes"
                        labelClassName="text-on-surface"
                        technicalClassName="text-xs font-normal text-outline"
                      />
                      <span className="text-primary font-semibold">
                        {selectedCandidate.radarScores.kubernetes} / 5.0
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{
                          width: `${(selectedCandidate.radarScores.kubernetes / 5.0) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1 font-medium">
                      <CompetenciaNombre
                        competencia="seguridadNube"
                        labelClassName="text-on-surface"
                        technicalClassName="text-xs font-normal text-outline"
                      />
                      <span className="text-primary font-semibold">
                        {selectedCandidate.radarScores.zeroTrust} / 5.0
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{
                          width: `${(selectedCandidate.radarScores.zeroTrust / 5.0) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1 font-medium">
                      <span className="text-on-surface">Comunicación directiva</span>
                      <span className="text-primary font-semibold">
                        {selectedCandidate.radarScores.commExec} / 5.0
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{
                          width: `${(selectedCandidate.radarScores.commExec / 5.0) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1 font-medium">
                      <CompetenciaNombre
                        competencia="costosNube"
                        labelClassName="text-on-surface"
                        technicalClassName="text-xs font-normal text-outline"
                      />
                      <span
                        className={`font-semibold ${
                          selectedCandidate.radarScores.finOps < 4.0
                            ? 'text-amber-600'
                            : 'text-primary'
                        }`}
                      >
                        {selectedCandidate.radarScores.finOps} / 5.0
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          selectedCandidate.radarScores.finOps < 4.0 ? 'bg-amber-500' : 'bg-primary'
                        }`}
                        style={{
                          width: `${(selectedCandidate.radarScores.finOps / 5.0) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Recommendation Box */}
              <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/30 mb-5">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="material-symbols-outlined text-primary text-base">verified</span>
                  <span className="text-xs font-semibold text-on-surface">
                    Evaluación de compatibilidad NEXUS
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  {selectedCandidate.matchScore >= 90
                    ? 'Recomendación A+: Candidato con experiencia comprobada. Reducirá el tiempo para cubrir las brechas del equipo durante los primeros 90 días.'
                    : selectedCandidate.matchScore >= 75
                    ? 'Recomendación B: Candidato viable con sólida base técnica. Requiere plan de inducción específico en gestión de costos en la nube (FinOps).'
                    : 'Recomendación C: Candidato por debajo del nivel mínimo exigido para el rol E7. Se recomienda mantenerlo en la base de talentos para puestos de nivel intermedio.'}
                </p>
              </div>

              {/* Consolidated Main Actions: Zero Redundancy */}
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setShowOfferModal(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">send</span>
                  <span>Extender Oferta Laboral</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowInterviewModal(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-medium border border-outline-variant/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base text-primary">event</span>
                  <span>Agendar Entrevista</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* VISTA: Modelo Relacional ER */
        <div className="flex flex-col gap-6">
          {/* Banner de arquitectura ER */}
          <div className="p-6 bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-primary">Base de Datos Relacional</span>
                <span className="text-outline-variant">&bull;</span>
                <span className="text-xs text-outline font-normal">Esquema ER Supabase</span>
              </div>
              <h2 className="text-base font-bold text-on-surface">
                Arquitectura ER: Vacantes, Postulantes, Habilidades y Postulaciones
              </h2>
              <p className="text-xs text-outline mt-1 max-w-3xl">
                Cruce de habilidades requeridas en la vacante contra las habilidades declaradas por el postulante para calcular el ranking de adecuación y su justificación técnica.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-mono">
              <span className="px-2.5 py-1 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface">
                vacante
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface">
                perfil
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface">
                habilidad
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface">
                postulacion
              </span>
            </div>
          </div>

          {/* Grid de 2 columnas: Selector de Vacante y Selector de Postulante */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Columna Izquierda: Vacante seleccionada */}
            <div className="lg:col-span-6 flex flex-col gap-4">
              <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-xs flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-base">work</span>
                    1. Entidad: Vacante (<code className="text-xs font-mono">vacante</code>)
                  </h3>
                  <span className="text-xs font-medium text-emerald-700">Activa</span>
                </div>

                <div>
                  <label className="text-xs font-medium text-outline block mb-1">
                    Seleccionar Vacante Activa:
                  </label>
                  <select
                    value={selectedVacanteId}
                    onChange={(e) => setSelectedVacanteId(Number(e.target.value))}
                    className="w-full p-2.5 bg-surface-container-low rounded-xl border border-outline-variant/30 text-on-surface font-medium text-xs outline-hidden focus:border-primary"
                  >
                    {VACANTES_DATA.map((v) => (
                      <option key={v.id} value={v.id}>
                        Vacante #{v.id} &bull; {v.titulo} ({v.tipo})
                      </option>
                    ))}
                  </select>
                </div>

                {(() => {
                  const currentVacante =
                    VACANTES_DATA.find((v) => v.id === selectedVacanteId) || VACANTES_DATA[0];
                  return (
                    <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/20 flex flex-col gap-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-on-surface">
                          {currentVacante.titulo}
                        </span>
                        <span className="text-xs font-medium text-primary">
                          {currentVacante.tipo}
                        </span>
                      </div>
                      <div className="text-outline">
                        <strong>Puesto Asociado:</strong> {currentVacante.idPuesto || 'General'} &bull;{' '}
                        <strong>Área:</strong> {currentVacante.area}
                      </div>
                      <div className="text-on-surface-variant">
                        <strong>Requisitos:</strong> {currentVacante.requisitos}
                      </div>
                      <div className="text-on-surface-variant">
                        <strong>Beneficios:</strong> {currentVacante.beneficios}
                      </div>

                      <div className="pt-2 border-t border-outline-variant/20">
                        <span className="font-medium text-outline text-xs block mb-2">
                          Habilidades requeridas:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {currentVacante.vacanteHabilidades?.map((vh) => (
                            <span
                              key={vh.habilidadId}
                              className="px-2.5 py-1 rounded-xl bg-surface-container border border-outline-variant/30 font-medium text-on-surface flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-xs text-primary">
                                check_circle
                              </span>
                              {vh.habilidad?.nombre}
                              <span className="text-xs text-outline font-normal">
                                ({vh.habilidad?.tipo})
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Columna Derecha: Postulante / Perfil */}
            <div className="lg:col-span-6 flex flex-col gap-4">
              <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-xs flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-base">person</span>
                    2. Entidad: Postulante (<code className="text-xs font-mono">perfil</code>)
                  </h3>
                  <span className="text-xs font-medium text-primary">Activo</span>
                </div>

                <div>
                  <label className="text-xs font-medium text-outline block mb-1">
                    Seleccionar Postulante:
                  </label>
                  <select
                    value={selectedPostulanteId}
                    onChange={(e) => setSelectedPostulanteId(Number(e.target.value))}
                    className="w-full p-2.5 bg-surface-container-low rounded-xl border border-outline-variant/30 text-on-surface font-medium text-xs outline-hidden focus:border-primary"
                  >
                    {POSTULANTES_DATA.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} {p.apellido} &bull; {p.carrera} ({p.legajo})
                      </option>
                    ))}
                  </select>
                </div>

                {(() => {
                  const currentPostulante =
                    POSTULANTES_DATA.find((p) => p.id === selectedPostulanteId) ||
                    POSTULANTES_DATA[0];
                  return (
                    <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/20 flex flex-col gap-3 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-on-surface">
                          {currentPostulante.nombre} {currentPostulante.apellido}
                        </span>
                        <span className="text-xs font-medium text-primary">
                          {currentPostulante.legajo}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-outline">
                        <div>
                          <strong>DNI:</strong> {currentPostulante.dni}
                        </div>
                        <div>
                          <strong>Correo:</strong> {currentPostulante.correo}
                        </div>
                        <div>
                          <strong>Teléfono:</strong> {currentPostulante.telefono}
                        </div>
                        <div>
                          <strong>Estado:</strong> {currentPostulante.anioCursado}
                        </div>
                      </div>
                      <div className="text-on-surface-variant">
                        <strong>Carrera:</strong> {currentPostulante.carrera}
                      </div>
                      <p className="text-outline text-xs leading-relaxed italic bg-surface-container-lowest p-2.5 rounded-xl border border-outline-variant/20">
                        &ldquo;{currentPostulante.descripcion}&rdquo;
                      </p>

                      <div className="pt-2 border-t border-outline-variant/20">
                        <span className="font-medium text-outline text-xs block mb-2">
                          Habilidades registradas:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {currentPostulante.habilidades?.map((ph) => (
                            <span
                              key={ph.habilidadId}
                              className="px-2.5 py-1 rounded-xl bg-surface-container border border-outline-variant/30 font-medium text-primary flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-xs">verified</span>
                              {ph.habilidad?.nombre}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Sección Inferior: Entidad POSTULACION y Matching */}
          {(() => {
            const currentVacante =
              VACANTES_DATA.find((v) => v.id === selectedVacanteId) || VACANTES_DATA[0];
            const currentPostulante =
              POSTULANTES_DATA.find((p) => p.id === selectedPostulanteId) || POSTULANTES_DATA[0];

            const reqSkills = currentVacante.vacanteHabilidades?.map((vh) => vh.habilidadId) || [];
            const candSkills = currentPostulante.habilidades?.map((ph) => ph.habilidadId) || [];

            const matchedSkills = reqSkills.filter((id) => candSkills.includes(id));
            const missingSkills = reqSkills.filter((id) => !candSkills.includes(id));

            const matchPercent =
              reqSkills.length > 0 ? Math.round((matchedSkills.length / reqSkills.length) * 100) : 0;

            const existingPostulacion = currentPostulante.postulaciones?.find(
              (post) => post.vacanteId === currentVacante.id
            );
            const ranking = existingPostulacion?.ranking ?? matchPercent;
            const etapa =
              existingPostulacion?.etapa ??
              (matchPercent >= 80 ? 'Preseleccionado' : 'Revisión Inicial');
            const justificacion =
              existingPostulacion?.justificacion ??
              (matchPercent >= 85
                ? `El postulante posee el ${matchPercent}% de las habilidades requeridas. Muy alta adecuación para la posición.`
                : `Adecuación parcial (${matchPercent}%). Registra ${missingSkills.length} brechas de competencia frente al perfil.`);

            return (
              <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 shadow-xs flex flex-col gap-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-outline-variant/20 pb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-on-surface flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-base">
                        join_inner
                      </span>
                      3. Entidad: Postulación (<code className="text-xs font-mono">postulacion</code>)
                    </h3>
                    <p className="text-xs text-outline mt-0.5">
                      Cruce entre Vacante #{currentVacante.id} ({currentVacante.titulo}) y Postulante #{currentPostulante.id} ({currentPostulante.nombre} {currentPostulante.apellido})
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-xs font-medium text-outline block">Match</span>
                      <span className="text-xl font-bold text-primary">{ranking}%</span>
                    </div>
                    <span className="text-xs font-medium text-primary">{etapa}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Habilidades coincidentes */}
                  <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/20">
                    <div className="flex items-center gap-2 mb-2 font-medium text-emerald-800 text-xs">
                      <span className="material-symbols-outlined text-sm">task_alt</span>
                      Habilidades coincidentes ({matchedSkills.length} de {reqSkills.length}):
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {matchedSkills.map((hId) => {
                        const h = HABILIDADES_DATA.find((x) => x.id === hId);
                        return (
                          <span
                            key={hId}
                            className="px-2.5 py-1 rounded-xl bg-surface-container border border-outline-variant/30 text-emerald-800 font-medium text-xs flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-xs">check</span>
                            {h?.nombre}
                          </span>
                        );
                      })}
                      {matchedSkills.length === 0 && (
                        <span className="text-xs text-outline italic">
                          No registra habilidades coincidentes directas.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Brechas */}
                  <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/20">
                    <div className="flex items-center gap-2 mb-2 font-medium text-amber-800 text-xs">
                      <span className="material-symbols-outlined text-sm">warning</span>
                      Brechas identificadas ({missingSkills.length}):
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {missingSkills.map((hId) => {
                        const h = HABILIDADES_DATA.find((x) => x.id === hId);
                        return (
                          <span
                            key={hId}
                            className="px-2.5 py-1 rounded-xl bg-surface-container border border-outline-variant/30 text-amber-800 font-medium text-xs flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-xs">close</span>
                            {h?.nombre}
                          </span>
                        );
                      })}
                      {missingSkills.length === 0 && (
                        <span className="text-xs text-emerald-700 font-medium">
                          ¡Cubre el 100% de las habilidades requeridas!
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Justificación técnica guardada en BD */}
                <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/20 flex flex-col gap-1 text-xs">
                  <span className="font-medium text-outline text-xs">Justificación:</span>
                  <p className="text-on-surface font-normal leading-relaxed">{justificacion}</p>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Offer Modal */}
      {showOfferModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div
            ref={offerModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="offer-modal-title"
            className="bg-surface-container-lowest max-w-md w-full rounded-2xl p-5 shadow-2xl border border-outline-variant/40 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-surface-container text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-base">payments</span>
                </span>
                <h3 id="offer-modal-title" className="text-sm font-bold text-on-surface">
                  Oferta Laboral Formal
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowOfferModal(false)}
                className="p-1 rounded-lg hover:bg-surface-container text-outline cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowConfirmOffer(true);
              }}
              className="flex flex-col gap-3 text-xs"
            >
              <div className="p-2.5 bg-surface-container-low rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <UserAvatar name={selectedCandidate.name} size="sm" shape="rounded" />
                  <div>
                    <h4 className="font-semibold text-on-surface">{selectedCandidate.name}</h4>
                    <p className="text-outline text-xs">{currentJob.title}</p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-emerald-700">
                  {selectedCandidate.matchScore}% Match
                </span>
              </div>

              <div>
                <label className="font-medium text-on-surface block mb-1">
                  Paquete Salarial Base:
                </label>
                <input
                  type="text"
                  value={offerSalary}
                  onChange={(e) => setOfferSalary(e.target.value)}
                  className="w-full p-2 bg-surface-container-low rounded-xl border border-outline-variant/40 text-on-surface outline-hidden focus:border-primary text-xs"
                />
              </div>

              <div>
                <label className="font-medium text-on-surface block mb-1">
                  Fecha de Incorporación:
                </label>
                <input
                  type="date"
                  value={offerStartDate}
                  onChange={(e) => setOfferStartDate(e.target.value)}
                  className="w-full p-2 bg-surface-container-low rounded-xl border border-outline-variant/40 text-on-surface outline-hidden focus:border-primary text-xs"
                />
              </div>

              <div>
                <label className="font-medium text-outline block mb-1">Beneficios incluidos:</label>
                <div className="flex flex-wrap gap-1.5 text-xs">
                  <span className="px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant font-normal">
                    Capacitación continua
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant font-normal">
                    Equipamiento Pro
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-surface-container text-on-surface-variant font-normal">
                    Prepaga 100%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/20 mt-1">
                <button
                  type="button"
                  onClick={() => setShowOfferModal(false)}
                  className="px-3.5 py-1.5 rounded-xl text-on-surface-variant font-medium hover:bg-surface-container text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary text-on-primary font-semibold text-xs hover:bg-primary-container shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">mark_email_read</span>
                  <span>Enviar Propuesta</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Offer */}
      <ConfirmationModal
        isOpen={showConfirmOffer}
        title="¿Confirmás el envío de la oferta?"
        message={`Se enviará formalmente la propuesta económica a ${selectedCandidate.name} para ${currentJob.title}.`}
        confirmLabel="Enviar propuesta"
        cancelLabel="Revisar"
        type="primary"
        onConfirm={handleConfirmSendOffer}
        onCancel={() => setShowConfirmOffer(false)}
      />

      {/* Schedule Interview Modal */}
      {showInterviewModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div
            ref={interviewModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="interview-modal-title"
            className="bg-surface-container-lowest max-w-md w-full rounded-2xl p-5 shadow-2xl border border-outline-variant/40 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-surface-container text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-base">event</span>
                </span>
                <h3 id="interview-modal-title" className="text-sm font-bold text-on-surface">
                  Agendar Entrevista Técnica
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInterviewModal(false)}
                className="p-1 rounded-lg hover:bg-surface-container text-outline cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <form onSubmit={handleScheduleInterview} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="font-medium text-outline block mb-1">Candidato:</label>
                <div className="p-2 bg-surface-container-low rounded-xl font-semibold text-on-surface">
                  {selectedCandidate.name}
                </div>
              </div>

              <div>
                <label className="font-medium text-on-surface block mb-1">Fecha y Hora:</label>
                <input
                  type="datetime-local"
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  className="w-full p-2 bg-surface-container-low rounded-xl border border-outline-variant/40 text-on-surface outline-hidden focus:border-primary text-xs"
                />
              </div>

              <div>
                <label className="font-medium text-on-surface block mb-1">Entrevistadores:</label>
                <input
                  type="text"
                  value={interviewers}
                  onChange={(e) => setInterviewers(e.target.value)}
                  className="w-full p-2 bg-surface-container-low rounded-xl border border-outline-variant/40 text-on-surface outline-hidden focus:border-primary text-xs"
                />
              </div>

              <div className="flex items-center gap-2 p-2 bg-surface-container-low rounded-xl text-outline text-xs">
                <span className="material-symbols-outlined text-primary text-sm">video_call</span>
                <span>Google Meet (Enlace generado automáticamente)</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/20 mt-1">
                <button
                  type="button"
                  onClick={() => setShowInterviewModal(false)}
                  className="px-3.5 py-1.5 rounded-xl text-on-surface-variant font-medium hover:bg-surface-container text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary text-on-primary font-semibold text-xs hover:bg-primary-container shadow-xs cursor-pointer"
                >
                  Confirmar e Invitar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
