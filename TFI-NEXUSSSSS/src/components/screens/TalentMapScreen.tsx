import React, { useState, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  Panel,
  Handle,
  Position,
  MarkerType,
  Node,
  Edge,
  NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { ScreenId, TalentPerson } from '../../types';
import { TALENT_PERSONS } from '../../data/mockData';
import { UserAvatar } from '../UserAvatar';
import { QuickGuideBanner } from '../QuickGuideBanner';
import { useToast } from '../ToastProvider';
import { employeesApi } from '../../services/api';

interface TalentMapScreenProps {
  onNavigate: (screen: ScreenId) => void;
  onSelectEmployee?: (employeeId: string) => void;
}

// ============================================================================
// COMPONENTES DE NODOS PERSONALIZADOS PARA REACT FLOW
// Con Handles invisibles para que las puntas de flecha conecten limpiamente al borde
// ============================================================================

interface PersonNodeData extends Record<string, unknown> {
  id: string;
  name: string;
  role: string;
  squad: string;
  isSpof: boolean;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const PersonNodeComponent: React.FC<NodeProps<Node<PersonNodeData>>> = ({ data }) => {
  return (
    <div
      onClick={() => data.onSelect(data.id)}
      className={`relative w-64 p-3 rounded-2xl bg-surface-container-lowest transition-all cursor-pointer shadow-xs border text-left ${
        data.isSelected
          ? data.isSpof
            ? 'ring-2 ring-amber-500 border-amber-500 bg-amber-50/50 shadow-md scale-102'
            : 'ring-2 ring-primary border-primary bg-primary/5 shadow-md scale-102'
          : 'border-outline-variant/30 hover:border-outline-variant/60 hover:shadow-sm'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <UserAvatar
          name={data.name}
          size="md"
          shape="circle"
          showStatus={true}
          statusColor={data.isSpof ? 'amber' : 'emerald'}
        />
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs font-bold text-on-surface leading-tight">
              {data.name}
            </span>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm shrink-0 ${
                data.isSpof ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {data.isSpof ? 'SPOF' : 'Óptimo'}
            </span>
          </div>
          <span className="text-[11px] text-primary font-medium leading-tight mt-0.5">
            {data.role}
          </span>
          <span className="text-[10px] text-outline mt-0.5 truncate">
            {data.squad}
          </span>
        </div>
      </div>
      {/* Handle invisible en el borde derecho para atraque limpio de la flecha */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-1 !h-1 !opacity-0 !border-0 !right-0"
      />
    </div>
  );
};

interface SkillNodeData extends Record<string, unknown> {
  id: string;
  title: string;
  level: string;
  tags: string;
  isActive: boolean;
  isSpof: boolean;
}

const SkillNodeComponent: React.FC<NodeProps<Node<SkillNodeData>>> = ({ data }) => {
  return (
    <div
      className={`relative w-60 p-3 rounded-xl bg-surface-container-lowest transition-all shadow-xs border flex flex-col gap-1.5 text-left ${
        data.isActive
          ? data.isSpof
            ? 'border-amber-500 ring-2 ring-amber-500/40 bg-amber-50/40 shadow-md scale-102'
            : 'border-primary ring-2 ring-primary/40 bg-primary/5 shadow-md scale-102'
          : 'border-outline-variant/30 opacity-70'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-1 !h-1 !opacity-0 !border-0 !left-0"
      />
      <div className="flex items-center justify-between gap-1">
        <span className="text-xs font-bold text-on-surface leading-tight">
          {data.title}
        </span>
        <span
          className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
            data.isActive
              ? data.isSpof
                ? 'bg-amber-500 text-white'
                : 'bg-primary text-on-primary'
              : 'bg-primary-container text-on-primary'
          }`}
        >
          {data.level}
        </span>
      </div>
      <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
        <div
          className={`h-full w-[90%] rounded-full ${
            data.isActive
              ? data.isSpof
                ? 'bg-amber-500'
                : 'bg-primary'
              : 'bg-primary/50'
          }`}
        />
      </div>
      <span className="text-[10px] text-outline font-mono truncate">{data.tags}</span>
      <Handle
        type="source"
        position={Position.Right}
        className="!w-1 !h-1 !opacity-0 !border-0 !right-0"
      />
    </div>
  );
};

interface SquadNodeData extends Record<string, unknown> {
  id: string;
  name: string;
  desc: string;
  members: string;
  metric: string;
  isActive: boolean;
  isSpof: boolean;
}

const SquadNodeComponent: React.FC<NodeProps<Node<SquadNodeData>>> = ({ data }) => {
  return (
    <div
      className={`relative w-64 p-3.5 rounded-2xl bg-surface-container-lowest transition-all shadow-xs border flex flex-col gap-1 text-left ${
        data.isActive
          ? data.isSpof
            ? 'border-amber-500 ring-2 ring-amber-500/40 bg-amber-50/40 shadow-md scale-102'
            : 'border-primary ring-2 ring-primary/40 bg-primary/5 shadow-md scale-102'
          : 'border-outline-variant/30 opacity-70'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-1 !h-1 !opacity-0 !border-0 !left-0"
      />
      <div className="flex items-center gap-1.5">
        <span
          className={`material-symbols-outlined text-[18px] ${
            data.isActive && data.isSpof ? 'text-amber-600' : 'text-primary'
          }`}
        >
          groups
        </span>
        <span className="text-xs font-bold text-on-surface">{data.name}</span>
      </div>
      <span className="text-[11px] text-on-surface-variant leading-tight">
        {data.desc}
      </span>
      <div className="flex items-center justify-between text-outline text-[10px] pt-1.5 border-t border-outline-variant/20 mt-1">
        <span>{data.members}</span>
        <span
          className={`font-bold ${
            data.isActive && data.isSpof ? 'text-amber-700' : 'text-secondary'
          }`}
        >
          {data.metric}
        </span>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!w-1 !h-1 !opacity-0 !border-0 !right-0"
      />
    </div>
  );
};

interface ActivityNodeData extends Record<string, unknown> {
  id: string;
  type: string;
  title: string;
  desc: string;
  isActive: boolean;
  isSpof: boolean;
}

const ActivityNodeComponent: React.FC<NodeProps<Node<ActivityNodeData>>> = ({ data }) => {
  return (
    <div
      className={`relative w-64 p-3.5 rounded-2xl bg-surface-container-lowest transition-all shadow-xs border flex flex-col gap-1 text-left ${
        data.isActive
          ? data.isSpof
            ? 'border-amber-500 ring-2 ring-amber-500/40 bg-amber-50/40 shadow-md scale-102'
            : 'border-primary ring-2 ring-primary/40 bg-primary/5 shadow-md scale-102'
          : 'border-outline-variant/30 opacity-70'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-1 !h-1 !opacity-0 !border-0 !left-0"
      />
      <span
        className={`px-2 py-0.5 rounded-full text-[10px] font-bold w-max ${
          data.isActive && data.isSpof
            ? 'bg-amber-100 text-amber-800'
            : 'bg-primary/10 text-primary'
        }`}
      >
        {data.type}
      </span>
      <span className="text-xs font-bold text-on-surface leading-tight">
        {data.title}
      </span>
      <span className="text-[11px] text-on-surface-variant leading-tight">
        {data.desc}
      </span>
      <Handle
        type="source"
        position={Position.Right}
        className="!w-1 !h-1 !opacity-0 !border-0 !right-0"
      />
    </div>
  );
};

interface ImpactNodeData extends Record<string, unknown> {
  id: string;
  label: string;
  value: string;
  desc: string;
  icon: string;
  isActive: boolean;
}

const ImpactNodeComponent: React.FC<NodeProps<Node<ImpactNodeData>>> = ({ data }) => {
  return (
    <div
      className={`relative w-56 p-3.5 rounded-2xl bg-surface-container-lowest transition-all shadow-xs border flex flex-col gap-1 text-left ${
        data.isActive
          ? 'border-secondary ring-2 ring-secondary/50 shadow-md bg-secondary/5 scale-102'
          : 'border-outline-variant/30 opacity-70'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-1 !h-1 !opacity-0 !border-0 !left-0"
      />
      <div className="flex items-center gap-1.5 text-secondary">
        <span className="material-symbols-outlined text-[18px]">{data.icon}</span>
        <span className="text-[10px] font-bold uppercase">{data.label}</span>
      </div>
      <span className="text-2xl font-black text-on-surface leading-none">
        {data.value}
      </span>
      <span className="text-[11px] text-on-surface-variant leading-tight">
        {data.desc}
      </span>
    </div>
  );
};

const nodeTypes = {
  person: PersonNodeComponent,
  skill: SkillNodeComponent,
  squad: SquadNodeComponent,
  activity: ActivityNodeComponent,
  impact: ImpactNodeComponent,
};

// ============================================================================
// DATOS MAESTROS Y CADENAS DE VALOR COMPLETAS (Sin saltos ni desconexiones)
// ============================================================================

const MASTER_PEOPLE = [
  { id: 'sofia', name: 'Sofía Méndez', role: 'Líder en Inteligencia Artificial', squad: 'Nexus Core', isSpof: false },
  { id: 'carlos', name: 'Carlos Ruiz', role: 'Arquitecto Principal de Software', squad: 'Platform Resilience', isSpof: true },
  { id: 'lucas', name: 'Ing. Lucas Valenzuela', role: 'Arquitecto Principal Cloud & IA', squad: 'Infraestructura y Plataforma', isSpof: false },
  { id: 'valeria', name: 'Valeria Gómez', role: 'Líder de Estrategia de Producto', squad: 'Growth Engine', isSpof: false },
  { id: 'laura', name: 'Lic. Laura Benítez', role: 'Arquitecto de Seguridad y Accesos', squad: 'Seguridad y Cumplimiento', isSpof: false },
];

const MASTER_SKILLS = [
  { id: 'ai', title: 'Inteligencia Artificial', level: 'Nv. 5', tags: 'PyTorch, NLP, RL' },
  { id: 'systems', title: 'Diseño de Sistemas', level: 'Nv. 5', tags: 'Microservices, Kafka' },
  { id: 'cloud', title: 'Gestión Cloud & Clústeres', level: 'Nv. 5', tags: 'K8s, Docker, Terraform' },
  { id: 'product', title: 'Estrategia de Producto', level: 'Nv. 5', tags: 'Dual-Track Agile, OKRs' },
  { id: 'security', title: 'Seguridad en la Nube', level: 'Nv. 4', tags: 'Zero Trust, IAM, mTLS' },
];

const MASTER_SQUADS = [
  { id: 'nexus-core', name: 'Nexus Core', desc: 'Equipo de algoritmos e IA', members: '9 Miembros', metric: '100% Sinergia' },
  { id: 'platform', name: 'Plataforma & Cloud', desc: 'Infraestructura crítica resiliente', members: '14 Miembros', metric: '96% Cobertura' },
  { id: 'growth', name: 'Motor de Crecimiento', desc: 'Expansión estratégica y B2B', members: '11 Miembros', metric: '92% Sinergia' },
];

const MASTER_ACTIVITIES = [
  { id: 'algo-opt', type: 'Primaria', title: 'Optimización Algorítmica', desc: 'Ahorro de €2.4M en rutas de despacho' },
  { id: 'cloud-auto', type: 'Soporte', title: 'Automatización Multi-Cloud', desc: 'Disponibilidad 99.999% ante fallas' },
  { id: 'b2b-growth', type: 'Estratégica', title: 'Expansión B2B Enterprise', desc: 'Cuentas clave de primer nivel y valor' },
];

const MASTER_IMPACTS = [
  { id: 'profit', label: 'Rentabilidad', value: '+18.4%', desc: 'Margen Operativo Neto sostenido', icon: 'trending_up' },
  { id: 'speed', label: 'Velocidad', value: '-40%', desc: 'Tiempo de ciclo al mercado', icon: 'speed' },
  { id: 'retention', label: 'Retención', value: '98.4%', desc: 'Cuentas corporativas clave', icon: 'loyalty' },
];

// Mapa unificado de cadenas de valor completas (garantiza continuidad de extremo a extremo)
const CHAINS_BY_PERSON: Record<
  string,
  {
    skills: string[];
    squads: string[];
    activities: string[];
    impacts: string[];
    isSpof: boolean;
    activeEdges: string[];
  }
> = {
  sofia: {
    skills: ['ai', 'systems'],
    squads: ['nexus-core'],
    activities: ['algo-opt'],
    impacts: ['profit', 'speed'],
    isSpof: false,
    activeEdges: [
      'e-sofia-ai',
      'e-sofia-sys',
      'e-ai-nexus',
      'e-sys-nexus',
      'e-nexus-algo',
      'e-algo-profit',
      'e-algo-speed',
    ],
  },
  carlos: {
    skills: ['systems', 'cloud'],
    squads: ['platform'],
    activities: ['cloud-auto'],
    impacts: ['speed'],
    isSpof: true,
    activeEdges: [
      'e-carlos-sys',
      'e-carlos-cloud',
      'e-sys-platform',
      'e-cloud-platform',
      'e-plat-cloudauto',
      'e-cloudauto-speed',
    ],
  },
  lucas: {
    skills: ['cloud', 'security'],
    squads: ['platform'],
    activities: ['cloud-auto'],
    impacts: ['speed', 'profit'],
    isSpof: false,
    activeEdges: [
      'e-lucas-cloud',
      'e-lucas-sec',
      'e-cloud-platform',
      'e-sec-platform',
      'e-plat-cloudauto',
      'e-cloudauto-speed',
      'e-cloudauto-profit',
    ],
  },
  valeria: {
    skills: ['product', 'ai'],
    squads: ['growth'],
    activities: ['b2b-growth'],
    impacts: ['retention', 'profit'],
    isSpof: false,
    activeEdges: [
      'e-valeria-prod',
      'e-valeria-ai',
      'e-prod-growth',
      'e-ai-growth',
      'e-growth-b2b',
      'e-b2b-retention',
      'e-b2b-profit',
    ],
  },
  laura: {
    skills: ['security', 'cloud'],
    squads: ['platform'],
    activities: ['cloud-auto'],
    impacts: ['speed'],
    isSpof: false,
    activeEdges: [
      'e-laura-sec',
      'e-laura-cloud',
      'e-sec-platform',
      'e-cloud-platform',
      'e-plat-cloudauto',
      'e-cloudauto-speed',
    ],
  },
};

export const TalentMapScreen: React.FC<TalentMapScreenProps> = ({
  onNavigate,
  onSelectEmployee,
}) => {
  const { showToast } = useToast();
  const [talentList, setTalentList] = useState<TalentPerson[]>(TALENT_PERSONS);
  const [selectedDomain, setSelectedDomain] = useState('Todos');
  const [activePersonId, setActivePersonId] = useState<string>('laura');
  const [searchFilter, setSearchFilter] = useState('');
  const [onlySpof, setOnlySpof] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'actions' | 'skills' | 'spof'>('actions');
  const [isSynapticModalOpen, setIsSynapticModalOpen] = useState<boolean>(false);

  // Conexión dinámica con API
  useEffect(() => {
    let isMounted = true;
    employeesApi
      .getTalentPersons({
        domain: selectedDomain === 'Todos' ? undefined : selectedDomain,
        search: searchFilter || undefined,
        risk: onlySpof ? 'spof' : undefined,
      })
      .then((res) => {
        if (isMounted && res && Array.isArray(res.data) && res.data.length > 0) {
          setTalentList(res.data);
        }
      })
      .catch(() => {
        // Fallback nominal
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDomain, searchFilter, onlySpof]);

  // Listener para cerrar modal con Escape
  useEffect(() => {
    if (!isSynapticModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsSynapticModalOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isSynapticModalOpen]);

  // Filtrado de colaboradores
  const filteredPersons = useMemo(() => {
    return talentList.filter((person) => {
      if (onlySpof && person.riskStatus !== 'spof') return false;
      if (searchFilter) {
        const q = searchFilter.toLowerCase();
        const matches =
          person.name.toLowerCase().includes(q) ||
          person.role.toLowerCase().includes(q) ||
          person.squad.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [talentList, onlySpof, searchFilter]);

  // Persona activa seleccionada
  const activePerson: TalentPerson = useMemo(() => {
    return (
      filteredPersons.find((p) => p.id === activePersonId) ||
      filteredPersons[0] ||
      talentList[0] ||
      TALENT_PERSONS[0]
    );
  }, [filteredPersons, activePersonId, talentList]);

  // Métricas analíticas superiores
  const metrics = useMemo(() => {
    const total = talentList.length;
    const spofCount = talentList.filter((p) => p.riskStatus === 'spof').length;
    const avgCrit =
      total > 0
        ? (talentList.reduce((acc, p) => acc + (p.criticality || 8.5), 0) / total).toFixed(1)
        : '9.2';
    const distinctSquads = new Set(talentList.map((p) => p.squad)).size;
    return { total, spofCount, avgCrit, distinctSquads };
  }, [talentList]);

  const handleGoToEmployee = () => {
    if (onSelectEmployee) {
      onSelectEmployee(activePerson.id);
      return;
    }
    onNavigate('empleados');
  };

  // Cadena activa actual
  const currentChain = useMemo(() => {
    return CHAINS_BY_PERSON[activePersonId] || CHAINS_BY_PERSON.carlos;
  }, [activePersonId]);

  // NODOS CON ALINEACIÓN DIRECTA HORIZONTAL
  const flowNodes: Node[] = useMemo(() => {
    const nodes: Node[] = [];

    // Columna 1: Personas (x: 20, paso vertical: 110px)
    MASTER_PEOPLE.forEach((p, i) => {
      nodes.push({
        id: `person-${p.id}`,
        type: 'person',
        position: { x: 20, y: i * 110 },
        data: {
          id: p.id,
          name: p.name,
          role: p.role,
          squad: p.squad,
          isSpof: p.isSpof,
          isSelected: activePersonId === p.id,
          onSelect: (id: string) => setActivePersonId(id),
        },
      });
    });

    // Columna 2: Habilidades DNA (x: 340, alineadas exactamente frente a cada persona)
    MASTER_SKILLS.forEach((s, i) => {
      nodes.push({
        id: `skill-${s.id}`,
        type: 'skill',
        position: { x: 340, y: i * 110 },
        data: {
          id: s.id,
          title: s.title,
          level: s.level,
          tags: s.tags,
          isActive: currentChain.skills.includes(s.id),
          isSpof: currentChain.isSpof,
        },
      });
    });

    // Columna 3: Squads (x: 650, alineados con Fila 0, Fila 2, Fila 4)
    const squadY = [35, 200, 365];
    MASTER_SQUADS.forEach((sq, i) => {
      nodes.push({
        id: `squad-${sq.id}`,
        type: 'squad',
        position: { x: 650, y: squadY[i] },
        data: {
          id: sq.id,
          name: sq.name,
          desc: sq.desc,
          members: sq.members,
          metric: sq.metric,
          isActive: currentChain.squads.includes(sq.id),
          isSpof: currentChain.isSpof,
        },
      });
    });

    // Columna 4: Actividades (x: 970, alineadas perfectamente con Squads)
    MASTER_ACTIVITIES.forEach((act, i) => {
      nodes.push({
        id: `activity-${act.id}`,
        type: 'activity',
        position: { x: 970, y: squadY[i] },
        data: {
          id: act.id,
          type: act.type,
          title: act.title,
          desc: act.desc,
          isActive: currentChain.activities.includes(act.id),
          isSpof: currentChain.isSpof,
        },
      });
    });

    // Columna 5: Impacto (x: 1290, alineadas perfectamente con Actividades)
    MASTER_IMPACTS.forEach((imp, i) => {
      nodes.push({
        id: `impact-${imp.id}`,
        type: 'impact',
        position: { x: 1290, y: squadY[i] },
        data: {
          id: imp.id,
          label: imp.label,
          value: imp.value,
          desc: imp.desc,
          icon: imp.icon,
          isActive: currentChain.impacts.includes(imp.id),
        },
      });
    });

    return nodes;
  }, [activePersonId, currentChain]);

  // ARISTAS (EDGES) CON PUNTA DE FLECHA PRECISA Y FLUJO COMPLETO GARANTIZADO
  const flowEdges: Edge[] = useMemo(() => {
    const rawEdges: Array<{
      id: string;
      source: string;
      target: string;
    }> = [
      // 1. Personas -> Habilidades
      { id: 'e-sofia-ai', source: 'person-sofia', target: 'skill-ai' },
      { id: 'e-sofia-sys', source: 'person-sofia', target: 'skill-systems' },
      { id: 'e-carlos-sys', source: 'person-carlos', target: 'skill-systems' },
      { id: 'e-carlos-cloud', source: 'person-carlos', target: 'skill-cloud' },
      { id: 'e-lucas-cloud', source: 'person-lucas', target: 'skill-cloud' },
      { id: 'e-lucas-sec', source: 'person-lucas', target: 'skill-security' },
      { id: 'e-valeria-prod', source: 'person-valeria', target: 'skill-product' },
      { id: 'e-valeria-ai', source: 'person-valeria', target: 'skill-ai' },
      { id: 'e-laura-sec', source: 'person-laura', target: 'skill-security' },
      { id: 'e-laura-cloud', source: 'person-laura', target: 'skill-cloud' },

      // 2. Habilidades -> Squads
      { id: 'e-ai-nexus', source: 'skill-ai', target: 'squad-nexus-core' },
      { id: 'e-sys-nexus', source: 'skill-systems', target: 'squad-nexus-core' },
      { id: 'e-sys-platform', source: 'skill-systems', target: 'squad-platform' },
      { id: 'e-cloud-platform', source: 'skill-cloud', target: 'squad-platform' },
      { id: 'e-prod-growth', source: 'skill-product', target: 'squad-growth' },
      { id: 'e-ai-growth', source: 'skill-ai', target: 'squad-growth' },
      { id: 'e-sec-platform', source: 'skill-security', target: 'squad-platform' },

      // 3. Squads -> Actividades
      { id: 'e-nexus-algo', source: 'squad-nexus-core', target: 'activity-algo-opt' },
      { id: 'e-plat-cloudauto', source: 'squad-platform', target: 'activity-cloud-auto' },
      { id: 'e-growth-b2b', source: 'squad-growth', target: 'activity-b2b-growth' },

      // 4. Actividades -> Impacto
      { id: 'e-algo-profit', source: 'activity-algo-opt', target: 'impact-profit' },
      { id: 'e-algo-speed', source: 'activity-algo-opt', target: 'impact-speed' },
      { id: 'e-cloudauto-speed', source: 'activity-cloud-auto', target: 'impact-speed' },
      { id: 'e-cloudauto-profit', source: 'activity-cloud-auto', target: 'impact-profit' },
      { id: 'e-b2b-retention', source: 'activity-b2b-growth', target: 'impact-retention' },
      { id: 'e-b2b-profit', source: 'activity-b2b-growth', target: 'impact-profit' },
    ];

    const activeColor = currentChain.isSpof ? '#D97706' : '#7C3AED';

    return rawEdges.map((e) => {
      const isActive = currentChain.activeEdges.includes(e.id);

      return {
        id: e.id,
        source: e.source,
        target: e.target,
        type: 'bezier',
        animated: false,
        style: {
          stroke: isActive ? activeColor : '#E2E8F0',
          strokeWidth: isActive ? 2.5 : 1.2,
          opacity: isActive ? 1 : 0.35,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isActive ? activeColor : '#CBD5E1',
          width: isActive ? 18 : 10,
          height: isActive ? 18 : 10,
        },
      };
    });
  }, [currentChain]);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-5 flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Cabecera & Controles Globales */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-3 border-b border-outline-variant/30">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-on-surface tracking-tight">
            Mapa de Talento y Competencias
          </h1>
          <p className="text-xs text-outline mt-0.5">
            Relación de colaboradores, competencias verificadas, unidades operativas y valor.
          </p>
        </div>

        {/* Acciones principales de la cabecera */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative flex items-center bg-surface-container-lowest px-3 py-1.5 rounded-xl border border-outline-variant/40 text-xs font-medium">
            <span className="material-symbols-outlined text-outline text-[16px] mr-1.5">domain</span>
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="bg-transparent text-xs font-medium text-on-surface outline-hidden cursor-pointer pr-2"
              aria-label="Seleccionar dominio"
            >
              <option value="Todos">Todos los Dominios</option>
              <option value="Ingeniería & Producto">Ingeniería &amp; Producto</option>
              <option value="Operaciones & Logística">Operaciones &amp; Logística</option>
              <option value="Estrategia & Finanzas">Estrategia &amp; Finanzas</option>
              <option value="Recursos Humanos & Personas">Recursos Humanos &amp; Personas</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => setIsSynapticModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-primary text-on-primary hover:bg-primary-container transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Abrir mapa sináptico interactivo (React Flow)"
          >
            <span className="material-symbols-outlined text-[16px]">hub</span>
            <span>Ver Mapa Sináptico</span>
          </button>
        </div>
      </div>

      {/* Guía Rápida */}
      <QuickGuideBanner
        title="Guía del Mapa de Talento"
        description="Explorá relaciones de colaboradores con habilidades, squads y valor."
        tips={[
          'Hacé clic en cualquier colaborador del listado izquierdo para ver su perfil y actividades.',
          'Hacé clic en "Ver Mapa Sináptico" para abrir el diagrama de flujo interactivo con flechas y nodos.',
          'En el modal podés arrastrar el lienzo, hacer zoom libre y hacer clic en cualquier persona para trazar su red.',
        ]}
        dismissible={true}
      />

      {/* Métricas Resumen Dinámicas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="bg-surface-container-lowest px-4 py-3 rounded-xl border border-outline-variant/40 flex flex-col gap-1 shadow-2xs">
          <span className="text-xs text-on-surface-variant font-medium">Colaboradores mapeados</span>
          <div className="text-xl font-bold text-on-surface">
            {metrics.total} <span className="text-xs font-normal text-outline">activos</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest px-4 py-3 rounded-xl border border-outline-variant/40 flex flex-col gap-1 shadow-2xs">
          <span className="text-xs text-on-surface-variant font-medium">Criticidad promedio</span>
          <div className="text-xl font-bold text-primary">
            {metrics.avgCrit} <span className="text-xs font-normal text-outline">/ 10.0</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest px-4 py-3 rounded-xl border border-outline-variant/40 flex flex-col gap-1 shadow-2xs">
          <span className="text-xs text-on-surface-variant font-medium">Equipos y squads</span>
          <div className="text-xl font-bold text-on-surface">
            {metrics.distinctSquads} <span className="text-xs font-normal text-outline">unidades</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest px-4 py-3 rounded-xl border border-outline-variant/40 flex flex-col gap-1 shadow-2xs">
          <span className="text-xs text-on-surface-variant font-medium">Puntos únicos de falla (SPOF)</span>
          <div className="text-xl font-bold text-amber-600">
            {metrics.spofCount} <span className="text-xs font-normal text-outline">roles con riesgo</span>
          </div>
        </div>
      </div>

      {/* WORKSPACE PRINCIPAL: Directorio Lateral + Panel Central */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* PANEL IZQUIERDO: Directorio de Talento (4 cols) */}
        <div className="lg:col-span-4 bg-surface-container-lowest rounded-2xl shadow-xs border border-outline-variant/40 p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
            <h2 className="text-xs font-bold text-on-surface uppercase tracking-wider">
              Colaboradores ({filteredPersons.length})
            </h2>
            <span className="text-[11px] text-outline">Seleccioná para inspeccionar</span>
          </div>

          {/* Búsqueda en el listado */}
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-2.5 text-outline text-[16px]">
              search
            </span>
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Buscar colaborador o puesto..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-surface-container-low text-on-surface placeholder:text-outline text-xs outline-hidden focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary border border-outline-variant/30"
            />
          </div>

          {/* Lista de colaboradores */}
          <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
            {filteredPersons.map((person) => {
              const isSelected = activePerson.id === person.id;
              const isSpof = person.riskStatus === 'spof';

              return (
                <div
                  key={person.id}
                  onClick={() => setActivePersonId(person.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                    isSelected
                      ? 'bg-primary/5 border-primary ring-1 ring-primary/40 shadow-xs'
                      : 'bg-surface-container-lowest hover:bg-surface-container-low border-outline-variant/30'
                  }`}
                >
                  <UserAvatar
                    name={person.name}
                    size="md"
                    shape="circle"
                    showStatus={true}
                    statusColor={isSpof ? 'amber' : 'emerald'}
                  />
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-on-surface truncate">
                        {person.name}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                          isSpof
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isSpof ? 'SPOF' : 'Óptimo'}
                      </span>
                    </div>
                    <span className="text-xs text-primary font-medium leading-snug line-clamp-1">
                      {person.role}
                    </span>
                    <div className="flex items-center justify-between text-[11px] text-outline mt-0.5">
                      <span className="truncate">{person.squad.split('•')[0]?.trim()}</span>
                      <span className="font-semibold text-on-surface shrink-0">
                        Crit. {person.criticality}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* PANEL DERECHO: Tarjeta Hero del Colaborador Activo + Detalle Reestructurado (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {/* Tarjeta Hero del Colaborador Activo */}
          <div className="bg-surface-container-lowest rounded-2xl shadow-xs border border-outline-variant/40 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <UserAvatar
                name={activePerson.name}
                size="lg"
                shape="rounded"
                showStatus={true}
                statusColor={activePerson.riskStatus === 'spof' ? 'amber' : 'emerald'}
              />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-on-surface">{activePerson.name}</h2>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                      activePerson.riskStatus === 'spof'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {activePerson.riskStatus === 'spof' ? 'Punto Único de Falla (SPOF)' : 'Sin riesgo'}
                  </span>
                </div>
                <p className="text-xs text-primary font-medium mt-0.5">{activePerson.role}</p>
                <p className="text-xs text-outline">{activePerson.squad} &bull; Sede: {activePerson.location}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setIsSynapticModalOpen(true)}
                className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl text-xs font-semibold bg-primary text-on-primary hover:bg-primary-container transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                title="Abrir mapa sináptico interactivo con flechas"
              >
                <span className="material-symbols-outlined text-[16px]">hub</span>
                <span>Mapa Sináptico</span>
              </button>
              <button
                type="button"
                onClick={handleGoToEmployee}
                className="px-3 py-2 rounded-xl text-xs font-medium bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/40 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">person</span>
                <span>Perfil 360°</span>
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    showToast(`Descargando Ficha de ${activePerson.name}...`);
                    await employeesApi.downloadPdf(activePerson.id, activePerson.name);
                    showToast(`Ficha de ${activePerson.name} descargada exitosamente.`);
                  } catch {
                    window.print();
                  }
                }}
                className="px-3 py-2 rounded-xl text-xs font-medium bg-surface-container hover:bg-surface-container-high text-on-surface border border-outline-variant/40 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                title="Exportar ficha técnica en PDF"
              >
                <span className="material-symbols-outlined text-[16px] text-primary">download</span>
                <span className="hidden sm:inline">PDF</span>
              </button>
            </div>
          </div>

          {/* Banner de Invitación al Mapa Sináptico */}
          <div className="bg-gradient-to-r from-primary/10 via-surface-container-lowest to-surface-container-lowest rounded-2xl border border-primary/20 p-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-xs">
                <span className="material-symbols-outlined text-2xl">alt_route</span>
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-on-surface">
                  Red Sináptica de Valor y Competencias (Diagrama Interactivo)
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Visualizá el flujo completo con flechas direccionales: Personas &rarr; Habilidades DNA &rarr; Squads &rarr; Actividades &rarr; Impacto.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsSynapticModalOpen(true)}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">open_in_full</span>
              <span>Abrir Diagrama Interactivo</span>
            </button>
          </div>

          {/* Selector de Pestañas de Detalle */}
          <div className="bg-surface-container-lowest px-4 py-2 rounded-2xl border border-outline-variant/40 shadow-2xs flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl border border-outline-variant/20 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setActiveTab('actions')}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'actions'
                    ? 'bg-surface-container-lowest text-primary shadow-xs font-semibold'
                    : 'text-outline hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">task_alt</span>
                <span>Iniciativas Clave ({activePerson.activities.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('skills')}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'skills'
                    ? 'bg-surface-container-lowest text-primary shadow-xs font-semibold'
                    : 'text-outline hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">psychology</span>
                <span>Competencias DNA ({activePerson.skills.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('spof')}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  activeTab === 'spof'
                    ? 'bg-surface-container-lowest text-primary shadow-xs font-semibold'
                    : 'text-outline hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">shield</span>
                <span>Análisis SPOF</span>
              </button>
            </div>
          </div>

          {/* PESTAÑA 1: Iniciativas y Tareas Clave */}
          {activeTab === 'actions' && (
            <div className="bg-surface-container-lowest rounded-2xl shadow-xs border border-outline-variant/40 p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                <div>
                  <h3 className="text-sm font-bold text-on-surface">
                    Iniciativas y Tareas Asignadas a {activePerson.name}
                  </h3>
                  <p className="text-xs text-outline mt-0.5">
                    Procesos directos de negocio, custodia técnica y proyectos en curso.
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-primary/10 text-primary">
                  {activePerson.activities.length} Asignaciones
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activePerson.activities.map((act, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/20 flex flex-col justify-between gap-3 shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                          {idx + 1}
                        </span>
                        <h4 className="text-xs font-bold text-on-surface leading-snug">
                          {act.title}
                        </h4>
                      </div>
                      <p className="text-xs text-on-surface-variant leading-relaxed pl-10">
                        {act.description}
                      </p>
                    </div>

                    <div className="mt-2 pt-2 border-t border-outline-variant/20 flex items-center justify-between text-xs text-outline pl-10">
                      <span>Puesto: {activePerson.role}</span>
                      <span className="font-semibold text-primary">Activa</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PESTAÑA 2: Competencias DNA */}
          {activeTab === 'skills' && (
            <div className="bg-surface-container-lowest rounded-2xl shadow-xs border border-outline-variant/40 p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                <div>
                  <h3 className="text-sm font-bold text-on-surface">
                    Matriz de Competencias Verificadas de {activePerson.name}
                  </h3>
                  <p className="text-xs text-outline mt-0.5">
                    Nivel técnico comprobado y stack operativo validado.
                  </p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800">
                  {activePerson.skills.length} Verificadas
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {activePerson.skills.map((skill, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-surface-container-low rounded-xl border border-outline-variant/20 flex flex-col justify-between gap-2.5 shadow-2xs"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-on-surface">{skill.name}</span>
                        <span className="text-xs font-bold text-primary">Nv. {skill.level} / 5</span>
                      </div>
                      {skill.technicalName && (
                        <span className="text-[11px] text-outline block mt-0.5">
                          {skill.technicalName}
                        </span>
                      )}
                    </div>

                    <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-300"
                        style={{ width: `${(skill.level / 5) * 100}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-outline">
                      <span className="font-mono">{skill.dna || 'Validado por comité'}</span>
                      <span className="text-emerald-700 font-medium flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">verified</span>
                        Verificada
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PESTAÑA 3: Análisis de Continuidad y Riesgo SPOF */}
          {activeTab === 'spof' && (
            <div className="bg-surface-container-lowest rounded-2xl shadow-xs border border-outline-variant/40 p-5 flex flex-col gap-4">
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant/20">
                <div>
                  <h3 className="text-sm font-bold text-on-surface">
                    Evaluación de Continuidad Operativa &amp; SPOF
                  </h3>
                  <p className="text-xs text-outline mt-0.5">
                    Índice de criticidad y resiliencia ante ausencias o relevos.
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                    activePerson.riskStatus === 'spof'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {activePerson.riskStatus === 'spof' ? 'Riesgo Detectado' : 'Continuidad Segura'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-surface-container-low rounded-xl border border-outline-variant/20 flex flex-col gap-1">
                  <span className="text-[11px] text-outline">Índice de Criticidad</span>
                  <div className="text-xl font-bold text-primary">{activePerson.criticality} / 10</div>
                  <span className="text-[10px] text-on-surface-variant">Prioridad alta en la unidad</span>
                </div>

                <div className="p-3.5 bg-surface-container-low rounded-xl border border-outline-variant/20 flex flex-col gap-1">
                  <span className="text-[11px] text-outline">Unidad de Dependencia</span>
                  <div className="text-sm font-bold text-on-surface leading-tight mt-1">
                    {activePerson.squad.split('•')[0]?.trim()}
                  </div>
                  <span className="text-[10px] text-outline">Sede: {activePerson.location}</span>
                </div>

                <div className="p-3.5 bg-surface-container-low rounded-xl border border-outline-variant/20 flex flex-col gap-1">
                  <span className="text-[11px] text-outline">Plan de Relevo</span>
                  <div className="text-sm font-bold text-on-surface leading-tight mt-1">
                    {activePerson.riskStatus === 'spof' ? 'Requerido URGENTE' : 'Cobertura 100%'}
                  </div>
                  <span className="text-[10px] text-outline">
                    {activePerson.riskStatus === 'spof'
                      ? 'No posee suplente directo'
                      : 'Capacitación cruzada lista'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL SINÁPTICO: REACT FLOW CON FLECHAS FLUIDAS Y SIN CORTES              */}
      {/* ========================================================================= */}
      {isSynapticModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="synaptic-modal-title"
            className="bg-surface-container-lowest w-full max-w-[96vw] xl:max-w-7xl h-[92vh] max-h-[860px] rounded-3xl shadow-2xl border border-outline-variant/40 flex flex-col justify-between overflow-hidden"
          >
            {/* Header del Modal */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-6 py-3.5 border-b border-outline-variant/20 bg-surface-container-lowest shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-2xl">hub</span>
                </div>
                <div>
                  <h3 id="synaptic-modal-title" className="text-base font-bold text-on-surface">
                    Mapa Sináptico de Acciones, Competencias y Valor
                  </h3>
                  <p className="text-xs text-outline">
                    Flujo interactivo con anclaje de flechas: Personas &rarr; Habilidades DNA &rarr; Squads &rarr; Actividades &rarr; Impacto
                  </p>
                </div>
              </div>

              {/* Controles de Cierre */}
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-surface-container-low text-xs text-outline font-medium">
                  <span className="material-symbols-outlined text-[15px] text-primary">drag_pan</span>
                  <span>Arrastrá el lienzo para moverte o usá la rueda para zoom</span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsSynapticModalOpen(false)}
                  className="w-9 h-9 rounded-full hover:bg-surface-container flex items-center justify-center text-outline hover:text-on-surface cursor-pointer transition-colors"
                  title="Cerrar modal (Esc)"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>
            </div>

            {/* Lienzo Interactivo con React Flow */}
            <div className="flex-1 w-full h-[66vh] min-h-[500px] relative bg-surface-container-low/20">
              <ReactFlow
                nodes={flowNodes}
                edges={flowEdges}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.12 }}
                minZoom={0.35}
                maxZoom={1.5}
                proOptions={{ hideAttribution: true }}
              >
                <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#CBD5E1" />
                <Controls
                  showInteractive={false}
                  className="!bg-surface-container-lowest !border-outline-variant/30 !shadow-md !rounded-xl overflow-hidden"
                />

                {/* Panel Superior con Leyendas de Columnas */}
                <Panel position="top-left" className="!m-4 flex items-center gap-6 pointer-events-none">
                  <div className="flex items-center gap-4 bg-surface-container-lowest/90 backdrop-blur-md px-4 py-2 rounded-2xl shadow-xs border border-outline-variant/30 text-xs font-bold text-on-surface">
                    <span className="flex items-center gap-1.5 text-primary">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      1. Personas
                    </span>
                    <span className="text-outline">&rarr;</span>
                    <span className="flex items-center gap-1.5 text-primary">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      2. Habilidades
                    </span>
                    <span className="text-outline">&rarr;</span>
                    <span className="flex items-center gap-1.5 text-primary">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      3. Squads
                    </span>
                    <span className="text-outline">&rarr;</span>
                    <span className="flex items-center gap-1.5 text-primary">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      4. Actividades
                    </span>
                    <span className="text-outline">&rarr;</span>
                    <span className="flex items-center gap-1.5 text-secondary">
                      <span className="w-2 h-2 rounded-full bg-secondary" />
                      5. Impacto
                    </span>
                  </div>
                </Panel>
              </ReactFlow>
            </div>

            {/* Footer del Modal: Leyenda y Controles de Acción */}
            <div className="px-6 py-3 border-t border-outline-variant/20 bg-surface-container-lowest flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shrink-0">
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-3.5 h-1 rounded-full ${
                      currentChain.isSpof ? 'bg-amber-500' : 'bg-primary'
                    }`}
                  />
                  <span className="text-on-surface font-semibold">
                    Conexión activa de {activePerson.name} {currentChain.isSpof ? '(SPOF)' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-1 bg-outline-variant/60 rounded-full" />
                  <span className="text-outline">Otras conexiones</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-outline">Óptimo</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-outline">SPOF (Riesgo)</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGoToEmployee}
                  className="px-3.5 py-1.5 rounded-xl bg-primary text-on-primary font-semibold text-xs hover:bg-primary-container transition-all cursor-pointer"
                >
                  Ver Ficha 360°
                </button>
                <button
                  type="button"
                  onClick={() => setIsSynapticModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
