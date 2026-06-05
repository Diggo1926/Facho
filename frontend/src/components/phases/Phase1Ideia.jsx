import { usePhaseData } from '../../hooks/usePhaseData.jsx';
import { PhaseCard, SavingDot, ConcludeButton, EditableList } from './shared.jsx';

export default function Phase1Ideia({ project, phase, onPhaseUpdated, onConclude }) {
  const { data, update, saving } = usePhaseData(project, phase, onPhaseUpdated);
  const disabled = phase.status === 'concluida';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-faint">fase 1 — ideia e briefing</p>
        <SavingDot saving={saving} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <PhaseCard title="problema">
          <textarea
            value={data.problema || ''}
            onChange={e => update('problema', e.target.value)}
            rows={5}
            disabled={disabled}
            className="input-base resize-none text-xs leading-relaxed disabled:opacity-60"
            placeholder="qual problema este sistema resolve? seja específico sobre a dor do cliente..."
          />
        </PhaseCard>

        <PhaseCard title="público-alvo">
          <textarea
            value={data.publicoAlvo || ''}
            onChange={e => update('publicoAlvo', e.target.value)}
            rows={5}
            disabled={disabled}
            className="input-base resize-none text-xs leading-relaxed disabled:opacity-60"
            placeholder="quem vai usar o sistema? perfil, volume de usuários, nível técnico..."
          />
        </PhaseCard>

        <PhaseCard title="funcionalidades principais">
          <EditableList
            items={data.funcionalidades || []}
            onChange={v => update('funcionalidades', v)}
            placeholder="adicionar funcionalidade..."
            disabled={disabled}
          />
        </PhaseCard>

        <PhaseCard title="viabilidade">
          <div className="space-y-3">
            <select
              value={data.viabilidade || ''}
              onChange={e => update('viabilidade', e.target.value)}
              disabled={disabled}
              className="input-base text-xs disabled:opacity-60"
            >
              <option value="">selecionar nível...</option>
              <option value="alta">alta</option>
              <option value="media">média</option>
              <option value="baixa">baixa</option>
            </select>
            <textarea
              value={data.justificativaViabilidade || ''}
              onChange={e => update('justificativaViabilidade', e.target.value)}
              rows={3}
              disabled={disabled}
              className="input-base resize-none text-xs leading-relaxed disabled:opacity-60"
              placeholder="justificativa da viabilidade..."
            />
          </div>
        </PhaseCard>
      </div>

      <ConcludeButton phase={phase} project={project} onConclude={onConclude} />
    </div>
  );
}
