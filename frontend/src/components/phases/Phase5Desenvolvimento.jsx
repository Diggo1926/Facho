import { useEffect, useState } from 'react';
import { usePhaseData } from '../../hooks/usePhaseData.jsx';
import { PhaseCard, SavingDot, ConcludeButton, CopyButton } from './shared.jsx';
import { IconPlus, IconTrash, IconAlertTriangle, IconFileText } from '@tabler/icons-react';
import api from '../../services/api.jsx';

function PromptItem({ prompt, index, onChange, onRemove, disabled }) {
  return (
    <div className="border border-border rounded-btn p-3 space-y-2 bg-[#FDFAF5]">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono text-faint w-5 shrink-0">{index + 1}.</span>
        <input
          value={prompt.titulo || ''}
          onChange={e => onChange({ ...prompt, titulo: e.target.value })}
          disabled={disabled}
          className="input-base text-xs font-medium flex-1 py-1.5"
          placeholder="título do prompt"
        />
        <input
          value={prompt.modulo || ''}
          onChange={e => onChange({ ...prompt, modulo: e.target.value })}
          disabled={disabled}
          className="input-base text-xs w-24 py-1.5"
          placeholder="módulo"
        />
        <input
          type="number"
          value={prompt.estimativaHoras || ''}
          onChange={e => onChange({ ...prompt, estimativaHoras: parseFloat(e.target.value) || 0 })}
          disabled={disabled}
          className="input-base text-xs w-16 py-1.5"
          placeholder="h"
          title="estimativa em horas"
        />
        <CopyButton text={prompt.conteudo || ''} />
        {!disabled && (
          <button onClick={onRemove} className="text-faint hover:text-red-400">
            <IconTrash size={12} />
          </button>
        )}
      </div>
      <textarea
        value={prompt.conteudo || ''}
        onChange={e => onChange({ ...prompt, conteudo: e.target.value })}
        disabled={disabled}
        rows={3}
        className="input-base resize-none text-xs leading-relaxed font-mono disabled:opacity-60"
        placeholder="conteúdo do prompt para o Claude Code..."
      />
      <label className="flex items-center gap-2 text-xs text-muted cursor-pointer">
        <input
          type="checkbox"
          checked={prompt.executado || false}
          onChange={e => onChange({ ...prompt, executado: e.target.checked })}
          disabled={disabled}
        />
        executado
      </label>
    </div>
  );
}

function ContratoAviso({ projectId }) {
  const [temAssinado, setTemAssinado] = useState(null);

  useEffect(() => {
    api.get(`/api/projects/${projectId}/contracts`)
      .then(({ data }) => {
        setTemAssinado(data.some(c => c.status === 'assinado'));
      })
      .catch(() => setTemAssinado(null));
  }, [projectId]);

  if (temAssinado === null || temAssinado === true) return null;

  return (
    <div className="flex items-start gap-2.5 bg-[#FFF8F0] border border-[#F0D8B8] rounded-btn px-3 py-2.5 text-xs text-[#7A4A1A]">
      <IconAlertTriangle size={14} className="shrink-0 mt-0.5 text-[#C17A3A]" />
      <div>
        <span className="font-medium">Contrato pendente</span>
        {' — '}nenhum contrato assinado encontrado neste projeto.{' '}
        <button
          onClick={() => document.querySelector('[data-tab="contratos"]')?.click()}
          className="underline hover:no-underline"
        >
          Ver contratos
        </button>
      </div>
    </div>
  );
}

