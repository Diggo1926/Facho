import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api.jsx';
import PhaseView from '../components/PhaseView.jsx';
import ContextExporter from '../components/ContextExporter.jsx';
import LinkReferenceModal from './LinkReferenceModal.jsx';
import { IconLoader2, IconArrowLeft, IconLink, IconBolt, IconPhoto, IconExternalLink, IconX } from '@tabler/icons-react';

const PHASE_NAMES = ['Ideia', 'Arquitetura', 'Design', 'Segurança', 'Desenvolvimento', 'Testes', 'Deploy', 'Entrega'];
const PHASE_SHORT = ['Ideia', 'Arq', 'Design', 'Seg', 'Dev', 'Testes', 'Deploy', 'Entrega'];

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

function getMicrolinkUrl(link) {
  return `https://api.microlink.io/?url=${encodeURIComponent(link)}&screenshot=true&meta=false&embed=screenshot.url`;
}

function MoodBoard({ project, onLinkRef }) {
  const vinculadas = project.references || [];
  const phase3 = project.phases?.find(p => p.numero === 3);
  const paleta = (() => {
    const p = phase3?.resultado?.paleta || phase3?.paleta;
    if (!p || typeof p !== 'object') return [];
    const labels = { primaria: 'Primária', secundaria: 'Secundária', acento: 'Acento', texto: 'Texto', fundo: 'Fundo' };
    return Object.entries(p)
      .filter(([, v]) => typeof v === 'string' && v.startsWith('#'))
      .map(([k, v]) => ({ hex: v, label: labels[k] || k }));
  })();

  return (
    <div className="space-y-5">
      {paleta.length > 0 && (
        <div>
          <p className="text-xs font-medium text-muted mb-3">paleta do projeto</p>
          <div className="flex gap-4 flex-wrap">
            {paleta.map((c, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div
                  className="w-16 h-16 rounded-xl border border-border shadow-sm"
                  style={{ backgroundColor: c.hex }}
                />
                <span className="text-[10px] text-muted">{c.label}</span>
                <span className="text-[10px] text-faint font-mono">{c.hex}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-muted">referências vinculadas</p>
          <button
            onClick={onLinkRef}
            className="flex items-center gap-1 text-xs text-terra hover:underline"
          >
            <IconLink size={12} /> vincular referência
          </button>
        </div>

        {vinculadas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center border border-dashed border-border rounded-card">
            <IconPhoto size={40} className="text-border" />
            <p className="text-sm text-faint">nenhuma referência vinculada</p>
            <button onClick={onLinkRef} className="btn-primary text-xs">vincular primeira referência</button>
          </div>
        ) : (
          <div
            className="gap-3"
            style={{ columns: '3 200px' }}
          >
            {vinculadas.map((pr) => {
              const ref = pr.reference;
              if (!ref) return null;
              const imgSrc = ref.screenshotUrl || (ref.link ? getMicrolinkUrl(ref.link) : null);
              return (
                <div
                  key={pr.id}
                  className="break-inside-avoid mb-3 bg-surface border border-border rounded-card overflow-hidden group hover:shadow-sm transition-shadow"
                >
                  {imgSrc ? (
                    <img
                      src={imgSrc}
                      alt={ref.nome}
                      className="w-full object-cover"
                      style={{ minHeight: '80px' }}
                      onError={e => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                  ) : null}
                  <div
                    className={`${imgSrc ? 'hidden' : 'block'} h-24`}
                    style={{ backgroundColor: ref.corFundo || '#EDE4D8' }}
                  />
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-medium text-dark">{ref.nome}</p>
                      {ref.link && (
                        <a href={ref.link} target="_blank" rel="noopener noreferrer" className="text-faint hover:text-terra opacity-0 group-hover:opacity-100 transition-opacity">
                          <IconExternalLink size={12} />
                        </a>
                      )}
                    </div>
                    {pr.phaseNumero && (
                      <span className="text-[10px] text-faint">fase {pr.phaseNumero} — {PHASE_NAMES[pr.phaseNumero - 1]}</span>
                    )}
                    {ref.anotacoes && (
                      <p className="text-[11px] text-faint mt-1 line-clamp-2">{ref.anotacoes}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Projeto() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [openPhase, setOpenPhase] = useState(null);
  const [activeTab, setActiveTab] = useState('pipeline'); // 'pipeline' | 'inspiracao'
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
            <button onClick={() => navigate('/projetos')} className="text-faint hover:text-dark transition-colors">
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
          <button onClick={() => setShowLink(true)} className="btn-secondary flex items-center gap-1.5">
            <IconLink size={16} /> vincular ref
          </button>
          <button onClick={() => setShowContext(true)} className="btn-primary flex items-center gap-1.5">
            <IconBolt size={16} /> exportar contexto
          </button>
        </div>
      </div>

      {/* tabs */}
      <div className="flex gap-1 border-b border-border">
        <button
          onClick={() => setActiveTab('pipeline')}
          className={`px-4 py-2 text-xs font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'pipeline' ? 'border-terra text-terra' : 'border-transparent text-faint hover:text-muted'
          }`}
        >
          pipeline
        </button>
        <button
          onClick={() => setActiveTab('inspiracao')}
          className={`px-4 py-2 text-xs font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
            activeTab === 'inspiracao' ? 'border-terra text-terra' : 'border-transparent text-faint hover:text-muted'
          }`}
        >
          <IconPhoto size={13} />
          inspiração
          {(project.references?.length || 0) > 0 && (
            <span className="text-[10px] bg-cream border border-border rounded-full px-1.5 py-0.5 text-faint">
              {project.references.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'pipeline' && (
        <>
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
        </>
      )}

      {activeTab === 'inspiracao' && (
        <MoodBoard project={project} onLinkRef={() => setShowLink(true)} />
      )}

      <ContextExporter projectId={id} open={showContext} onClose={() => setShowContext(false)} />

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
