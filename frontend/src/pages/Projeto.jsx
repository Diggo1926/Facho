import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api.jsx';
import PhaseView from '../components/PhaseView.jsx';
import ContextExporter from '../components/ContextExporter.jsx';
import LinkReferenceModal from './LinkReferenceModal.jsx';
import { IconLoader2, IconArrowLeft, IconLink, IconBolt, IconPhoto, IconExternalLink, IconX, IconFileText, IconHistory, IconPlus, IconTemplate } from '@tabler/icons-react';

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

function HistoricoTab({ projectId }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showManual, setShowManual] = useState(false);
  const [manualResumo, setManualResumo] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/api/projects/${projectId}/sessions`);
      setSessions(data);
    } catch {}
    setLoading(false);
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  async function addManual() {
    if (!manualResumo.trim()) return;
    setSaving(true);
    try {
      await api.post(`/api/projects/${projectId}/sessions`, { resumo: manualResumo.trim() });
      setManualResumo('');
      setShowManual(false);
      load();
    } catch {}
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32 text-faint">
        <IconLoader2 size={20} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-faint">{sessions.length} {sessions.length === 1 ? 'sessão registrada' : 'sessões registradas'}</p>
        <button
          onClick={() => setShowManual(v => !v)}
          className="btn-secondary flex items-center gap-1.5 text-xs"
        >
          <IconPlus size={13} /> adicionar nota
        </button>
      </div>

      {showManual && (
        <div className="bg-surface border border-border rounded-card p-4 space-y-3">
          <input
            type="text"
            value={manualResumo}
            onChange={e => setManualResumo(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addManual()}
            placeholder="Descreva o que foi feito nessa sessão..."
            className="w-full text-sm bg-cream border border-border rounded-btn px-3 py-2 text-dark placeholder:text-faint focus:outline-none focus:ring-1 focus:ring-terra"
            autoFocus
          />
          <div className="flex gap-2">
            <button onClick={addManual} disabled={saving} className="btn-primary text-xs">
              {saving ? 'salvando...' : 'salvar'}
            </button>
            <button onClick={() => { setShowManual(false); setManualResumo(''); }} className="btn-secondary text-xs">
              cancelar
            </button>
          </div>
        </div>
      )}

      {sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center border border-dashed border-border rounded-card">
          <IconHistory size={36} className="text-border" />
          <p className="text-sm text-faint">nenhuma sessão registrada ainda</p>
          <p className="text-xs text-faint">as sessões são criadas automaticamente ao exportar contexto</p>
        </div>
      ) : (
        <div className="border-l-2 border-border pl-5 space-y-0">
          {sessions.map((s) => (
            <div key={s.id} className="relative pb-5">
              <div
                className="absolute -left-[25px] top-1 w-2.5 h-2.5 rounded-full border-2 border-surface"
                style={{ backgroundColor: s.contextoExportado ? '#7A4A3A' : '#C9BFB0' }}
              />
              <div className="bg-surface border border-border rounded-card p-3.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-dark leading-snug">{s.resumo}</p>
                  {s.contextoExportado && (
                    <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-[#F0E8DC] text-[#8B5A2B] font-medium">
                      contexto exportado
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-faint mt-1.5">
                  {new Date(s.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Projeto() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [openPhase, setOpenPhase] = useState(null);
  const [activeTab, setActiveTab] = useState('pipeline'); // 'pipeline' | 'inspiracao' | 'historico'
  const [showContext, setShowContext] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const [loading, setLoading] = useState(true);
  const [gerandoProposta, setGerandoProposta] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [nomeTemplate, setNomeTemplate] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);

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

  async function gerarProposta() {
    setGerandoProposta(true);
    try {
      const response = await api.post(`/api/projects/${id}/proposal`, {}, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `proposta-${project.nome.toLowerCase().replace(/ /g, '-')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Erro ao gerar proposta.');
    } finally {
      setGerandoProposta(false);
    }
  }

  async function salvarComoTemplate() {
    if (!nomeTemplate.trim()) return;
    setSavingTemplate(true);
    try {
      await api.post(`/api/projects/${id}/save-as-template`, { nomeTemplate: nomeTemplate.trim() });
      setShowSaveTemplate(false);
      setNomeTemplate('');
      alert('Template salvo com sucesso!');
    } catch {
      alert('Erro ao salvar template.');
    } finally {
      setSavingTemplate(false);
    }
  }

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

        <div className="flex gap-2 shrink-0 flex-wrap justify-end">
          <button onClick={() => setShowSaveTemplate(true)} className="btn-secondary flex items-center gap-1.5">
            <IconTemplate size={16} /> salvar template
          </button>
          <button
            onClick={gerarProposta}
            disabled={gerandoProposta}
            className="btn-secondary flex items-center gap-1.5"
          >
            {gerandoProposta ? <IconLoader2 size={16} className="animate-spin" /> : <IconFileText size={16} />}
            {gerandoProposta ? 'gerando...' : 'proposta PDF'}
          </button>
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
        <button
          onClick={() => setActiveTab('historico')}
          className={`px-4 py-2 text-xs font-medium transition-colors border-b-2 -mb-px flex items-center gap-1.5 ${
            activeTab === 'historico' ? 'border-terra text-terra' : 'border-transparent text-faint hover:text-muted'
          }`}
        >
          <IconHistory size={13} />
          histórico
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

      {activeTab === 'historico' && (
        <HistoricoTab projectId={id} />
      )}

      <ContextExporter projectId={id} project={project} open={showContext} onClose={() => setShowContext(false)} />

      {showSaveTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black opacity-40" onClick={() => setShowSaveTemplate(false)} />
          <div className="relative bg-surface border border-border rounded-card shadow-lg w-full max-w-sm z-10 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-dark">salvar como template</h2>
              <button onClick={() => setShowSaveTemplate(false)} className="text-faint hover:text-dark">
                <IconX size={16} />
              </button>
            </div>
            <input
              type="text"
              value={nomeTemplate}
              onChange={e => setNomeTemplate(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && salvarComoTemplate()}
              placeholder={`Template — ${project.nome}`}
              className="w-full text-sm bg-cream border border-border rounded-btn px-3 py-2 text-dark placeholder:text-faint focus:outline-none focus:ring-1 focus:ring-terra"
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={salvarComoTemplate} disabled={savingTemplate} className="btn-primary text-sm flex-1">
                {savingTemplate ? 'salvando...' : 'salvar template'}
              </button>
              <button onClick={() => setShowSaveTemplate(false)} className="btn-secondary text-sm">
                cancelar
              </button>
            </div>
          </div>
        </div>
      )}

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
