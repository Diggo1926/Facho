import { useState, useRef, useCallback } from 'react';
import api from '../services/api.jsx';
import { IconBookmark, IconLoader2, IconCheck } from '@tabler/icons-react';

function ColorSwatch({ hex, label }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="w-10 h-10 rounded-full border border-border shadow-sm"
        style={{ backgroundColor: hex }}
        title={hex}
      />
      <span className="text-[10px] text-muted text-center leading-tight">{label}</span>
      <span className="text-[10px] text-faint font-mono">{hex}</span>
    </div>
  );
}

function TypographyPreview({ tipografia }) {
  const { fonte, pesos = [] } = tipografia;
  return (
    <div className="space-y-3">
      <p className="text-5xl font-medium text-dark" style={{ fontFamily: fonte }}>
        Aa
      </p>
      <p className="text-xs text-muted tracking-widest" style={{ fontFamily: fonte }}>
        ABCDEFGHIJKLMNOPQRSTUVWXYZ abcdefghijklmnopqrstuvwxyz 0123456789
      </p>
      <div className="flex gap-2 flex-wrap">
        {pesos.map((p) => (
          <span
            key={p}
            className="text-xs px-2 py-0.5 border border-border rounded-full text-muted"
          >
            {p}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function PhaseView({ project, phase, onPhaseUpdated, onConclude }) {
  const [notas, setNotas] = useState(phase?.notas || '');
  const [saving, setSaving] = useState(false);
  const [concluding, setConcluding] = useState(false);
  const debounceRef = useRef(null);

  const saveNotas = useCallback(
    async (value) => {
      setSaving(true);
      try {
        await api.patch(`/api/phases/${project.id}/${phase.numero}`, { notas: value });
        if (onPhaseUpdated) onPhaseUpdated();
      } finally {
        setSaving(false);
      }
    },
    [project.id, phase?.numero, onPhaseUpdated]
  );

  function handleNotasChange(e) {
    const val = e.target.value;
    setNotas(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => saveNotas(val), 1000);
  }

  async function handleConclude() {
    setConcluding(true);
    try {
      await api.post(`/api/phases/${project.id}/${phase.numero}/conclude`);
      if (onConclude) onConclude();
    } finally {
      setConcluding(false);
    }
  }

  if (!phase) return null;

  const prevPhase = project.phases?.find((p) => p.numero === phase.numero - 1);
  const canConclude = phase.numero === 1 || prevPhase?.status === 'concluida';
  const isAlreadyConcluded = phase.status === 'concluida';

  const paleta = (() => {
    const p = phase.paleta;
    if (!p || typeof p !== 'object') return [];
    if (Array.isArray(p.cores)) return p.cores;
    const labels = { primaria: 'Primária', secundaria: 'Secundária', acento: 'Acento', texto: 'Texto' };
    return Object.entries(p)
      .filter(([, v]) => typeof v === 'string' && v.startsWith('#'))
      .map(([k, v]) => ({ hex: v, label: labels[k] || k }));
  })();
  const tipografia = phase.tipografia;
  const vinculadas = project.references?.filter(
    (pr) => pr.phaseNumero === phase.numero || pr.phaseNumero === null
  ) || [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="card">
          <p className="text-xs font-medium text-muted mb-3">paleta de cores</p>
          {paleta.length > 0 ? (
            <div className="flex gap-4 flex-wrap">
              {paleta.map((c, i) => (
                <ColorSwatch key={i} hex={c.hex} label={c.label} />
              ))}
            </div>
          ) : (
            <p className="text-xs text-faint">paleta ainda não definida</p>
          )}
        </div>

        <div className="card">
          <p className="text-xs font-medium text-muted mb-3">tipografia</p>
          {tipografia ? (
            <TypographyPreview tipografia={tipografia} />
          ) : (
            <p className="text-xs text-faint">tipografia ainda não definida</p>
          )}
        </div>

        <div className="card">
          <p className="text-xs font-medium text-muted mb-3">referências vinculadas</p>
          <div className="flex flex-wrap gap-2">
            {vinculadas.length > 0 ? (
              vinculadas.map((pr) => (
                <span
                  key={pr.id}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 bg-cream border border-border rounded-full text-muted"
                >
                  <IconBookmark size={12} className="text-caramel" />
                  {pr.reference?.nome}
                </span>
              ))
            ) : (
              <p className="text-xs text-faint">nenhuma referência vinculada</p>
            )}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-muted">notas da fase</p>
            {saving && (
              <span className="text-[10px] text-faint flex items-center gap-1">
                <IconLoader2 size={12} className="animate-spin" />
                salvando
              </span>
            )}
          </div>
          <textarea
            value={notas}
            onChange={handleNotasChange}
            rows={5}
            disabled={isAlreadyConcluded}
            className="input-base resize-none text-xs leading-relaxed disabled:opacity-60 disabled:cursor-not-allowed"
            placeholder="anotações, decisões, observações desta fase..."
          />
        </div>
      </div>

      {!isAlreadyConcluded && (
        <div className="flex justify-end pt-2">
          <button
            onClick={handleConclude}
            disabled={!canConclude || concluding}
            className={`flex items-center gap-2 px-5 py-2 rounded-btn text-sm font-medium transition-colors ${
              canConclude
                ? 'bg-terra text-white hover:bg-[#6B3D2E]'
                : 'bg-border text-faint cursor-not-allowed'
            }`}
          >
            <IconCheck size={16} />
            {concluding ? 'concluindo...' : 'marcar como concluída'}
          </button>
        </div>
      )}
    </div>
  );
}
