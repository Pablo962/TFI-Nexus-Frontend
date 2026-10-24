import React from 'react';

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

/** Bloque de carga animado con soporte para diseño Tailwind */
export const Skeleton: React.FC<SkeletonProps> = ({ className = '', style }) => (
  <div className={`animate-pulse bg-surface-container-high/70 rounded-lg ${className}`} style={style} />
);

/** Skeleton para tarjeta de KPI */
export const SkeletonKpiCard: React.FC = () => (
  <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/50 flex flex-col justify-between">
    <div className="flex items-center justify-between">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-4 w-4 rounded-md" />
    </div>
    <Skeleton className="h-7 w-28 mt-2" />
    <Skeleton className="h-3 w-32 mt-1" />
  </div>
);

/** Skeleton para tarjeta de empleado/candidato */
export const SkeletonEmployeeCard: React.FC = () => (
  <div className="p-2.5 rounded-lg border border-outline-variant/40 bg-surface-container-lowest flex items-center gap-2.5">
    <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
    <div className="flex flex-col gap-1.5 flex-1 min-w-0">
      <Skeleton className="h-3 w-3/4" />
      <Skeleton className="h-2.5 w-1/2" />
      <Skeleton className="h-2 w-2/3" />
    </div>
  </div>
);

/** Skeleton para una fila de tabla */
export const SkeletonTableRow: React.FC<{ columns?: number }> = ({ columns = 5 }) => (
  <tr>
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="px-4 py-3 border-b border-outline-variant/20">
        <Skeleton className="h-3" style={{ width: i % 2 === 0 ? '60%' : '85%' }} />
      </td>
    ))}
  </tr>
);

/** Skeleton para lista de puestos (panel izquierdo) */
export const SkeletonJobCard: React.FC = () => (
  <div className="p-3 rounded-lg border border-outline-variant/40 bg-surface-container-lowest">
    <div className="flex items-start justify-between gap-2">
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
        <div className="flex flex-col gap-1 flex-1">
          <Skeleton className="h-2.5 w-16" />
          <Skeleton className="h-3 w-full" />
        </div>
      </div>
      <Skeleton className="h-3.5 w-10 rounded-full shrink-0" />
    </div>
    <div className="mt-2 flex items-center justify-between">
      <Skeleton className="h-2 w-20" />
      <Skeleton className="h-2 w-14" />
    </div>
  </div>
);

/** Loader de pantalla completa para Suspense con diseño adaptado a NEXUS */
export const PageLoader: React.FC = () => (
  <div className="w-full px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-5 max-w-7xl mx-auto animate-in fade-in duration-100">
    {/* Header skeleton */}
    <div className="flex flex-col gap-2 pb-3 border-b border-outline-variant/30">
      <Skeleton className="h-3 w-32" />
      <Skeleton className="h-7 w-64 sm:w-80" />
      <Skeleton className="h-3 w-full max-w-md" />
    </div>
    {/* KPI strip skeleton */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      {[1, 2, 3, 4].map((i) => (
        <SkeletonKpiCard key={i} />
      ))}
    </div>
    {/* Content skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <div className="lg:col-span-8 flex flex-col gap-3">
        <Skeleton className="h-56 w-full rounded-xl" />
        <Skeleton className="h-44 w-full rounded-xl" />
      </div>
      <div className="lg:col-span-4 flex flex-col gap-3">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-52 w-full rounded-xl" />
      </div>
    </div>
  </div>
);
