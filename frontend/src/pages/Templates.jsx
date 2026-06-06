import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.jsx';
import { IconLoader2, IconTemplate, IconTrash, IconX, IconPlus } from '@tabler/icons-react';

const COMPLEXIDADE_LABEL = { baixa: 'baixa', media: 'média', alta: 'alta' };
const COMPLEXIDADE_COLOR = {
  baixa: 'bg-[#E8F0DC] text-[#4A6A1F]',
  media: 'bg-[#F0E8DC] text-[#8B5A2B]',
  alta: 'bg-[#F0DCDC] text-[#8B2B2B]',
};

const DEFAULTS = ['loja-moda_default', 'crm_default', 'landing-page_default', 'financeiro_default'];

export default function Templates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(null); // template selecionado para usar
  const [nome, setNome] = useState('');
  const [cliente, setCliente] = useState('');
  const [creating, setCreating] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get('/api/templates');
      setTemplates(data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  async function usarTemplate() {
    if (!nome.trim()) return;
    setCreating(true);
    try {
      const { data } = await api.post(`/api/templates/${showModal.id}/use`, {
        nome: nome.trim(),
        cliente: cliente.trim() || undefined,
      });
      navigate(`/projeto/${data.id}`);
    } catch {
      alert('Erro ao criar projeto.');
      setCreating(false);
    }
  }

  async function deletarTemplate(id) {
    if (!confirm('Deletar este template?')) return;
    try {
      await api.delete(`/api/templates/${id}`);
      setTemplates(ts => ts.filter(t => t.id !== id));
    } catch {
      alert('Erro ao deletar template.');
    }
  }

  function abrirModal(t) {
    setShowModal(t);
    setNome('');
    setCliente('');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-faint">
        <IconLoader2 size={28} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-base font-medium text-dark">templates de projeto</h1>
        <p className="text-sm text-faint mt-1">
          Use templates para iniciar projetos com fases e stack pré-configuradas.
        </p>
      </div>

      {templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center border border-dashed border-border rounded-card">
          <IconTemplate size={40} className="text-border" />
          <p className="text-sm text-faint">nenhum template ainda</p>
          <p className="text-xs text-faint">salve um projeto existente como template para aparecer aqui</p>
        </div>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {templates.map((t) => {
            const isDefault = DEFAULTS.includes(t.id);
            const modulos = t.fase2?.modulos || [];
            return (
              <div
                key={t.id}
                className="bg-surface border border-border rounded-card p-5 flex flex-col gap-3 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-medium text-dark">{t.nome}</h3>
                      {isDefault && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-cream border border-border text-faint font-medium">
                          padrão
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-faint mt-0.5">{t.tipo}</p>
                  </div>
                  {t.complexidade && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${COMPLEXIDADE_COLOR[t.complexidade] || 'bg-cream text-faint'}`}>
                      {COMPLEXIDADE_LABEL[t.complexidade] || t.complexidade}
                    </span>
                  )}
                </div>

                {t.descricao && (
                  <p className="text-xs text-muted line-clamp-2">{t.descricao}</p>
                )}

                {modulos.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {modulos.slice(0, 4).map((m, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 bg-cream border border-border rounded text-faint">
                        {m.nome}
                      </span>
                    ))}
                    {modulos.length > 4 && (
                      <span className="text-[10px] px-2 py-0.5 text-faint">+{modulos.length - 4}</span>
                    )}
                  </div>
                )}

                <div className="flex gap-2 mt-auto pt-1">
                  <button
                    onClick={() => abrirModal(t)}
                    className="btn-primary text-xs flex-1 flex items-center justify-center gap-1.5"
                  >
                    <IconPlus size={13} /> usar template
                  </button>
                  {!isDefault && (
                    <button
                      onClick={() => deletarTemplate(t.id)}
                      className="btn-secondary text-xs px-3"
                    >
                      <IconTrash size={13} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black opacity-40" onClick={() => setShowModal(null)} />
          <div className="relative bg-surface border border-border rounded-card shadow-lg w-full max-w-sm z-10 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-medium text-dark">novo projeto</h2>
                <p className="text-xs text-faint mt-0.5">a partir de "{showModal.nome}"</p>
              </div>
              <button onClick={() => setShowModal(null)} className="text-faint hover:text-dark">
                <IconX size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-faint block mb-1">nome do projeto *</label>
                <input
                  type="text"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && usarTemplate()}
                  placeholder="Ex: RM Modas 2.0"
                  className="w-full text-sm bg-cream border border-border rounded-btn px-3 py-2 text-dark placeholder:text-faint focus:outline-none focus:ring-1 focus:ring-terra"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs text-faint block mb-1">cliente</label>
                <input
                  type="text"
                  value={cliente}
                  onChange={e => setCliente(e.target.value)}
                  placeholder="Ex: Família Mamede"
                  className="w-full text-sm bg-cream border border-border rounded-btn px-3 py-2 text-dark placeholder:text-faint focus:outline-none focus:ring-1 focus:ring-terra"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={usarTemplate}
                disabled={creating || !nome.trim()}
                className="btn-primary text-sm flex-1"
              >
                {creating ? 'criando...' : 'criar projeto'}
              </button>
              <button onClick={() => setShowModal(null)} className="btn-secondary text-sm">
                cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
