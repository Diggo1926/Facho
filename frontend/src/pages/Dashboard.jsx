import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.jsx';
import ProjectCard from '../components/ProjectCard.jsx';
import NewProjectModal from './NewProjectModal.jsx';
import {
  IconLoader2, IconPalette, IconShieldLock, IconServer, IconCode, IconMessageBolt,
} from '@tabler/icons-react';

const CATS = ['design', 'seguranca', 'infraestrutura', 'codigo', 'prompts'];
const CAT_ICON_COMPONENTS = {
  design: IconPalette,
  seguranca: IconShieldLock,
  infraestrutura: IconServer,
  codigo: IconCode,
  prompts: IconMessageBolt,
};

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [refCounts, setRefCounts] = useState({});
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    try {
      const [projRes, refRes] = await Promise.all([
        api.get('/api/projects'),
        api.get('/api/references'),
      ]);
      setProjects(projRes.data);

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
          className="grid gap-3"
          style={{
            gridTemplateColumns: activeProject
              ? `1.4fr ${otherProjects.slice(0, 2).map(() => '1fr').join(' ')} 0.8fr`
              : 'repeat(4, 1fr)',
          }}
        >
          {activeProject && (
            <ProjectCard project={activeProject} isActive />
          )}
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
        <div className="grid grid-cols-5 gap-3">
          {CATS.map((cat) => {
            const CatIcon = CAT_ICON_COMPONENTS[cat];
            return (
              <button
                key={cat}
                onClick={() => navigate(`/biblioteca/${cat}`)}
                className="card hover:shadow-sm transition-shadow text-left group"
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

      {showNew && (
        <NewProjectModal
          onClose={() => setShowNew(false)}
          onCreated={() => { setShowNew(false); load(); }}
        />
      )}
    </div>
  );
}
