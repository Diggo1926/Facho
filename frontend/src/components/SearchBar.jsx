import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.jsx';
import { IconSearch, IconLoader2, IconFolders, IconBookmark } from '@tabler/icons-react';

const CAT_COLORS = {
  design: 'bg-[#F0E8DC] text-[#8B5A2B]',
  seguranca: 'bg-[#DCE8F0] text-[#2B5A8B]',
  infraestrutura: 'bg-[#DCF0E8] text-[#2B8B5A]',
  codigo: 'bg-[#E8DCF0] text-[#5A2B8B]',
  prompts: 'bg-[#F0DCE8] text-[#8B2B5A]',
};

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const timer = useRef(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const [projRes, refRes] = await Promise.all([
          api.get('/api/projects'),
          api.get(`/api/references/search?q=${encodeURIComponent(query)}`),
        ]);
        const filteredProjects = projRes.data.filter((p) =>
          p.nome.toLowerCase().includes(query.toLowerCase())
        );
        setResults({ projects: filteredProjects, references: refRes.data });
      } catch {
        setResults(null);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, [query]);

  useEffect(() => {
    function onClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setQuery('');
        setResults(null);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const hasResults =
    results && (results.projects.length > 0 || results.references.length > 0);

  return (
    <div ref={containerRef} className="relative w-full max-w-lg">
      <div className="relative">
        <IconSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
        <input
          type="text"
          placeholder="buscar projetos e referências..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-btn bg-surface focus:outline-none focus:border-terra transition-colors"
        />
        {loading && (
          <IconLoader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-faint animate-spin" />
        )}
      </div>

      {query && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-surface border border-border rounded-card shadow-sm z-50 max-h-80 overflow-y-auto">
          {!hasResults && !loading && (
            <p className="px-4 py-3 text-sm text-faint">nenhum resultado encontrado</p>
          )}

          {results?.projects.length > 0 && (
            <div>
              <p className="px-4 pt-3 pb-1 text-[10px] font-medium text-faint uppercase tracking-widest">
                Projetos
              </p>
              {results.projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    navigate(`/projeto/${p.id}`);
                    setQuery('');
                    setResults(null);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-cream text-left transition-colors"
                >
                  <IconFolders size={16} className="text-terra shrink-0" />
                  <span className="text-sm text-dark">{p.nome}</span>
                  {p.cliente && (
                    <span className="text-xs text-faint ml-auto">{p.cliente}</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {results?.references.length > 0 && (
            <div>
              <p className="px-4 pt-3 pb-1 text-[10px] font-medium text-faint uppercase tracking-widest">
                Referências
              </p>
              {results.references.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
                    navigate(`/biblioteca/${r.categoria}`);
                    setQuery('');
                    setResults(null);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-cream text-left transition-colors"
                >
                  <IconBookmark size={16} className="text-caramel shrink-0" />
                  <span className="text-sm text-dark flex-1">{r.nome}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      CAT_COLORS[r.categoria] || 'bg-[#EDE4D8] text-muted'
                    }`}
                  >
                    {r.subcategoria || r.categoria}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
