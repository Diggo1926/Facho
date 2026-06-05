import { useNavigate } from 'react-router-dom';
import {
  IconShoppingBag, IconHanger, IconUsers, IconBasket,
  IconDeviceLaptop, IconBuilding, IconPlus,
} from '@tabler/icons-react';

const TYPE_ICONS = {
  loja: 'ti-shopping-bag',
  moda: 'ti-hanger',
  estoque: 'ti-hanger',
  crm: 'ti-users',
  mercado: 'ti-basket',
  inventário: 'ti-basket',
  inventario: 'ti-basket',
  sistema: 'ti-device-laptop',
  empresa: 'ti-building',
  default: 'ti-device-laptop',
};

const ICON_COMPONENTS = {
  'ti-shopping-bag': IconShoppingBag,
  'ti-hanger': IconHanger,
  'ti-users': IconUsers,
  'ti-basket': IconBasket,
  'ti-device-laptop': IconDeviceLaptop,
  'ti-building': IconBuilding,
};

function getIcon(tipo) {
  if (!tipo) return TYPE_ICONS.default;
  const lower = tipo.toLowerCase();
  return TYPE_ICONS[lower] || TYPE_ICONS.default;
}

function PhasePips({ currentPhase, totalPhases = 8 }) {
  return (
    <div className="flex gap-1 items-center">
      {Array.from({ length: totalPhases }, (_, i) => {
        const num = i + 1;
        let bg = '#E0D8CC';
        if (num < currentPhase) bg = '#7A4A3A';
        else if (num === currentPhase) bg = '#C17A3A';
        return (
          <span
            key={num}
            style={{ backgroundColor: bg }}
            className="w-4 h-1.5 rounded-full block"
          />
        );
      })}
    </div>
  );
}

function StatusBadge({ status }) {
  if (status === 'concluido') {
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E8F0DC] text-[#4A6A1F] font-medium">
        concluído
      </span>
    );
  }
  if (status === 'pausado') {
    return (
      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EDE4D8] text-[#8B5A2B] font-medium">
        pausado
      </span>
    );
  }
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F0E8DC] text-[#8B5A2B] font-medium">
      ativo
    </span>
  );
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export default function ProjectCard({ project, isActive = false, isNew = false, onCreate }) {
  const navigate = useNavigate();

  if (isNew) {
    return (
      <button
        onClick={onCreate}
        className="flex flex-col items-center justify-center gap-2 border border-dashed border-[#C9BFB0] rounded-card p-4 h-[140px] hover:border-caramel hover:bg-cream transition-colors group"
      >
        <IconPlus size={28} className="text-caramel group-hover:scale-110 transition-transform" />
        <span className="text-sm text-muted group-hover:text-caramel transition-colors">
          novo projeto
        </span>
      </button>
    );
  }

  const iconKey = project.icone || getIcon(project.tipo);
  const IconComp = ICON_COMPONENTS[iconKey] || IconDeviceLaptop;

  return (
    <button
      onClick={() => navigate(`/projeto/${project.id}`)}
      className={`flex flex-col gap-2.5 p-4 rounded-card text-left transition-all hover:shadow-sm ${
        isActive
          ? 'border border-gold bg-surface shadow-sm'
          : 'border border-[#E0D8CC] bg-surface'
      }`}
      style={{ borderWidth: isActive ? '1px' : '0.5px' }}
    >
      {isActive && (
        <span className="text-[9px] font-medium text-caramel uppercase tracking-[0.12em]">
          ativo
        </span>
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <IconComp size={isActive ? 36 : 32} className="text-terra" />
          <div>
            <p
              className="text-dark font-medium leading-tight"
              style={{ fontSize: isActive ? '14px' : '13px' }}
            >
              {project.nome}
            </p>
            {(project.cliente || project.tipo) && (
              <p className="text-[11px] text-faint mt-0.5">
                {[project.cliente, project.tipo].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
        </div>
        <StatusBadge status={project.status} />
      </div>

      <PhasePips currentPhase={project.currentPhase} />

      <p className="text-[10px] text-[#C9BFB0]">
        atualizado {formatDate(project.updatedAt)}
      </p>
    </button>
  );
}
