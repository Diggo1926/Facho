import { usePhaseData } from '../../hooks/usePhaseData.jsx';
import { PhaseCard, SavingDot, ConcludeButton, Chip } from './shared.jsx';

const ESTILOS = ['minimalista', 'orgânico', 'moderno', 'elegante', 'robusto', 'vibrante'];

const PALETTE_KEYS = [
  { key: 'primaria', label: 'Primária' },
  { key: 'secundaria', label: 'Secundária' },
  { key: 'acento', label: 'Acento' },
  { key: 'texto', label: 'Texto' },
  { key: 'fundo', label: 'Fundo' },
];

function isLight(hex) {
  if (!hex || hex.length < 7) return true;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}

export default function Phase3Design({ project, phase, onPhaseUpdated, onConclude }) {
  const { data, update, updateFn, saving } = usePhaseData(project, phase, onPhaseUpdated);
  const disabled = phase.status === 'concluida';
  const paleta = data.paleta || {};
  const tipografia = data.tipografia || {};
  const estilos = data.estilos || [];
  const vinculadas = project.references?.filter(r => r.reference?.screenshotUrl || r.reference?.link) || [];

  function toggleEstilo(estilo) {
    if (disabled) return;
    const next = estilos.includes(estilo)
      ? estilos.filter(e => e !== estilo)
      : [...estilos, estilo];
    update('estilos', next);
  }

  function updatePaletaKey(key, value) {
    update('paleta', { ...paleta, [key]: value });
  }

  function updateTipo(key, value) {
    update('tipografia', { ...tipografia, [key]: value });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-faint">fase 3 — identidade visual</p>
        <SavingDot saving={saving} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <PhaseCard title="paleta de cores">
          <div className="space-y-3">
            {PALETTE_KEYS.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <div
                    className="w-9 h-9 rounded-full border border-border shadow-sm"
                    style={{ backgroundColor: paleta[key] || '#E0D8CC' }}
                  />
                  {!disabled && (
                    <input
                      type="color"
                      value={paleta[key] || '#E0D8CC'}
                      onChange={e => updatePaletaKey(key, e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full rounded-full"
                    />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-muted">{label}</p>
                  <input
                    value={paleta[key] || ''}
                    onChange={e => updatePaletaKey(key, e.target.value)}
                    disabled={disabled}
                    className="input-base text-xs py-0.5 font-mono"
                    placeholder="#000000"
                  />
                </div>
              </div>
            ))}
          </div>
        </PhaseCard>

        <PhaseCard title="tipografia">
          <div className="space-y-3">
            {paleta.primaria && (
              <div
                className="rounded-btn p-4 text-center"
                style={{ backgroundColor: paleta.fundo || '#F5F0E8' }}
              >
                <p
                  className="text-5xl font-medium"
                  style={{
                    fontFamily: tipografia.display || 'DM Sans',
                    color: paleta.texto || '#2C1810',
                  }}
                >
                  Aa
                </p>
                <p
                  className="text-[10px] tracking-widest mt-1"
                  style={{
                    fontFamily: tipografia.display || 'DM Sans',
                    color: paleta.texto || '#2C1810',
                  }}
                >
                  ABCDEFGHIJKLMNOPQRSTUVWXYZ
                </p>
              </div>
            )}
            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-muted block mb-1">display / títulos</label>
                <input
                  value={tipografia.display || ''}
                  onChange={e => updateTipo('display', e.target.value)}
                  disabled={disabled}
                  className="input-base text-xs py-1.5"
                  placeholder="ex: Playfair Display"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted block mb-1">corpo / texto</label>
                <input
                  value={tipografia.corpo || ''}
                  onChange={e => updateTipo('corpo', e.target.value)}
                  disabled={disabled}
                  className="input-base text-xs py-1.5"
                  placeholder="ex: Nunito"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted block mb-1">link de importação</label>
                <input
                  value={tipografia.link || ''}
                  onChange={e => updateTipo('link', e.target.value)}
                  disabled={disabled}
                  className="input-base text-xs py-1.5"
                  placeholder="https://fonts.google.com/..."
                />
              </div>
            </div>
          </div>
        </PhaseCard>

        <PhaseCard title="estilo visual">
          <div className="flex flex-wrap gap-2">
            {ESTILOS.map(e => (
              <Chip
                key={e}
                label={e}
                active={estilos.includes(e)}
                onClick={() => toggleEstilo(e)}
              />
            ))}
          </div>
        </PhaseCard>

        <PhaseCard title="referências visuais vinculadas">
          {vinculadas.length === 0 ? (
            <p className="text-xs text-faint">vincule referências ao projeto para montar o mood board</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {vinculadas.map(pr => {
                const ref = pr.reference;
                const imgSrc = ref?.screenshotUrl || (ref?.link ? `https://api.microlink.io/?url=${encodeURIComponent(ref.link)}&screenshot=true&meta=false&embed=screenshot.url` : null);
                return (
                  <div key={pr.id} className="rounded-btn overflow-hidden border border-border">
                    {imgSrc ? (
                      <img
                        src={imgSrc}
                        alt={ref?.nome}
                        className="w-full h-20 object-cover"
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-full h-20 bg-cream flex items-center justify-center">
                        <span className="text-[10px] text-faint">{ref?.nome}</span>
                      </div>
                    )}
                    <p className="text-[10px] text-muted px-2 py-1 truncate">{ref?.nome}</p>
                  </div>
                );
              })}
            </div>
          )}
        </PhaseCard>
      </div>

      <ConcludeButton phase={phase} project={project} onConclude={onConclude} />
    </div>
  );
}
