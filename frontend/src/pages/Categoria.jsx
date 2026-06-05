import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api.jsx';
import ReferenceCard from '../components/ReferenceCard.jsx';
import ReferenceDrawer from '../components/ReferenceDrawer.jsx';
import { IconPlus, IconSearch, IconLoader2, IconBookmark } from '@tabler/icons-react';

const CAT_LABELS = {
  design: 'Design',
  seguranca: 'Segurança',
  infraestrutura: 'Infraestrutura',
  codigo: 'Código',
  prompts: 'Prompts',
};

export default function Categoria() {
  const { categoria } = useParams();
  const [refs, setRefs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [subcats, setSubcats] = useState([]);
  const [activeSubcat, setActiveSubcat] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRef, setEditingRef] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get(`/api/references?categoria=${categoria}`);
      setRefs(data);
      const subs = [...new Set(data.map((r) => r.subcategoria).filter(Boolean))];
      setSubcats(subs);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    setActiveSubcat(null);
    setSearch('');
  }, [categoria]); // eslint-disable-line

  useEffect(() => {
    let f = refs;
    if (activeSubcat) f = f.filter((r) => r.subcategoria === activeSubcat);
    if (search.trim()) {
      const q = search.toLowerCase();
      f = f.filter(
        (r) =>
          r.nome.toLowerCase().includes(q) ||
          r.anotacoes?.toLowerCase().includes(q)
      );
    }
    setFiltered(f);
  }, [refs, activeSubcat, search]);

  async function handleSave(form) {
    if (editingRef) {
      await api.patch(`/api/references/${editingRef.id}`, form);
    } else {
      await api.post('/api/references', { ...form, categoria });
    }
    load();
    setEditingRef(null);
  }

  async function handleDelete(id) {
    if (!confirm('Deletar esta referência?')) return;
    await api.delete(`/api/references/${id}`);
    load();
  }

  function openEdit(ref) {
    setEditingRef(ref);
    setDrawerOpen(true);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-medium text-dark">{CAT_LABELS[categoria] || categoria}</h1>
          <p className="text-sm text-faint mt-0.5">{refs.length} referência{refs.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setEditingRef(null); setDrawerOpen(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <IconPlus size={16} />
          adicionar
        </button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <IconSearch size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input
            type="text"
            placeholder="buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-4 py-1.5 text-sm border border-border rounded-btn bg-surface focus:outline-none focus:border-terra transition-colors w-48"
          />
        </div>

        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setActiveSubcat(null)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              !activeSubcat
                ? 'bg-terra text-white'
                : 'border border-border text-muted hover:border-terra hover:text-terra'
            }`}
          >
            todas
          </button>
          {subcats.map((sub) => (
            <button
              key={sub}
              onClick={() => setActiveSubcat(activeSubcat === sub ? null : sub)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                activeSubcat === sub
                  ? 'bg-terra text-white'
                  : 'border border-border text-muted hover:border-terra hover:text-terra'
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-faint">
          <IconLoader2 size={28} className="animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
          <IconBookmark size={48} className="text-border" />
          <p className="text-sm text-faint">nenhuma referência encontrada</p>
          <button
            onClick={() => { setEditingRef(null); setDrawerOpen(true); }}
            className="btn-primary"
          >
            adicionar primeira referência
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-3">
          {filtered.map((ref) => (
            <ReferenceCard
              key={ref.id}
              reference={ref}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <ReferenceDrawer
        open={drawerOpen}
        initial={editingRef}
        onClose={() => { setDrawerOpen(false); setEditingRef(null); }}
        onSave={handleSave}
      />
    </div>
  );
}
