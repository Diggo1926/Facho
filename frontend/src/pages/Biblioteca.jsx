import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.jsx';

const CATS = [
  { id: 'design', label: 'Design', icon: 'ti-palette' },
  { id: 'seguranca', label: 'Segurança', icon: 'ti-shield-lock' },
  { id: 'infraestrutura', label: 'Infraestrutura', icon: 'ti-server' },
  { id: 'codigo', label: 'Código', icon: 'ti-code' },
  { id: 'prompts', label: 'Prompts', icon: 'ti-message-bolt' },
];

export default function Biblioteca() {
  const [refs, setRefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/references').then(({ data }) => {
      setRefs(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-faint">
        <i className="ti-loader-2 animate-spin text-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-base font-medium text-dark">biblioteca</h1>
        <p className="text-sm text-faint mt-0.5">{refs.length} referência{refs.length !== 1 ? 's' : ''} no total</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {CATS.map((cat) => {
          const count = refs.filter((r) => r.categoria === cat.id).length;
          return (
            <button
              key={cat.id}
              onClick={() => navigate(`/biblioteca/${cat.id}`)}
              className="card text-left hover:shadow-sm transition-shadow group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-cream rounded-btn">
                  <i className={`${cat.icon} text-caramel text-lg`} />
                </div>
                <i className="ti-arrow-right text-faint text-sm group-hover:text-terra transition-colors" />
              </div>
              <p className="text-sm font-medium text-dark">{cat.label}</p>
              <p className="text-xs text-faint mt-0.5">
                {count} referência{count !== 1 ? 's' : ''}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
