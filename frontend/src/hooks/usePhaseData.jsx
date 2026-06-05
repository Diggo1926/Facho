import { useState, useRef, useCallback } from 'react';
import api from '../services/api.jsx';

export function usePhaseData(project, phase, onPhaseUpdated) {
  const [data, setData] = useState(() => {
    if (!phase?.resultado || typeof phase.resultado !== 'object') return {};
    return phase.resultado;
  });
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef(null);

  const persist = useCallback(async (newData) => {
    setSaving(true);
    try {
      await api.patch(`/api/phases/${project.id}/${phase.numero}`, { resultado: newData });
      if (onPhaseUpdated) onPhaseUpdated();
    } finally {
      setSaving(false);
    }
  }, [project.id, phase?.numero, onPhaseUpdated]);

  const update = useCallback((field, value) => {
    setData(prev => {
      const next = { ...prev, [field]: value };
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => persist(next), 1000);
      return next;
    });
  }, [persist]);

  const updateFn = useCallback((updater) => {
    setData(prev => {
      const next = updater(prev);
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => persist(next), 1000);
      return next;
    });
  }, [persist]);

  return { data, update, updateFn, saving };
}
