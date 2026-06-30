import { useEffect, useState, useCallback } from 'react';
import api from '../../services/api.jsx';
import {
  IconPlus, IconLoader2, IconFileText, IconFileCheck, IconFileX,
  IconClock, IconCheck, IconX, IconUpload, IconDownload, IconAlertTriangle,
  IconChevronDown,
} from '@tabler/icons-react';

const STATUS_CONFIG = {
  rascunho:    { label: 'Rascunho',     bg: '#EDE4D8', color: '#8B5A2B' },
  em_revisao:  { label: 'Em Revisão',   bg: '#E8EEF8', color: '#3A5A8B' },
  aprovado:    { label: 'Aprovado',     bg: '#E8F0DC', color: '#4A6A1F' },
  assinado:    { label: 'Assinado',     bg: '#DFF0EA', color: '#1A6A4F' },
  cancelado:   { label: 'Cancelado',    bg: '#F0E0DC', color: '#8B2B2B' },
};

const TIPO_LABELS = {
  desenvolvimento:    'Desenvolvimento',
  licenca_manutencao: 'Licença e Manutenção',
  nda:                'NDA',
  outro:              'Outro',
};

const STATUS_TRANSITIONS = {
  rascunho:   ['em_revisao', 'aprovado', 'cancelado'],
  em_revisao: ['aprovado', 'rascunho', 'cancelado'],
  aprovado:   ['assinado', 'em_revisao', 'cancelado'],
  assinado:   [],
  cancelado:  [],
};

