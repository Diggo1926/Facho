import { useEffect, useState } from 'react';
import api from '../services/api.jsx';
import ProjectCard from '../components/ProjectCard.jsx';
import NewProjectModal from './NewProjectModal.jsx';
import EditProjectModal from './EditProjectModal.jsx';
import { useIsMobile } from '../hooks/useIsMobile.js';
import { IconLoader2, IconPlus, IconFolders, IconAlertTriangle, IconX } from '@tabler/icons-react';

export default function Projetos() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [deletingProject, setDeletingProject] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const isMobile = useIsMobile();

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get('/api/projects');
      setProjects(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!deletingProject) return;
    setDeleting(true);
    try {
      await api.delete(`/api/projects/${deletingProject.id}`);
      setDeletingProject(null);
      load();
    } catch {
      alert('Erro ao excluir projeto.');
    } finally {
      setDeleting(false);
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
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-base font-medium text-dark">projetos</h1>
          <p className="text-sm text-faint mt-0.5">{projects.length} projeto{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary flex items-center justify-center gap-2 w-full md:w-auto">
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
          className={isMobile ? 'flex flex-col gap-3' : 'grid gap-3'}
          style={isMobile ? {} : {
            gridTemplateColumns: active
              ? `1.4fr ${Array(Math.min(others.length, 2)).fill('1fr').join(' ')} 0.8fr`
              : 'repeat(4, 1fr)',
          }}
        >
          {active && (
            <ProjectCard
              project={active}
              isActive
              onEdit={setEditingProject}
              onDelete={setDeletingProject}
            />
          )}
          {others.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              onEdit={setEditingProject}
              onDelete={setDeletingProject}
            />
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

      {editingProject && (
        <EditProjectModal
          project={editingProject}
          onClose={() => setEditingProject(null)}
          onSaved={() => { setEditingProject(null); load(); }}
        />
      )}

      {deletingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
          <div className="absolute inset-0 bg-black opacity-40" onClick={() => setDeletingProject(null)} />
          <div className="relative bg-surface border border-border rounded-card shadow-lg w-full max-w-sm z-10 p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <IconAlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-sm font-medium text-dark">excluir projeto</h2>
                  <p className="text-xs text-faint mt-1">
                    Tem certeza que deseja excluir <strong className="text-dark">{deletingProject.nome}</strong>?
                    Esta ação não pode ser desfeita — todas as fases e referências serão removidas.
                  </p>
                </div>
              </div>
              <button onClick={() => setDeletingProject(null)} className="text-faint hover:text-dark shrink-0">
                <IconX size={16} />
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 rounded-btn text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-60"
              >
                {deleting ? 'excluindo...' : 'excluir projeto'}
              </button>
              <button onClick={() => setDeletingProject(null)} className="btn-secondary text-sm">
                cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
