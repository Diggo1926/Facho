import { useState } from 'react';
import { IconCheck, IconLoader2, IconCopy, IconX, IconPlus } from '@tabler/icons-react';
import api from '../../services/api.jsx';

export function PhaseCard({ title, children, className = '', action }) {
  return (
    <div className={`card ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-muted">{title}</p>
        {action}
      </div>
      {children}
    </div>
  );
}

export function SavingDot({ saving }) {
  if (!saving) return null;
  return (
    <span className="flex items-center gap-1 text-[10px] text-faint">
      <IconLoader2 size={10} className="animate-spin" />
      salvando
    </span>
  );
}

export function ConcludeButton({ phase, project, onConclude }) {
  const [concluding, setConcluding] = useState(false);
  const prevPhase = project.phases?.find(p => p.numero === phase.numero - 1);
  const canConclude = phase.numero === 1 || prevPhase?.status === 'concluida';

  if (phase.status === 'concluida') return null;

  async function handle() {
    setConcluding(true);
    try {
      await api.post(`/api/phases/${project.id}/${phase.numero}/conclude`);
      if (onConclude) onConclude();
    } finally {
      setConcluding(false);
    }
  }

  return (
    <div className="flex justify-end pt-2">
      <button
        onClick={handle}
        disabled={!canConclude || concluding}
        className={`flex items-center gap-2 px-5 py-2 rounded-btn text-sm font-medium transition-colors ${
          canConclude ? 'bg-terra text-white hover:bg-[#6B3D2E]' : 'bg-border text-faint cursor-not-allowed'
        }`}
      >
        <IconCheck size={16} />
        {concluding ? 'concluindo...' : 'marcar como concluída'}
      </button>
    </div>
  );
}

export function EditableList({ items = [], onChange, placeholder = 'adicionar...', disabled }) {
  const [input, setInput] = useState('');

  function add() {
    const v = input.trim();
    if (!v) return;
    onChange([...items, v]);
    setInput('');
  }

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-dark">
            <span className="text-faint mt-0.5">·</span>
            <span className="flex-1 leading-relaxed">{item}</span>
            {!disabled && (
              <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-faint hover:text-red-400 mt-0.5">
                <IconX size={12} />
              </button>
            )}
          </div>
        ))}
      </div>
      {!disabled && (
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && add()}
            className="input-base text-xs flex-1 py-1.5"
            placeholder={placeholder}
          />
          <button onClick={add} className="btn-secondary px-3 py-1.5 text-xs">
            <IconPlus size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

export function CopyButton({ text, className = '' }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <button onClick={copy} className={`text-faint hover:text-terra transition-colors ${className}`} title="copiar">
      {copied ? <IconCheck size={14} className="text-green-600" /> : <IconCopy size={14} />}
    </button>
  );
}

export function Chip({ label, active, onClick, color }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
        active
          ? color || 'bg-terra text-white'
          : 'border border-border text-muted hover:border-terra hover:text-terra'
      }`}
    >
      {label}
    </button>
  );
}

export function RiskBadge({ nivel }) {
  const map = {
    critico: 'bg-red-100 text-red-700',
    alto: 'bg-orange-100 text-orange-700',
    medio: 'bg-yellow-100 text-yellow-700',
    baixo: 'bg-green-100 text-green-600',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${map[nivel] || 'bg-border text-faint'}`}>
      {nivel || '—'}
    </span>
  );
}

export function StatusBadge({ status }) {
  const map = {
    pendente: 'bg-border text-faint',
    executado: 'bg-[#E8F0DC] text-[#4A6A1F]',
    passou: 'bg-[#E8F0DC] text-[#4A6A1F]',
    falhou: 'bg-red-100 text-red-600',
    erro: 'bg-red-100 text-red-600',
    feito: 'bg-[#E8F0DC] text-[#4A6A1F]',
    entregue: 'bg-[#E8F0DC] text-[#4A6A1F]',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${map[status] || 'bg-border text-faint'}`}>
      {status}
    </span>
  );
}