export default function Phase5Desenvolvimento({ project, phase, onPhaseUpdated, onConclude }) {
  const { data, update, updateFn, saving } = usePhaseData(project, phase, onPhaseUpdated);
  const disabled = phase.status === 'concluida';
  const prompts = data.prompts || [];
  const comandos = data.comandosUteis || [];
  const executados = prompts.filter(p => p.executado).length;
  const progresso = prompts.length > 0 ? Math.round((executados / prompts.length) * 100) : 0;

  function updatePrompt(i, val) {
    updateFn(prev => {
      const next = [...(prev.prompts || [])];
      next[i] = val;
      return { ...prev, prompts: next };
    });
  }

  function addPrompt() {
    updateFn(prev => ({ ...prev, prompts: [...(prev.prompts || []), { titulo: '', modulo: '', estimativaHoras: 0, conteudo: '', executado: false }] }));
  }

  function removePrompt(i) {
    updateFn(prev => ({ ...prev, prompts: (prev.prompts || []).filter((_, j) => j !== i) }));
  }

  function updateComando(i, val) {
    updateFn(prev => {
      const next = [...(prev.comandosUteis || [])];
      next[i] = val;
      return { ...prev, comandosUteis: next };
    });
  }

  function addComando() {
    updateFn(prev => ({ ...prev, comandosUteis: [...(prev.comandosUteis || []), { comando: '', descricao: '' }] }));
  }

  function removeComando(i) {
    updateFn(prev => ({ ...prev, comandosUteis: (prev.comandosUteis || []).filter((_, j) => j !== i) }));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-faint">fase 5 — desenvolvimento</p>
        <SavingDot saving={saving} />
      </div>

      <ContratoAviso projectId={project.id} />

      {prompts.length > 0 && (
        <div className="card space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted">progresso dos prompts</p>
            <span className="text-xs text-dark font-medium">{executados}/{prompts.length} ({progresso}%)</span>
          </div>
          <div className="h-2 bg-border rounded-full overflow-hidden">
            <div className="h-full bg-terra rounded-full transition-all duration-500" style={{ width: `${progresso}%` }} />
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {prompts.map((p, i) => (
              <div
                key={i}
                title={p.titulo || `prompt ${i + 1}`}
                className={`shrink-0 w-6 h-6 rounded text-[10px] flex items-center justify-center font-mono ${
                  p.executado ? 'bg-terra text-white' : 'bg-border text-faint'
                }`}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <PhaseCard
          title="prompts para o Claude Code"
          className="col-span-2"
          action={!disabled && (
            <button onClick={addPrompt} className="flex items-center gap-1 text-xs text-terra hover:underline">
              <IconPlus size={12} /> prompt
            </button>
          )}
        >
          <div className="space-y-3 max-h-[480px] overflow-y-auto">
            {prompts.length === 0 && <p className="text-xs text-faint">nenhum prompt definido — adicione os prompts que você vai usar com o Claude Code</p>}
            {prompts.map((p, i) => (
              <PromptItem
                key={i}
                prompt={p}
                index={i}
                onChange={v => updatePrompt(i, v)}
                onRemove={() => removePrompt(i)}
                disabled={disabled}
              />
            ))}
          </div>
        </PhaseCard>

        <PhaseCard
          title="comandos úteis"
          className="col-span-2"
          action={!disabled && (
            <button onClick={addComando} className="flex items-center gap-1 text-xs text-terra hover:underline">
              <IconPlus size={12} /> comando
            </button>
          )}
        >
          <div className="space-y-2">
            {comandos.length === 0 && <p className="text-xs text-faint">nenhum comando cadastrado</p>}
            {comandos.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <code className="flex-1 text-xs font-mono bg-[#2C1810] text-[#F5F0E8] px-3 py-1.5 rounded-btn">
                  {c.comando || 'comando...'}
                </code>
                <input
                  value={c.descricao || ''}
                  onChange={e => updateComando(i, { ...c, descricao: e.target.value })}
                  disabled={disabled}
                  className="w-40 text-xs bg-transparent outline-none text-faint"
                  placeholder="descrição..."
                />
                <CopyButton text={c.comando || ''} />
                {!disabled && (
                  <>
                    <input
                      value={c.comando || ''}
                      onChange={e => updateComando(i, { ...c, comando: e.target.value })}
                      className="sr-only"
                    />
                    <button onClick={() => removeComando(i)} className="text-faint hover:text-red-400">
                      <IconTrash size={12} />
                    </button>
                  </>
                )}
              </div>
            ))}
            {!disabled && comandos.length === 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-faint">ex: npm run dev, npx prisma studio, git log --oneline</span>
              </div>
            )}
          </div>
        </PhaseCard>
      </div>

      <ConcludeButton phase={phase} project={project} onConclude={onConclude} />
    </div>
  );
}
