import { useState, useEffect } from 'react';
import api from '../services/api.jsx';

export default function ContextExporter({ projectId, open, onClose }) {
  const [context, setContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open && projectId) {
      setLoading(true);
      api
        .get(`/api/projects/${projectId}/context`)
        .then(({ data }) => setContext(data.context))
        .catch(() => setContext('Erro ao gerar contexto.'))
        .finally(() => setLoading(false));
    }
  }, [open, projectId]);

  async function handleCopy() {
    await navigator.clipboard.writeText(context);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black opacity-40" onClick={onClose} />
      <div className="relative bg-surface border border-border rounded-card shadow-lg w-full max-w-xl max-h-[80vh] flex flex-col z-10">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-medium text-dark">contexto para o Claude</h2>
          <button onClick={onClose} className="text-faint hover:text-dark transition-colors">
            <i className="ti-x text-base" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-faint">
              <i className="ti-loader-2 animate-spin text-xl" />
            </div>
          ) : (
            <pre className="text-xs text-dark font-mono whitespace-pre-wrap leading-relaxed bg-cream p-4 rounded-btn border border-border">
              {context}
            </pre>
          )}
        </div>

        <div className="px-5 py-4 border-t border-border">
          <button
            onClick={handleCopy}
            disabled={loading || !context}
            className={`btn-primary w-full flex items-center justify-center gap-2 ${
              copied ? 'bg-[#4A6A1F]' : ''
            }`}
          >
            <i className={`text-sm ${copied ? 'ti-check' : 'ti-copy'}`} />
            {copied ? '✓ copiado' : 'copiar'}
          </button>
        </div>
      </div>
    </div>
  );
}
