import { useEffect, useState } from 'react';
import api from '../services/api.jsx';
import { IconCheck, IconLoader2 } from '@tabler/icons-react';

export default function Preferencias() {
  const [form, setForm] = useState({
    stackFavorita: '',
    padroesCodigo: '',
    observacoesFixas: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/api/preferences').then(({ data }) => {
      setForm({
        stackFavorita: data.stackFavorita || '',
        padroesCodigo: data.padroesCodigo || '',
        observacoesFixas: data.observacoesFixas || '',
      });
      setLoading(false);
    });
  }, []);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/api/preferences', form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-faint">
        <IconLoader2 size={28} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-base font-medium text-dark">preferências</h1>
        <p className="text-sm text-faint mt-0.5">
          estas informações são incluídas automaticamente no contexto exportado para o Claude
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-dark mb-1">stack favorita</label>
          <p className="text-xs text-faint mb-2">
            tecnologias que você usa na maioria dos projetos
          </p>
          <textarea
            value={form.stackFavorita}
            onChange={set('stackFavorita')}
            rows={3}
            className="input-base resize-none"
            placeholder="ex: React + Vite + Tailwind (frontend), Node.js + Express + Prisma (backend), PostgreSQL (banco)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-dark mb-1">padrões de código</label>
          <p className="text-xs text-faint mb-2">
            convenções e padrões que você segue nos seus projetos
          </p>
          <textarea
            value={form.padroesCodigo}
            onChange={set('padroesCodigo')}
            rows={4}
            className="input-base resize-none"
            placeholder="ex: ESModules (import/export), arrow functions, async/await, nomes em português para variáveis de negócio..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-dark mb-1">observações fixas</label>
          <p className="text-xs text-faint mb-2">
            instruções permanentes para o Claude — sempre incluídas em todos os contextos
          </p>
          <textarea
            value={form.observacoesFixas}
            onChange={set('observacoesFixas')}
            rows={4}
            className="input-base resize-none"
            placeholder="ex: Sempre responda em português. Prefira soluções simples e diretas. Não adicione comentários desnecessários..."
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className={`btn-primary flex items-center gap-2 ${saved ? 'bg-[#4A6A1F]' : ''}`}
        >
          {saved ? (
            <>
              <IconCheck size={16} />
              salvo!
            </>
          ) : saving ? (
            <>
              <IconLoader2 size={16} className="animate-spin" />
              salvando...
            </>
          ) : (
            'salvar preferências'
          )}
        </button>
      </form>
    </div>
  );
}
