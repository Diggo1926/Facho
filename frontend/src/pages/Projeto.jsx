import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api.jsx';
import PhaseView from '../components/PhaseView.jsx';
import ContextExporter from '../components/ContextExporter.jsx';
import LinkReferenceModal from './LinkReferenceModal.jsx';
import { IconLoader2, IconArrowLeft, IconLink, IconBolt } from '@tabler/icons-react';

const PHASE_NAMES = ['Briefing', 'Referências', 'Identidade', 'Wireframe', 'Design', 'Código', 'Testes', 'Deploy'];
const PHASE_SHORT = ['Brief', 'Refs', 'ID', 'Wire', 'Design', 'Código', 'Testes', 'Deploy'];

function PhasePip({ phase, isOpen, onClick }) {
  const blocked = phase.status === 'pendente';
  let bg = '#E0D8CC';
  let text = '#A0896E';
  let border = 'transparent';

  if (phase.status === 'concluida') { bg = '#7A4A3A'; text = '#FDFAF5'; }
  else if (phase.status === 'ativa' || isOpen) { bg = '#FDFAF5'; text = '#C17A3A'; border = '#C17A3A'; }

  return (
    <button
      onClick={onClick}
      disabled={blocked && phase.numero > 1}
      className={`flex flex-col items-center gap-1 px-2 py-2 rounded-btn transition-all ${
        blocked && phase.numero > 1 ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-80'
      } ${isOpen ? 'ring-1 ring-[#C17A3A]' : ''}`}
      style={{ backgroundColor: bg, borderColor: border, borderWidth: '1px', borderStyle: 'solid' }}
    >
      <span className="text-[10px] font-medium" style={{ color: text }}>{phase.numero}</span>
      <span className="text-[10px] leading-tight text-center" style={{ color: text }}>{PHASE_SHORT[phase.numero - 1]}</span>
    </button>
  );
}

export default function Projeto() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [openPhase, setOpenPhase] = useState(null);
  const [showContext, setShowContext] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/api/projects/${id}`);
      setProject(data);
      if (!openPhase) {
        const active = data.phases.find((p) => p.status === 'ativa') || data.phases[0];
        setOpenPhase(active?.numero);
      }
    } catch {
      navigate('/projetos');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, openPhase]);

  useEffect(() => { load(); }, [id]); // eslint-disable-line

  if (loading || !project) {
    return (
      <div className="flex items-center justify-center h-64 text-faint">
        <IconLoader2 size={28} className="animate-spin" />
      </div>
    );
  }

  const currentPhaseMeta = project.phases.find((p) => p.numero === openPhase);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={() => navigate('/projetos')}
              className="text-faint hover:text-dark transition-colors"
            >
              <IconArrowLeft size={16} />
            </button>
            <h1 className="text-base font-medium text-dark">{project.nome}</h1>
            {project.status === 'concluido' && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E8F0DC] text-[#4A6A1F] font-medium">concluído</span>
            )}
          </div>
          <p className="text-sm text-faint ml-6">
            {[project.cliente, project.tipo, project.complexidade].filter(Boolean).join(' · ')}
          </p>
        </div>

        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setShowLink(true)}
            className="btn-secondary flex items-center gap-1.5"
          >
            <IconLink size={16} />
            vincular ref
          </button>
          <button
            onClick={() => setShowContext(true)}
            className="btn-primary flex items-center gap-1.5"
          >
            <IconBolt size={16} />
            exportar contexto
          </button>
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {project.phases.map((phase) => (
          <PhasePip
            key={phase.numero}
            phase={phase}
            isOpen={openPhase === phase.numero}
            onClick={() => setOpenPhase(phase.numero)}
          />
        ))}
      </div>

      {currentPhaseMeta && (
        <div className="flex items-center gap-3">
          <span className="text-xs text-faint">
            fase {currentPhaseMeta.numero} — {PHASE_NAMES[currentPhaseMeta.numero - 1]}
          </span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
              currentPhaseMeta.status === 'concluida'
                ? 'bg-[#E8F0DC] text-[#4A6A1F]'
                : currentPhaseMeta.status === 'ativa'
                ? 'bg-[#F0E8DC] text-[#8B5A2B]'
                : 'bg-border text-faint'
            }`}
          >
            {currentPhaseMeta.status}
          </span>
        </div>
      )}

      <PhaseView
        project={project}
        phase={currentPhaseMeta}
        onPhaseUpdated={load}
        onConclude={load}
      />

      <ContextExporter
        projectId={id}
        open={showContext}
        onClose={() => setShowContext(false)}
      />

      {showLink && (
        <LinkReferenceModal
          project={project}
          onClose={() => setShowLink(false)}
          onLinked={load}
        />
      )}
    </div>
  );
}