function ContractCard({ contract, onAction }) {
  const s = STATUS_CONFIG[contract.status] || STATUS_CONFIG.rascunho;
  const temAssinado = contract.files?.some(f => f.tipoArquivo === 'assinado');
  const [showTransitions, setShowTransitions] = useState(false);
  const transitions = STATUS_TRANSITIONS[contract.status] || [];

  return (
    <div className="bg-surface border border-border rounded-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0"
              style={{ backgroundColor: s.bg, color: s.color }}
            >
              {s.label}
            </span>
            <span className="text-[10px] text-faint">{TIPO_LABELS[contract.tipo] || contract.tipo}</span>
            <span className="text-[10px] text-faint">v{contract.versao}</span>
            {temAssinado && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#DFF0EA] text-[#1A6A4F] font-medium flex items-center gap-1">
                <IconFileCheck size={10} /> PDF assinado
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-dark truncate">{contract.titulo}</p>
          {contract.valorTotal && (
            <p className="text-xs text-faint mt-0.5">
              R$ {Number(contract.valorTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          )}
          {contract.assinadoEm && (
            <p className="text-[11px] text-faint">
              assinado em {new Date(contract.assinadoEm).toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>
      </div>

      {/* Ações */}
      <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-border">
        <button
          onClick={() => onAction('generate-pdf', contract)}
          className="flex items-center gap-1 text-xs text-muted hover:text-terra transition-colors"
        >
          <IconFileText size={13} /> gerar PDF
        </button>

        {contract.status !== 'assinado' && contract.status !== 'cancelado' && (
          <button
            onClick={() => onAction('upload-signed', contract)}
            className="flex items-center gap-1 text-xs text-muted hover:text-terra transition-colors"
          >
            <IconUpload size={13} /> PDF assinado
          </button>
        )}

        {contract.files?.length > 0 && (
          <button
            onClick={() => onAction('download', contract)}
            className="flex items-center gap-1 text-xs text-muted hover:text-terra transition-colors"
          >
            <IconDownload size={13} /> baixar
          </button>
        )}

        {transitions.length > 0 && (
          <div className="relative ml-auto">
            <button
              onClick={() => setShowTransitions(v => !v)}
              className="flex items-center gap-1 text-xs text-faint hover:text-dark transition-colors"
            >
              status <IconChevronDown size={11} />
            </button>
            {showTransitions && (
              <div className="absolute right-0 bottom-6 z-10 bg-surface border border-border rounded-card shadow-lg py-1 min-w-[130px]">
                {transitions.map(t => {
                  const ts = STATUS_CONFIG[t];
                  return (
                    <button
                      key={t}
                      onClick={() => { onAction('change-status', contract, t); setShowTransitions(false); }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-cream flex items-center gap-2"
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: ts.color }}
                      />
                      {ts.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function NewContractModal({ projectId, onClose, onCreated }) {
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [titulo, setTitulo] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  const [campos, setCampos] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/contract-templates')
      .then(r => { setTemplates(r.data); })
      .catch(() => {})
      .finally(() => setLoadingTemplates(false));
  }, []);

  function selectTemplate(t) {
    setSelectedTemplate(t);
    setTitulo(t.nome);
    const initial = {};
    (t.campos || []).forEach(c => { initial[c.chave] = ''; });
    setCampos(initial);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedTemplate) { setError('Selecione um modelo.'); return; }
    if (!titulo.trim()) { setError('Título obrigatório.'); return; }
    setSaving(true);
    setError('');
    try {
      await api.post(`/api/projects/${projectId}/contracts`, {
        templateId: selectedTemplate.id,
        titulo: titulo.trim(),
        dados: campos,
        valorTotal: valorTotal ? parseFloat(valorTotal) : null,
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar contrato.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center md:p-6">
      <div className="absolute inset-0 bg-black/40 hidden md:block" onClick={onClose} />
      <div className="relative bg-surface w-full h-full md:h-auto md:max-w-lg md:rounded-card md:border border-border shadow-lg z-10 flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-sm font-medium text-dark">novo contrato</h2>
          <button onClick={onClose} className="text-faint hover:text-dark">
            <IconX size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Seleção de modelo */}
          <div>
            <label className="block text-xs font-medium text-muted mb-2">modelo de contrato</label>
            {loadingTemplates ? (
              <div className="flex items-center gap-2 text-faint text-xs">
                <IconLoader2 size={14} className="animate-spin" /> carregando modelos...
              </div>
            ) : templates.length === 0 ? (
              <p className="text-xs text-faint">
                nenhum modelo cadastrado. Crie um em{' '}
                <a href="/contratos/modelos" className="text-terra hover:underline">Modelos de Contrato</a>.
              </p>
            ) : (
              <div className="grid gap-2">
                {templates.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => selectTemplate(t)}
                    className={`text-left px-3 py-2.5 rounded-btn border text-xs transition-colors ${
                      selectedTemplate?.id === t.id
                        ? 'border-terra bg-[#F5EDE5] text-terra'
                        : 'border-border text-muted hover:bg-cream'
                    }`}
                  >
                    <span className="font-medium">{t.nome}</span>
                    <span className="text-faint ml-2">· {TIPO_LABELS[t.tipo] || t.tipo}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedTemplate && (
            <>
              {/* Título */}
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">título do contrato</label>
                <input
                  type="text"
                  value={titulo}
                  onChange={e => setTitulo(e.target.value)}
                  placeholder="ex: Contrato — Cliente XYZ"
                  className="w-full text-sm bg-cream border border-border rounded-btn px-3 py-2 text-dark placeholder:text-faint focus:outline-none focus:ring-1 focus:ring-terra"
                />
              </div>

              {/* Valor */}
              <div>
                <label className="block text-xs font-medium text-muted mb-1.5">valor total (opcional)</label>
                <input
                  type="number"
                  value={valorTotal}
                  onChange={e => setValorTotal(e.target.value)}
                  placeholder="0,00"
                  min="0"
                  step="0.01"
                  className="w-full text-sm bg-cream border border-border rounded-btn px-3 py-2 text-dark placeholder:text-faint focus:outline-none focus:ring-1 focus:ring-terra"
                />
              </div>

              {/* Campos dinâmicos */}
              {(selectedTemplate.campos || []).length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-medium text-muted">dados do cliente</p>
                  {selectedTemplate.campos.map(campo => (
                    <div key={campo.chave}>
                      <label className="block text-xs text-muted mb-1">{campo.rotulo}</label>
                      <input
                        type={campo.tipo === 'data' ? 'date' : 'text'}
                        value={campos[campo.chave] || ''}
                        onChange={e => setCampos(prev => ({ ...prev, [campo.chave]: e.target.value }))}
                        placeholder={campo.placeholder || campo.rotulo}
                        className="w-full text-sm bg-cream border border-border rounded-btn px-3 py-2 text-dark placeholder:text-faint focus:outline-none focus:ring-1 focus:ring-terra"
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 border border-red-200 rounded-btn px-3 py-2">
              <IconAlertTriangle size={13} /> {error}
            </div>
          )}
        </form>

        <div className="p-5 border-t border-border flex gap-2">
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={saving || !selectedTemplate}
            className="btn-primary flex-1 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? <IconLoader2 size={14} className="animate-spin" /> : <IconCheck size={14} />}
            {saving ? 'salvando...' : 'criar contrato'}
          </button>
          <button onClick={onClose} className="btn-secondary text-sm">cancelar</button>
        </div>
      </div>
    </div>
  );
}

function UploadSignedModal({ contract, onClose, onUploaded }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleUpload() {
    if (!file) { setError('Selecione um arquivo PDF.'); return; }
    if (file.type !== 'application/pdf') { setError('Apenas arquivos PDF são aceitos.'); return; }
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('pdf', file);
      await api.post(`/api/contracts/${contract.id}/upload-signed`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onUploaded();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao enviar arquivo.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-surface border border-border rounded-card shadow-lg w-full max-w-sm z-10 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-dark">anexar PDF assinado</h2>
          <button onClick={onClose} className="text-faint hover:text-dark"><IconX size={16} /></button>
        </div>

        <p className="text-xs text-faint">
          Envie o PDF do contrato assinado via gov.br. O status será automaticamente marcado como <strong>assinado</strong>.
        </p>

        <label className="block cursor-pointer">
          <div className={`border-2 border-dashed rounded-card p-6 text-center transition-colors ${
            file ? 'border-terra bg-[#F5EDE5]' : 'border-border hover:border-terra hover:bg-cream'
          }`}>
            <IconUpload size={24} className={`mx-auto mb-2 ${file ? 'text-terra' : 'text-faint'}`} />
            {file ? (
              <p className="text-xs text-terra font-medium">{file.name}</p>
            ) : (
              <p className="text-xs text-faint">clique para selecionar o PDF assinado</p>
            )}
          </div>
          <input
            type="file"
            accept="application/pdf"
            className="sr-only"
            onChange={e => { setFile(e.target.files[0]); setError(''); }}
          />
        </label>

        {error && (
          <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 border border-red-200 rounded-btn px-3 py-2">
            <IconAlertTriangle size={13} /> {error}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleUpload}
            disabled={uploading || !file}
            className="btn-primary flex-1 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {uploading ? <IconLoader2 size={14} className="animate-spin" /> : <IconFileCheck size={14} />}
            {uploading ? 'enviando...' : 'anexar assinado'}
          </button>
          <button onClick={onClose} className="btn-secondary text-sm">cancelar</button>
        </div>
      </div>
    </div>
  );
}

export default function ContractsTab({ projectId }) {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [uploadTarget, setUploadTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/api/projects/${projectId}/contracts`);
      setContracts(data);
    } catch {}
    setLoading(false);
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  async function handleAction(action, contract, extra) {
    if (action === 'generate-pdf') {
      setActionLoading(contract.id + '-pdf');
      try {
        const res = await api.post(`/api/contracts/${contract.id}/generate-pdf`, {}, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = `${contract.titulo.toLowerCase().replace(/\s+/g, '-')}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        load();
      } catch {
        alert('Erro ao gerar PDF.');
      } finally {
        setActionLoading(null);
      }
    }

    if (action === 'upload-signed') {
      setUploadTarget(contract);
    }

    if (action === 'download') {
      const file = [...(contract.files || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
      if (!file) return;
      setActionLoading(contract.id + '-dl');
      try {
        const res = await api.get(`/api/contracts/${contract.id}/files/${file.id}`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = `${contract.titulo.toLowerCase().replace(/\s+/g, '-')}-${file.tipoArquivo}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } catch {
        alert('Erro ao baixar arquivo.');
      } finally {
        setActionLoading(null);
      }
    }

    if (action === 'change-status') {
      setActionLoading(contract.id + '-status');
      try {
        await api.put(`/api/contracts/${contract.id}`, { status: extra });
        load();
      } catch {
        alert('Erro ao atualizar status.');
      } finally {
        setActionLoading(null);
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32 text-faint">
        <IconLoader2 size={20} className="animate-spin" />
      </div>
    );
  }

  const ativos = contracts.filter(c => c.status !== 'cancelado');
  const cancelados = contracts.filter(c => c.status === 'cancelado');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-faint">
          {ativos.length} {ativos.length === 1 ? 'contrato' : 'contratos'}
          {cancelados.length > 0 && ` · ${cancelados.length} cancelado${cancelados.length > 1 ? 's' : ''}`}
        </p>
        <button
          onClick={() => setShowNew(true)}
          className="btn-primary flex items-center gap-1.5 text-xs"
        >
          <IconPlus size={13} /> novo contrato
        </button>
      </div>

      {ativos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center border border-dashed border-border rounded-card">
          <IconFileText size={40} className="text-border" />
          <p className="text-sm text-faint">nenhum contrato ainda</p>
          <button onClick={() => setShowNew(true)} className="btn-primary text-xs">
            criar primeiro contrato
          </button>
        </div>
      )}

      <div className="grid gap-3">
        {ativos.map(c => (
          <div key={c.id} className="relative">
            {actionLoading?.startsWith(c.id) && (
              <div className="absolute inset-0 bg-surface/70 rounded-card flex items-center justify-center z-10">
                <IconLoader2 size={18} className="animate-spin text-terra" />
              </div>
            )}
            <ContractCard contract={c} onAction={handleAction} />
          </div>
        ))}
      </div>

      {cancelados.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-xs text-faint hover:text-muted list-none flex items-center gap-1.5 pt-2">
            <IconFileX size={13} />
            {cancelados.length} contrato{cancelados.length > 1 ? 's' : ''} cancelado{cancelados.length > 1 ? 's' : ''}
          </summary>
          <div className="grid gap-3 mt-3 opacity-60">
            {cancelados.map(c => (
              <ContractCard key={c.id} contract={c} onAction={handleAction} />
            ))}
          </div>
        </details>
      )}

      {showNew && (
        <NewContractModal
          projectId={projectId}
          onClose={() => setShowNew(false)}
          onCreated={load}
        />
      )}

      {uploadTarget && (
        <UploadSignedModal
          contract={uploadTarget}
          onClose={() => setUploadTarget(null)}
          onUploaded={() => { setUploadTarget(null); load(); }}
        />
      )}
    </div>
  );
}
