import { useEffect, useState } from 'react';
import api from '../services/api.jsx';
import { IconX, IconLoader2, IconBookmark } from '@tabler/icons-react';

export default function LinkReferenceModal({ project, onClose, onLinked }) {
  const [references, setReferences] = useState([]);
  const [selected, setSelected] = useState(null);
  const [phaseNumero, setPhaseNumero] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const linkedIds = new Set(project.references?.map((pr) => pr.referenceId) || []);

  useEffect(() => {
    api.get('/api/references').then(({ data }) => {
      setReferences(data);
      setLoading(false);
    });
  }, []);

  async function handleLink() {
    if (!selected) return;
    setSaving(true);
    try {
      await api.post(`/api/references/${selected}/link/${project.id}`, {
        phaseNumero: phaseNumero ? parseInt(phaseNumero) : undefined,
      });
      onLinked();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black opacity-40" onClick={onClose} />
      <div className="relative bg-surface border border-border rounded-card shadow-lg w-full max-w-md max-h-[80vh] flex flex-col z-10">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-medium text-dark">vincular referência</h2>
          <button onClick={onClose} className="text-faint hover:text-dark transition-colors">
            <IconX size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {loading ? (
            <div className="flex justify-center py-8 text-faint">
              <IconLoader2 size={24} className="animate-spin" />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs text-muted mb-2">selecione a referência</label>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {references.map((ref) => {
                    const isLinked = linkedIds.has(ref.id);
                    return (
                      <button
                        key={ref.id}
                        disabled={isLinked}
                        onClick={() => setSelected(ref.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-btn text-left transition-colors ${
                          selected === ref.id
                            ? 'bg-terra text-white'
                            : isLinked
                            ? 'opacity-40 cursor-not-allowed bg-cream'
                            : 'hover:bg-cream border border-border'
                        }`}
                      >
                        <IconBookmark
                          size={16}
                          className={selected === ref.id ? 'text-white' : 'text-caramel'}
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm truncate block">{ref.nome}</span>
                          <span className={`text-[10px] ${selected === ref.id ? 'text-white/70' : 'text-faint'}`}>
                            {ref.subcategoria || ref.categoria}
                            {isLinked && ' · já vinculada'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs text-muted mb-1">fase (opcional)</label>
                <select value={phaseNumero} onChange={(e) => setPhaseNumero(e.target.value)} className="input-base">
                  <option value="">todas as fases</option>
                  {project.phases?.map((p) => (
                    <option key={p.numero} value={p.numero}>
                      {p.numero}. {p.nome}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>

        <div className="px-5 py-4 border-t border-border flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1" disabled={saving}>
            cancelar
          </button>
          <button
            onClick={handleLink}
            className="btn-primary flex-1"
            disabled={!selected || saving}
          >
            {saving ? 'vinculando...' : 'vincular'}
          </button>
        </div>
      </div>
    </div>
  );
}
