import { useState } from 'react';
import api from '../services/api.jsx';
import { IconX } from '@tabler/icons-react';

const PHASE_NAMES = [
  'Briefing', 'Referências', 'Identidade', 'Wireframe',
  'Design', 'Código', 'Testes', 'Deploy',
];

const ICONS = [
  { value: 'ti-shopping-bag', label: 'loja' },
  { value: 'ti-hanger', label: 'moda' },
  { value: 'ti-basket', label: 'mercado' },
  { value: 'ti-device-laptop', label: 'sistema' },
  { value: 'ti-building', label: 'empresa' },
  { value: 'ti-users', label: 'crm' },
];

export default function NewProjectModal({ onClose, onCreated }) {
  const [mode, setMode] = useState('novo');
  const [form, setForm] = useState({
    nome: '', tipo: '', complexidade: '', cliente: '', descricao: '', icone: 'ti-device-laptop',
  });
  const [fasesConcluidasAte, setFasesConcluidasAte] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post('/api/projects', {
        ...form,
        fasesConcluidasAte: mode === 'importar' ? fasesConcluidasAte : 0,
      });
      onCreated();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar projeto.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black opacity-40" onClick={onClose} />
      <div className="relative bg-surface border border-border rounded-card shadow-lg w-full max-w-lg max-h-[90vh] flex flex-col z-10">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-medium text-dark">novo projeto</h2>
          <button onClick={onClose} className="text-faint hover:text-dark transition-colors">
            <IconX size={18} />
          </button>
        </div>

        <div className="flex border-b border-border">
          {['novo', 'importar'].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2.5 text-sm transition-colors ${
                mode === m ? 'text-terra border-b-2 border-terra font-medium' : 'text-muted hover:text-dark'
              }`}
            >
              {m === 'novo' ? 'projeto novo' : 'importar existente'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-muted mb-1">nome *</label>
              <input required value={form.nome} onChange={set('nome')} className="input-base" placeholder="ex: RM Modas" />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">cliente</label>
              <input value={form.cliente} onChange={set('cliente')} className="input-base" placeholder="ex: Família Mamede" />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">tipo</label>
              <input value={form.tipo} onChange={set('tipo')} className="input-base" placeholder="ex: CRM, Estoque..." />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">complexidade</label>
              <select value={form.complexidade} onChange={set('complexidade')} className="input-base">
                <option value="">selecione</option>
                <option value="baixa">baixa</option>
                <option value="média">média</option>
                <option value="alta">alta</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">ícone</label>
              <select value={form.icone} onChange={set('icone')} className="input-base">
                {ICONS.map((ic) => (
                  <option key={ic.value} value={ic.value}>{ic.label} ({ic.value})</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-muted mb-1">descrição *</label>
              <textarea required value={form.descricao} onChange={set('descricao')} rows={2} className="input-base resize-none" placeholder="descreva o projeto brevemente..." />
            </div>
          </div>

          {mode === 'importar' && (
            <div>
              <label className="block text-xs text-muted mb-2">fases já concluídas</label>
              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setFasesConcluidasAte(0)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                    fasesConcluidasAte === 0
                      ? 'bg-terra text-white border-terra'
                      : 'border-border text-muted hover:border-terra'
                  }`}
                >
                  nenhuma
                </button>
                {PHASE_NAMES.map((name, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setFasesConcluidasAte(i + 1)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                      fasesConcluidasAte >= i + 1
                        ? 'bg-terra text-white border-terra'
                        : 'border-border text-muted hover:border-terra'
                    }`}
                  >
                    {i + 1}. {name}
                  </button>
                ))}
              </div>
              {fasesConcluidasAte > 0 && (
                <p className="text-xs text-faint mt-2">
                  Fases 1 a {fasesConcluidasAte} serão marcadas como concluídas.
                </p>
              )}
            </div>
          )}

          {error && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-btn px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1" disabled={saving}>
              cancelar
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving ? 'criando...' : 'criar projeto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
