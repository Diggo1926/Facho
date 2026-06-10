import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.jsx';
import ProjectCard from '../components/ProjectCard.jsx';
import NewProjectModal from './NewProjectModal.jsx';
import { useIsMobile } from '../hooks/useIsMobile.js';
import {
  IconLoader2, IconPalette, IconShieldLock, IconServer, IconCode, IconMessageBolt, IconExternalLink,
} from '@tabler/icons-react';

const CATS = ['design', 'seguranca', 'infraestrutura', 'codigo', 'prompts'];
const CAT_ICON_COMPONENTS = {
  design: IconPalette,
  seguranca: IconShieldLock,
  infraestrutura: IconServer,
  codigo: IconCode,
  prompts: IconMessageBolt,
};

function dailySeed() {
  const s = new Date().toDateString();
  return s.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
}

function seededShuffle(arr, seed) {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getMicrolinkUrl(link) {
  return `https://api.microlink.io/?url=${encodeURIComponent(link)}&screenshot=true&meta=false&embed=screenshot.url`;
}

function InspiracaoCard({ reference }) {
  const imgSrc = reference.screenshotUrl || (reference.link ? getMicrolinkUrl(reference.link) : null);
  return (
    <div className="bg-surface border border-border rounded-card overflow-hidden hover:shadow-md transition-shadow group">
      <div className="h-40 overflow-hidden relative bg-cream">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={reference.nome}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={e => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <div
          className={`${imgSrc ? 'hidden' : 'flex'} absolute inset-0 items-center justify-center`}
          style={{ backgroundColor: reference.corFundo || '#EDE4D8' }}
        >
          <span className="text-sm font-medium px-4 text-center text-dark">{reference.nome}</span>
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-dark">{reference.nome}</p>
            {reference.subcategoria && (
              <span className="text-[10px] text-faint">{reference.subcategoria}</span>
            )}
          </div>
          {reference.link && (
            <a href={reference.link} target="_blank" rel="noopener noreferrer" className="text-faint hover:text-terra opacity-0 group-hover:opacity-100 transition-opacity">
              <IconExternalLink size={14} />
            </a>
          )}
        </div>
        {reference.anotacoes && (
          <p className="text-[11px] text-faint mt-1.5 line-clamp-2">{reference.anotacoes}</p>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [refs, setRefs] = useState([]);
  const [refCounts, setRefCounts] = useState({});
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  async function load() {
    setLoading(true);
    try {
      const [projRes, refRes] = await Promise.all([
        api.get('/api/projects'),
        api.get('/api/references'),
      ]);
      setProjects(projRes.data);
      setRefs(refRes.data);

      const counts = {};
      for (const cat of CATS) {
        counts[cat] = refRes.data.filter((r) => r.categoria === cat).length;
      }
      setRefCounts(counts);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const activeProject = projects.find((p) => p.status === 'andamento');
  const otherProjects = projects.filter((p) => p.id !== activeProject?.id);

  const inspiracao = refs.length >= 3
    ? seededShuffle(refs, dailySeed()).slice(0, 3)
    : refs;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-faint">
        <IconLoader2 size={28} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-base font-medium text-dark mb-1">visão geral</h1>
        <p className="text-sm text-faint">
          {projects.length} projeto{projects.length !== 1 ? 's' : ''} · base de referências organizada
        </p>
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-medium text-muted uppercase tracking-widest">projetos em andamento</h2>
        </div>
        <div
          className={isMobile ? 'flex flex-col gap-3' : 'grid gap-3'}
          style={isMobile ? {} : {
            gridTemplateColumns: activeProject
              ? `1.4fr ${otherProjects.slice(0, 2).map(() => '1fr').join(' ')} 0.8fr`
              : 'repeat(4, 1fr)',
          }}
        >
          {activeProject && <ProjectCard project={activeProject} isActive />}
          {otherProjects.slice(0, activeProject ? 2 : 3).map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
          <ProjectCard isNew onCreate={() => setShowNew(true)} />
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-medium text-muted uppercase tracking-widest">biblioteca</h2>
        </div>
        {/* Scroll horizontal no mobile, grid 5 colunas no desktop */}
        <div className="flex gap-3 overflow-x-auto pb-2 scroll-mobile md:grid md:grid-cols-5 md:overflow-visible md:pb-0">
          {CATS.map((cat) => {
            const CatIcon = CAT_ICON_COMPONENTS[cat];
            return (
              <button
                key={cat}
                onClick={() => navigate(`/biblioteca/${cat}`)}
                className="card hover:shadow-sm transition-shadow text-left group shrink-0 min-w-[130px] md:min-w-0"
              >
                <CatIcon size={22} className="text-caramel mb-2" />
                <p className="text-sm font-medium text-dark capitalize">{cat}</p>
                <p className="text-xs text-faint mt-0.5">
                  {refCounts[cat] || 0} referência{refCounts[cat] !== 1 ? 's' : ''}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {inspiracao.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-xs font-medium text-muted uppercase tracking-widest">inspiração do dia</h2>
              <p className="text-[10px] text-faint mt-0.5">renova todo dia</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {inspiracao.map((ref) => (
              <InspiracaoCard key={ref.id} reference={ref} />
            ))}
          </div>
        </section>
      )}

      {showNew && (
        <NewProjectModal
          onClose={() => setShowNew(false)}
          onCreated={() => { setShowNew(false); load(); }}
        />
      )}
    </div>
  );
}
