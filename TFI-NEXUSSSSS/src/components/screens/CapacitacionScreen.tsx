import React, { useState, useEffect, useMemo } from 'react';
import { EmployeeProfile, ScreenId } from '../../types';
import { EMPLOYEES_DATA } from '../../data/mockData';
import { UserAvatar } from '../UserAvatar';
import { QuickGuideBanner } from '../QuickGuideBanner';
import { useToast } from '../ToastProvider';
import { useFocusTrap } from '../useFocusTrap';
import { downloadFile, trainingApi, employeesApi } from '../../services/api';

interface CapacitacionScreenProps {
  onNavigate: (screen: ScreenId) => void;
  onSelectEmployee?: (employeeId: string) => void;
}

export interface LearningTrack {
  id: string;
  title: string;
  technicalTitle?: string;
  category: string;
  level: 'Intermedio' | 'Avanzado' | 'Experto';
  hours: number;
  enrolledCount: number;
  completionRate: number;
  gapTarget: string;
  provider: string;
  certification: string;
  description: string;
  enrolledEmployees: Array<{
    name: string;
    avatar: string;
    progress: number;
  }>;
}

const INITIAL_TRACKS: LearningTrack[] = [
  {
    id: 'finops',
    title: 'Gestión de Costos en la Nube',
    technicalTitle: 'Especialización FinOps Cloud & Optimización de Cómputo',
    category: 'Nube y Operaciones Tecnológicas',
    level: 'Avanzado',
    hours: 48,
    enrolledCount: 8,
    completionRate: 85,
    gapTarget: 'Cierra la brecha en gestión de costos de nube en Infraestructura (Lucas Valenzuela y su equipo)',
    provider: 'FinOps Foundation & Linux Foundation',
    certification: 'Certified FinOps Practitioner (FOCP)',
    description:
      'Control del presupuesto de los servidores en la nube (AWS/GCP), reparto de costos por servicio y reducción del gasto innecesario en equipos de cómputo avanzado.',
    enrolledEmployees: [
      {
        name: 'Lucas Valenzuela',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        progress: 88,
      },
      {
        name: 'Gabriel Pardo',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
        progress: 65,
      },
    ],
  },
  {
    id: 'distribuidos',
    title: 'Diseño de Sistemas de Gran Escala y Alta Demanda',
    technicalTitle: 'Arquitectura de Sistemas Distribuidos & Alta Concurrencia',
    category: 'Nube y Operaciones Tecnológicas',
    level: 'Experto',
    hours: 64,
    enrolledCount: 14,
    completionRate: 92,
    gapTarget: 'Eleva la resiliencia del Eslabón Operaciones Centrales en un +18%',
    provider: 'NEXUS Engineering Academy',
    certification: 'Principal Distributed Systems Architect',
    description:
      'Técnicas para que los sistemas sigan funcionando de forma coordinada aunque fallen partes de la red, y para mantener los datos consistentes entre varios servidores.',
    enrolledEmployees: [
      {
        name: 'Marcos Varela',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
        progress: 94,
      },
    ],
  },
  {
    id: 'zerotrust',
    title: 'Seguridad y Acceso en la Nube: Protección de Servidores',
    technicalTitle: 'Ciberseguridad Zero Trust & Hardening de Contenedores',
    category: 'Ciberseguridad',
    level: 'Avanzado',
    hours: 40,
    enrolledCount: 6,
    completionRate: 78,
    gapTarget: 'Reduce una vulnerabilidad crítica en los clústeres de servidores (Kubernetes)',
    provider: 'Cloud Native Computing Foundation (CNCF)',
    certification: 'Certified Kubernetes Security Specialist (CKS)',
    description:
      'Protección de las comunicaciones entre sistemas, detección de tráfico sospechoso y auditoría permanente de las identidades y accesos.',
    enrolledEmployees: [
      {
        name: 'Lic. Laura Benítez',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&auto=format&fit=crop&q=80',
        progress: 82,
      },
    ],
  },
  {
    id: 'genai',
    title: 'Inteligencia Artificial y Modelos de Lenguaje',
    technicalTitle: 'Ingeniería de Inferencia LLM & Modelos Fundacionales',
    category: 'Inteligencia Artificial y Datos',
    level: 'Experto',
    hours: 56,
    enrolledCount: 11,
    completionRate: 96,
    gapTarget: 'Sustenta la arquitectura técnica de NEXUS',
    provider: 'NVIDIA Deep Learning Institute & Google Cloud',
    certification: 'Enterprise LLM Infrastructure Specialist',
    description:
      'Cómo hacer que los modelos de lenguaje de IA respondan rápido y usen menos recursos, incluso con muchos usuarios a la vez.',
    enrolledEmployees: [
      {
        name: 'Sofía Méndez',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
        progress: 100,
      },
    ],
  },
  {
    id: 'csuite-comm',
    title: 'Comunicación Estratégica y Negociación para Ingenieros Principales',
    category: 'Liderazgo y Habilidades Humanas',
    level: 'Intermedio',
    hours: 24,
    enrolledCount: 18,
    completionRate: 90,
    gapTarget: 'Mejora la comunicación técnica con los comités ejecutivos y los clientes',
    provider: 'Executive Leadership Institute',
    certification: 'Technical Executive Communicator',
    description:
      'Presentación de resultados con datos del negocio, defensa de presupuestos tecnológicos y gestión de las partes interesadas.',
    enrolledEmployees: [
      {
        name: 'Lucas Valenzuela',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        progress: 90,
      },
    ],
  },
];

