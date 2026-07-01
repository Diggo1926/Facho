import { useEffect, useState, useCallback } from 'react';
import api from '../services/api.jsx';
import {
  IconPlus, IconLoader2, IconX, IconPencil, IconTrash, IconAlertTriangle,
  IconFileText, IconCheck,
} from '@tabler/icons-react';

const TIPOS = [
  { value: 'desenvolvimento',    label: 'Desenvolvimento de Software' },
  { value: 'licenca_manutencao', label: 'Licença e Manutenção' },
  { value: 'nda',                label: 'NDA (Sigilo)' },
  { value: 'outro',              label: 'Outro' },
];

const TIPO_FIELD_TYPES = ['texto', 'textarea', 'data', 'numero'];

const PLACEHOLDER_INFO = `Use {{chave}} para inserir campos dinâmicos no corpo do contrato.
Ex: "O contratante {{nome_cliente}}, portador do CPF {{cpf_cliente}}..."`;

function CampoEditor({ campos, onChange, disabled }) {
  function add() {
    onChange([...campos, { chave: '', rotulo: '', tipo: 'texto', placeholder: '' }]);
  }

  function update(i, field, value) {
    const next = campos.map((c, j) => j === i ? { ...c, [field]: value } : c);
    onChange(next);
  }

  function remove(i) {
    onChange(campos.filter((_, j) => j !== i));
  }

  return (
    <div className="space-y-2">
      {campos.map((campo, i) => (
        <div key={i} className="flex items-center gap-2 flex-wrap">
          <input
            value={campo.chave}
            onChange={e => update(i, 'chave', e.target.value.replace(/\s/g, '_').toLowerCase())}
            placeholder="chave (sem espaços)"
            disabled={disabled}
            className="input-base text-xs w-32 py-1.5 font-mono"
          />
          <input
            value={campo.rotulo}
            onChange={e => update(i, 'rotulo', e.target.value)}
            placeholder="rótulo visível"
            disabled={disabled}
            className="input-base text-xs flex-1 min-w-[120px] py-1.5"
          />
          <select
            value={campo.tipo || 'texto'}
            onChange={e => update(i, 'tipo', e.target.value)}
            disabled={disabled}
            className="input-base text-xs py-1.5 w-24"
          >
            {TIPO_FIELD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          {!disabled && (
            <button onClick={() => remove(i)} className="text-faint hover:text-red-400 shrink-0">
              <IconTrash size={13} />
            </button>
          )}
        </div>
      ))}
      {!disabled && (
        <button
          onClick={add}
          className="flex items-center gap-1 text-xs text-terra hover:underline"
        >
          <IconPlus size={12} /> adicionar campo
        </button>
      )}
    </div>
  );
}

function TemplateModal({ template, onClose, onSaved }) {
  const isEdit = !!template;
  const [nome, setNome] = useState(template?.nome || '');
  const [tipo, setTipo] = useState(template?.tipo || 'desenvolvimento');
  const [corpo, setCorpo] = useState(template?.corpo || '');
  const [campos, setCampos] = useState(template?.campos || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!nome.trim()) { setError('Nome obrigatório.'); return; }
    if (!corpo.trim()) { setError('Corpo do contrato obrigatório.'); return; }
    for (const c of campos) {
      if (!c.chave.trim() || !c.rotulo.trim()) {
        setError('Todos os campos precisam de chave e rótulo.'); return;
      }
    }
    setSaving(true);
    setError('');
    try {
      if (isEdit) {
        await api.put(`/api/contract-templates/${template.id}`, { nome, tipo, corpo, campos });
      } else {
        await api.post('/api/contract-templates', { nome, tipo, corpo, campos });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao salvar modelo.');
    } finally {
      setSaving(false);
    }
  }

  // Extrair placeholders do corpo para sugerir campos
  const placeholdersNoCorpo = [...new Set([...corpo.matchAll(/\{\{(\w+)\}\}/g)].map(m => m[1]))];
  const camposExistentes = campos.map(c => c.chave);
  const sugestoes = placeholdersNoCorpo.filter(p => !camposExistentes.includes(p));

  return (
    <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center md:p-6">
      <div className="absolute inset-0 bg-black/40 hidden md:block" onClick={onClose} />
      <div className="relative bg-surface w-full h-full md:h-auto md:max-w-2xl md:rounded-card md:border border-border shadow-lg z-10 flex flex-col max-h-screen">
        <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
          <h2 className="text-sm font-medium text-dark">
            {isEdit ? 'editar modelo' : 'novo modelo de contrato'}
          </h2>
          <button onClick={onClose} className="text-faint hover:text-dark">
            <IconX size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">nome do modelo</label>
              <input
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="ex: Contrato de Desenvolvimento"
                className="w-full text-sm bg-cream border border-border rounded-btn px-3 py-2 text-dark placeholder:text-faint focus:outline-none focus:ring-1 focus:ring-terra"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">tipo</label>
              <select
                value={tipo}
                onChange={e => setTipo(e.target.value)}
                className="w-full text-sm bg-cream border border-border rounded-btn px-3 py-2 text-dark focus:outline-none focus:ring-1 focus:ring-terra"
              >
                {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-muted">corpo do contrato</label>
              <span className="text-[10px] text-faint">use {'{{chave}}'} para campos dinâmicos</span>
            </div>
            <textarea
              value={corpo}
              onChange={e => setCorpo(e.target.value)}
              rows={14}
              placeholder={PLACEHOLDER_INFO}
              className="w-full text-sm bg-cream border border-border rounded-btn px-3 py-2 text-dark placeholder:text-faint focus:outline-none focus:ring-1 focus:ring-terra resize-none font-mono leading-relaxed"
            />
          </div>

          {sugestoes.length > 0 && (
            <div className="bg-[#F5EDE5] border border-[#E8D5C5] rounded-btn p-3 space-y-2">
              <p className="text-xs text-[#7A4A3A] font-medium">
                Placeholders detectados — adicione-os como campos:
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {sugestoes.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setCampos(prev => [...prev, { chave: s, rotulo: s.replace(/_/g, ' '), tipo: 'texto', placeholder: '' }])}
                    className="text-[10px] px-2 py-1 bg-white border border-[#E8D5C5] rounded text-[#7A4A3A] hover:bg-[#EDE4D8] transition-colors font-mono"
                  >
                    + {'{{' + s + '}}'}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-muted mb-2">campos de preenchimento</label>
            <CampoEditor campos={campos} onChange={setCampos} />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 border border-red-200 rounded-btn px-3 py-2">
              <IconAlertTriangle size={13} /> {error}
            </div>
          )}
        </form>

        <div className="p-5 border-t border-border flex gap-2 shrink-0">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="btn-primary flex-1 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? <IconLoader2 size={14} className="animate-spin" /> : <IconCheck size={14} />}
            {saving ? 'salvando...' : isEdit ? 'salvar alterações' : 'criar modelo'}
          </button>
          <button onClick={onClose} className="btn-secondary text-sm">cancelar</button>
        </div>
      </div>
    </div>
  );
}

export default function ContractTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/api/contract-templates');
      setTemplates(data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/api/contract-templates/${deleteTarget.id}`);
      setDeleteTarget(null);
      load();
    } catch {
      alert('Erro ao excluir modelo.');
    } finally {
      setDeleting(false);
    }
  }

  const TIPO_LABELS = Object.fromEntries(TIPOS.map(t => [t.value, t.label]));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-faint">
        <IconLoader2 size={28} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-medium text-dark">modelos de contrato</h1>
          <p className="text-xs text-faint mt-0.5">modelos reutilizáveis para gerar contratos nos projetos</p>
        </div>
        <button
          onClick={() => { setEditTarget(null); setShowModal(true); }}
          className="btn-primary flex items-center gap-1.5"
        >
          <IconPlus size={15} /> novo modelo
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center border border-dashed border-border rounded-card">
          <IconFileText size={44} className="text-border" />
          <div>
            <p className="text-sm text-faint">nenhum modelo criado ainda</p>
            <p className="text-xs text-faint mt-1">crie um modelo com placeholders e reutilize em vários projetos</p>
          </div>
          <button
            onClick={() => { setEditTarget(null); setShowModal(true); }}
            className="btn-primary text-sm"
          >
            criar primeiro modelo
          </button>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {templates.map(t => (
            <div key={t.id} className="bg-surface border border-border rounded-card p-4 space-y-2 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-dark truncate">{t.nome}</p>
                  <p className="text-xs text-faint">
                    {TIPO_LABELS[t.tipo] || t.tipo} · v{t.versao}
                    {t.campos?.length > 0 && ` · ${t.campos.length} campo${t.campos.length > 1 ? 's' : ''}`}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => { setEditTarget(t); setShowModal(true); }}
                    className="p-1.5 rounded-btn text-faint hover:text-terra hover:bg-cream transition-colors"
                    title="editar"
                  >
                    <IconPencil size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(t)}
                    className="p-1.5 rounded-btn text-faint hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="excluir"
                  >
                    <IconTrash size={14} />
                  </button>
                </div>
              </div>

              {t.campos?.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                  {t.campos.slice(0, 5).map(c => (
                    <span key={c.chave} className="text-[10px] px-1.5 py-0.5 bg-cream border border-border rounded font-mono text-faint">
                      {'{{'}{c.chave}{'}}'}
                    </span>
                  ))}
                  {t.campos.length > 5 && (
                    <span className="text-[10px] text-faint">+{t.campos.length - 5}</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <TemplateModal
          template={editTarget}
          onClose={() => { setShowModal(false); setEditTarget(null); }}
          onSaved={load}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-surface border border-border rounded-card shadow-lg w-full max-w-sm z-10 p-5 space-y-4">
            <div className="flex items-start gap-3">
              <IconAlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-dark">excluir modelo</p>
                <p className="text-xs text-faint mt-1">
                  Excluir <strong className="text-dark">{deleteTarget.nome}</strong>?
                  Contratos já criados a partir deste modelo não serão afetados.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 rounded-btn text-sm font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? 'excluindo...' : 'excluir'}
              </button>
              <button onClick={() => setDeleteTarget(null)} className="btn-secondary text-sm">cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
