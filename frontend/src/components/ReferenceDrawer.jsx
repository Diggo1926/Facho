import { useState, useEffect } from 'react';
import { IconX } from '@tabler/icons-react';

const CATEGORIAS = ['design', 'seguranca', 'infraestrutura', 'codigo', 'prompts'];

export default function ReferenceDrawer({ open, onClose, onSave, initial = null }) {
  const [form, setForm] = useState({
    nome: '',
    link: '',
    categoria: 'design',
    subcategoria: '',
    anotacoes: '',
    corFundo: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(
        initial
          ? {
              nome: initial.nome || '',
              link: initial.link || '',
              categoria: initial.categoria || 'design',
              subcategoria: initial.subcategoria || '',
              anotacoes: initial.anotacoes || '',
              corFundo: initial.corFundo || '',
            }
          : { nome: '', link: '', categoria: 'design', subcategoria: '', anotacoes: '', corFundo: '' }
      );
    }
  }, [open, initial]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div
        className={`fixed inset-0 bg-black z-40 transition-opacity duration-250 ${
          open ? 'opacity-40 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      <div
        className={`fixed top-0 right-0 h-full w-[300px] bg-surface border-l border-border z-50 flex flex-col shadow-lg transition-transform duration-[250ms] ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-medium text-dark">
            {initial ? 'editar referência' : 'nova referência'}
          </h2>
          <button onClick={onClose} className="text-faint hover:text-dark transition-colors">
            <IconX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          <div>
            <label className="block text-xs text-muted mb-1">nome *</label>
            <input
              required
              value={form.nome}
              onChange={set('nome')}
              className="input-base"
              placeholder="ex: Color Hunt"
            />
          </div>

          <div>
            <label className="block text-xs text-muted mb-1">link</label>
            <input
              type="url"
              value={form.link}
              onChange={set('link')}
              className="input-base"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-xs text-muted mb-2">categoria *</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIAS.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, categoria: cat }))}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    form.categoria === cat
                      ? 'bg-terra text-white'
                      : 'border border-border text-muted hover:border-terra hover:text-terra'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted mb-1">subcategoria</label>
            <input
              value={form.subcategoria}
              onChange={set('subcategoria')}
              className="input-base"
              placeholder="ex: tipografia, paletas..."
            />
          </div>

          <div>
            <label className="block text-xs text-muted mb-1">cor de fundo do preview</label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={form.corFundo || '#EDE4D8'}
                onChange={set('corFundo')}
                className="w-9 h-9 rounded cursor-pointer border border-border bg-surface p-0.5"
              />
              <input
                value={form.corFundo}
                onChange={set('corFundo')}
                className="input-base flex-1"
                placeholder="#EDE4D8"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted mb-1">anotações</label>
            <textarea
              value={form.anotacoes}
              onChange={set('anotacoes')}
              rows={3}
              className="input-base resize-none"
              placeholder="observações sobre esta referência..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
              disabled={saving}
            >
              cancelar
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving ? 'salvando...' : 'salvar'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