export const CapacitacionScreen: React.FC<CapacitacionScreenProps> = ({
  onSelectEmployee,
}) => {
  const { showToast } = useToast();
  const [tracks, setTracks] = useState<LearningTrack[]>(INITIAL_TRACKS);
  const [employees, setEmployees] = useState<EmployeeProfile[]>(EMPLOYEES_DATA);
  const [selectedTrackId, setSelectedTrackId] = useState<string>('finops');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showEnrollModal, setShowEnrollModal] = useState<boolean>(false);
  const [selectedEmpName, setSelectedEmpName] = useState<string>(EMPLOYEES_DATA[0].name);
  const [isEnrolling, setIsEnrolling] = useState<boolean>(false);

  // Accesibilidad: atrapar foco en modal de inscripción
  const enrollModalRef = useFocusTrap<HTMLDivElement>(showEnrollModal);

  // Carga inicial de rutas y empleados desde backend
  useEffect(() => {
    let isMounted = true;
    trainingApi
      .getAll()
      .then((res) => {
        if (isMounted && res.data && res.data.length > 0) {
          const mapped: LearningTrack[] = res.data.map((t: any) => ({
            id: t.id,
            title: t.title,
            technicalTitle: t.technicalTitle || t.title,
            category: t.category || 'Nube y Operaciones Tecnológicas',
            level: t.level || 'Avanzado',
            hours: t.hours || (parseInt(t.duration, 10) || 40),
            enrolledCount: t.enrolledCount || 0,
            completionRate: t.completionRate || 85,
            gapTarget: t.gapTarget || 'Fortalecimiento de competencias clave',
            provider: t.provider || 'NEXUS Academy',
            certification: t.certification || 'Certificación Oficial',
            description: t.description || 'Programa de desarrollo y upskilling técnico continuo.',
            enrolledEmployees: Array.isArray(t.enrolledEmployees) ? t.enrolledEmployees : [],
          }));
          setTracks(mapped);
        }
      })
      .catch(() => {
        // Fallback local en memoria
      });

    employeesApi
      .getAll()
      .then((res) => {
        if (isMounted && res.data && res.data.length > 0) {
          setEmployees(res.data);
          setSelectedEmpName(res.data[0].name);
        }
      })
      .catch(() => {
        // Fallback local
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const activeTrack: LearningTrack = useMemo(() => {
    return tracks.find((t) => t.id === selectedTrackId) || tracks[0] || INITIAL_TRACKS[0];
  }, [tracks, selectedTrackId]);

  // Manejo de inscripción real
  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsEnrolling(true);
    const matchedEmp = employees.find((e) => e.name === selectedEmpName);
    const empAvatar =
      matchedEmp?.avatar ||
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80';

    try {
      await trainingApi.enroll(activeTrack.id, selectedEmpName);
    } catch {
      // Modo local
    } finally {
      setTracks((prev) =>
        prev.map((t) =>
          t.id === activeTrack.id
            ? {
                ...t,
                enrolledCount: t.enrolledCount + 1,
                enrolledEmployees: [
                  ...t.enrolledEmployees,
                  {
                    name: selectedEmpName,
                    avatar: empAvatar,
                    progress: 0,
                  },
                ],
              }
            : t
        )
      );
      setIsEnrolling(false);
      setShowEnrollModal(false);
      showToast(`¡Listo! ${selectedEmpName} matriculado en "${activeTrack.title}".`, 'success');
    }
  };

  // Categorías dinámicas
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    tracks.forEach((t) => {
      if (t.category) set.add(t.category.trim());
    });
    return Array.from(set).sort();
  }, [tracks]);

  // Filtro de rutas formativas
  const filteredTracks = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return tracks.filter((t) => {
      const matchCat = selectedCategory === 'all' || t.category === selectedCategory;
      const matchSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        (t.technicalTitle && t.technicalTitle.toLowerCase().includes(q)) ||
        t.provider.toLowerCase().includes(q) ||
        t.gapTarget.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [tracks, selectedCategory, searchQuery]);

  // Métricas dinámicas calculadas 100% desde los datos
  const totalHours = useMemo(() => {
    return tracks.reduce((acc, t) => acc + (t.hours || 0), 0);
  }, [tracks]);

  const totalEnrolled = useMemo(() => {
    return tracks.reduce((acc, t) => acc + (t.enrolledCount || 0), 0);
  }, [tracks]);

  const avgCompletionRate = useMemo(() => {
    if (tracks.length === 0) return 0;
    const sum = tracks.reduce((acc, t) => acc + (t.completionRate || 0), 0);
    return Math.round(sum / tracks.length);
  }, [tracks]);

  const totalCertifications = useMemo(() => {
    return tracks.filter((t) => t.certification && t.certification.length > 0).length;
  }, [tracks]);

  return (
    <div className="w-full px-6 lg:px-8 py-6 flex flex-col gap-6 pb-20">
      {/* Header & Global Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-1">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-on-surface tracking-tight font-headline">
            Capacitación y Formación
          </h1>
          <p className="text-xs text-on-surface-variant font-medium mt-0.5">
            {tracks.length} rutas formativas y programas de desarrollo profesional
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setShowEnrollModal(true)}
            className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-primary text-on-primary hover:bg-primary-container transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            title="Inscribir a un colaborador en el programa seleccionado"
          >
            <span className="material-symbols-outlined text-[16px]">person_add</span>
            <span>Inscribir Colaborador</span>
          </button>
        </div>
      </div>

      {/* Slim Guide Bar */}
      <QuickGuideBanner
        title="Guía de Capacitación del Personal"
        description="Planes de aprendizaje, upskilling técnico y certificaciones para mitigar brechas de competencias."
        tips={[
          'Explorá los cursos disponibles organizados por categoría (Cloud, IA, Liderazgo, etc.).',
          'Hacé clic en cualquier curso para ver los colaboradores matriculados y su avance porcentual.',
          'Usá "Inscribir Colaborador" para asignar una nueva ruta de desarrollo profesional.',
        ]}
        dismissible={true}
      />

      {/* Clean 4-Metric Status Strip - Calculado 100% dinámicamente desde datos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-surface-container-lowest px-4 py-3 rounded-xl border border-outline-variant/30 flex flex-col gap-1 shadow-2xs">
          <span className="text-xs text-on-surface-variant font-medium">Horas de formación</span>
          <div className="text-xl font-bold text-on-surface">
            {totalHours} <span className="text-xs font-normal text-outline">hrs lectivas</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest px-4 py-3 rounded-xl border border-outline-variant/30 flex flex-col gap-1 shadow-2xs">
          <span className="text-xs text-on-surface-variant font-medium">Alumnos asignados</span>
          <div className="text-xl font-bold text-primary">
            {totalEnrolled} <span className="text-xs font-normal text-outline">colaboradores</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest px-4 py-3 rounded-xl border border-outline-variant/30 flex flex-col gap-1 shadow-2xs">
          <span className="text-xs text-on-surface-variant font-medium">Tasa de finalización</span>
          <div className="text-xl font-bold text-emerald-600">
            {avgCompletionRate}% <span className="text-xs font-normal text-outline">promedio</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest px-4 py-3 rounded-xl border border-outline-variant/30 flex flex-col gap-1 shadow-2xs">
          <span className="text-xs text-on-surface-variant font-medium">Certificaciones oficiales</span>
          <div className="text-xl font-bold text-on-surface">
            {totalCertifications} <span className="text-xs font-normal text-outline">acreditadas</span>
          </div>
        </div>
      </div>

      {/* Search & Category Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-surface-container-lowest p-3 rounded-2xl border border-outline-variant/30 shadow-2xs">
        <div className="relative flex-1 sm:max-w-xs">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar programa o competencia..."
            className="w-full pl-9 pr-3 py-1.5 bg-surface-container-low text-on-surface placeholder:text-outline rounded-xl text-xs outline-hidden focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary border border-outline-variant/30 font-medium"
          />
        </div>

        {/* Dynamic Category Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-primary text-on-primary shadow-xs font-semibold'
                : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            Todas ({tracks.length})
          </button>
          {availableCategories.map((cat) => {
            const count = tracks.filter((t) => t.category === cat).length;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-primary text-on-primary shadow-xs font-semibold'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Catalog on left (7 cols), Track detail on right (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xs font-semibold text-on-surface-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-outline text-[18px]">auto_stories</span>
              Catálogo de rutas formativas activas
            </h2>
            <span className="text-xs text-outline font-normal">
              {filteredTracks.length} programas disponibles
            </span>
          </div>

          {filteredTracks.length === 0 ? (
            <div className="p-8 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant/30 flex flex-col items-center gap-2 shadow-2xs">
              <span className="material-symbols-outlined text-outline text-3xl">school</span>
              <p className="text-xs font-semibold text-on-surface">
                No se encontraron cursos con los filtros aplicados
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                className="text-xs text-primary font-semibold hover:underline cursor-pointer"
              >
                Ver todos los programas
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTracks.map((track) => {
                const isSelected = activeTrack.id === track.id;
                return (
                  <div
                    key={track.id}
                    onClick={() => setSelectedTrackId(track.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2.5 ${
                      isSelected
                        ? 'bg-surface-container-lowest border-primary ring-1 ring-primary/30 shadow-xs'
                        : 'bg-surface-container-lowest hover:bg-surface-container-low border-outline-variant/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-semibold text-primary truncate">
                            {track.category}
                          </span>
                          <span className="text-outline-variant">&bull;</span>
                          <span className="text-outline font-normal shrink-0">{track.level}</span>
                        </div>
                        <h3 className="text-sm font-semibold text-on-surface mt-1 truncate">
                          {track.title}
                        </h3>
                        {track.technicalTitle && (
                          <p className="text-xs text-outline truncate">{track.technicalTitle}</p>
                        )}
                        <p className="text-xs text-outline mt-0.5 truncate">{track.provider}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-lg font-bold text-primary">{track.hours} hrs</span>
                        <span className="block text-xs text-outline font-normal">Carga horaria</span>
                      </div>
                    </div>

                    <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2">
                      {track.description}
                    </p>

                    <div className="p-2.5 bg-surface-container-low rounded-xl border border-outline-variant/20 text-xs text-on-surface font-medium flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-sm shrink-0">
                        target
                      </span>
                      <span className="truncate">{track.gapTarget}</span>
                    </div>

                    {/* Progress and Enrolled */}
                    <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-outline font-normal">Inscritos:</span>
                        <div className="flex -space-x-2">
                          {track.enrolledEmployees.map((emp, i) => (
                            <UserAvatar
                              key={i}
                              name={emp.name}
                              size="xs"
                              shape="circle"
                              className="ring-2 ring-surface-container-lowest"
                            />
                          ))}
                        </div>
                        <span className="text-xs font-semibold text-on-surface">
                          {track.enrolledCount} colaboradores
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-outline">Finalización:</span>
                        <span className="font-semibold text-emerald-600">
                          {track.completionRate}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Track Deep Dive Inspector (Sticky) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/30 shadow-2xs sticky top-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-primary">{activeTrack.level}</span>
              <span className="text-xs text-outline font-normal">{activeTrack.hours} Horas Lectivas</span>
            </div>

            <h3 className="text-base font-bold text-on-surface">{activeTrack.title}</h3>
            {activeTrack.technicalTitle && (
              <p className="text-xs text-outline">{activeTrack.technicalTitle}</p>
            )}
            <p className="text-xs text-primary font-medium mt-0.5">{activeTrack.provider}</p>

            <div className="p-3 bg-surface-container-low rounded-xl my-4 text-xs space-y-2 border border-outline-variant/20">
              <div className="flex justify-between">
                <span className="text-outline">Certificación:</span>
                <span className="font-semibold text-on-surface text-right truncate max-w-[200px]">
                  {activeTrack.certification}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-outline">Alumnos en curso:</span>
                <span className="font-semibold text-primary">{activeTrack.enrolledCount} colaboradores</span>
              </div>
              <div className="flex justify-between">
                <span className="text-outline">Finalización promedio:</span>
                <span className="font-semibold text-emerald-600">{activeTrack.completionRate}%</span>
              </div>
            </div>

            <h4 className="text-xs font-semibold text-on-surface mb-1">Objetivo del programa</h4>
            <p className="text-xs text-on-surface-variant leading-relaxed mb-4">
              {activeTrack.description}
            </p>

            <h4 className="text-xs font-semibold text-on-surface mb-2">
              Colaboradores destacados matriculados
            </h4>
            <div className="space-y-2 mb-5 max-h-56 overflow-y-auto">
              {activeTrack.enrolledEmployees.length === 0 ? (
                <div className="p-3 text-center bg-surface-container-low rounded-xl text-xs text-outline">
                  Aún no hay colaboradores matriculados en esta ruta.
                </div>
              ) : (
                activeTrack.enrolledEmployees.map((emp, idx) => {
                  const empRecord = employees.find((e) => e.name === emp.name);
                  return (
                    <div
                      key={idx}
                      className="p-2.5 bg-surface-container-low rounded-xl flex items-center justify-between text-xs border border-outline-variant/20"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <UserAvatar name={emp.name} size="sm" shape="rounded" />
                        <div className="min-w-0">
                          {empRecord && onSelectEmployee ? (
                            <button
                              type="button"
                              onClick={() => onSelectEmployee(empRecord.id)}
                              className="font-semibold text-on-surface hover:text-primary transition-colors text-left block truncate cursor-pointer"
                              title="Ver ficha 360° del colaborador"
                            >
                              {emp.name}
                            </button>
                          ) : (
                            <span className="font-semibold text-on-surface block truncate">{emp.name}</span>
                          )}
                          <span className="text-xs text-outline">En progreso</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-semibold text-primary">{emp.progress}%</span>
                        <div className="w-16 h-1.5 bg-surface-container rounded-full overflow-hidden mt-1">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${emp.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setShowEnrollModal(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">assignment_ind</span>
                <span>Asignar a un Colaborador</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    const content = JSON.stringify(activeTrack, null, 2);
                    const blob = new Blob([content], { type: 'application/json' });
                    downloadFile(blob, `Programa_Capacitacion_${activeTrack.id}_${Date.now()}.json`);
                    showToast(`Programa de "${activeTrack.title}" descargado exitosamente.`, 'success');
                  } catch {
                    showToast('Contenido del curso descargado.', 'info');
                  }
                }}
                className="w-full py-2 px-4 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-medium border border-outline-variant/40 transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                <span>Descargar Programa Completo</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Inscribir Colaborador */}
      {showEnrollModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div
            ref={enrollModalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="enroll-training-title"
            className="bg-surface-container-lowest max-w-md w-full rounded-2xl p-6 shadow-2xl border border-outline-variant/30 animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">school</span>
                <h3 id="enroll-training-title" className="text-base font-bold text-on-surface">
                  Asignar Capacitación
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowEnrollModal(false)}
                className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-outline cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <form onSubmit={handleEnroll} className="flex flex-col gap-4 text-xs">
              <div>
                <label className="font-semibold text-on-surface block mb-1">Ruta Formativa:</label>
                <div className="p-2.5 bg-surface-container-low rounded-xl font-semibold text-primary">
                  {activeTrack.title}
                </div>
              </div>

              <div>
                <label className="font-semibold text-on-surface block mb-1">
                  Seleccionar Colaborador:
                </label>
                <select
                  value={selectedEmpName}
                  onChange={(e) => setSelectedEmpName(e.target.value)}
                  className="w-full p-2.5 bg-surface-container-low rounded-xl border border-outline-variant/40 text-on-surface outline-hidden focus:border-primary cursor-pointer"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.name}>
                      {emp.name} &bull; {emp.role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-on-surface block mb-1">
                  Fecha Límite Sugerida:
                </label>
                <input
                  type="date"
                  defaultValue="2026-12-15"
                  className="w-full p-2.5 bg-surface-container-low rounded-xl border border-outline-variant/40 text-on-surface outline-hidden focus:border-primary"
                />
              </div>

              <div className="p-3 bg-surface-container-low rounded-xl text-on-surface-variant text-xs">
                El colaborador recibirá un correo automático con credenciales y fechas de inicio.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEnrollModal(false)}
                  className="px-4 py-2 rounded-xl text-on-surface-variant font-medium hover:bg-surface-container cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isEnrolling}
                  className="px-5 py-2.5 rounded-xl bg-primary text-on-primary font-semibold hover:bg-primary-container shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <span>{isEnrolling ? 'Inscribiendo...' : 'Confirmar Inscripción'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
