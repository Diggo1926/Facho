import { useState, useCallback } from 'react';
import api from '../services/api.jsx';

export function useProject() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/projects');
      setProjects(data);
      return data;
    } finally {
      setLoading(false);
    }
  }, []);

  const createProject = useCallback(async (payload) => {
    const { data } = await api.post('/api/projects', payload);
    setProjects((prev) => [data, ...prev]);
    return data;
  }, []);

  const updateProject = useCallback(async (id, payload) => {
    const { data } = await api.patch(`/api/projects/${id}`, payload);
    setProjects((prev) => prev.map((p) => (p.id === id ? data : p)));
    return data;
  }, []);

  const deleteProject = useCallback(async (id) => {
    await api.delete(`/api/projects/${id}`);
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }, []);

  return { projects, loading, fetchProjects, createProject, updateProject, deleteProject };
}
