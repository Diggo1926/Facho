import { useEffect, useState } from 'react';
import api from '../services/api.jsx';
import ProjectCard from '../components/ProjectCard.jsx';
import NewProjectModal from './NewProjectModal.jsx';
import { IconLoader2, IconPlus, IconFolders } from '@tabler/icons-react';

export default function Projetos() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get('/api/projects');
      setProjects(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-faint">
        <IconLoader2 size={28} className="animate-spin" />
      </div>
    );
  }

  const active = projects.find((p) => p.status === 'andamento');
  const others = projects.filter((p) => p.id !== active?.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-medium text-dark">projetos</h1>
          <p className="text-sm text-faint mt-0.5">{projects.length} projeto{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary flex items-center gap-2">
          <IconPlus size={16} />
          novo projeto
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-center gap-3">
          <IconFolders size={48} className="text-border" />
          <p className="text-sm text-faint">nenhum projeto ainda</p>
          <button onClick={() => setShowNew(true)} className="btn-primary">
            criar primeiro projeto
          </button>
        </div>
      ) : (
        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns: active
              ? `1.4fr ${Array(Math.min(others.length, 2)).fill('1fr').join(' ')} 0.8fr`
              : 'repeat(4, 1fr)',
          }}
        >
          {active && <ProjectCard project={active} isActive />}
          {others.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
          <ProjectCard isNew onCreate={() => setShowNew(true)} />
        </div>
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
