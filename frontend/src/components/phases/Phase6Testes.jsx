import { usePhaseData } from '../../hooks/usePhaseData.jsx';
import { PhaseCard, SavingDot, ConcludeButton, StatusBadge } from './shared.jsx';
import { IconPlus, IconTrash } from '@tabler/icons-react';

const BREAKPOINTS = ['mobile (320px)', 'mobile (375px)', 'tablet (768px)', 'laptop (1280px)', 'desktop (1440px)'];

function CenarioItem({ cenario, onChange, disabled }) {
  return (
    <div className="border border-border rounded-btn p-2 space-y-1.5 bg-[#FDFAF5]">
      <input
        value={cenario.nome || ''}
        onChange={e => onChange({ ...cenario, nome: e.target.value })}
        disabled={disabled}
        className="input-base text-xs py-1"
        placeholder="nome do cenário"
      />
      <textarea
        value={(cenario.passos || []).join('\n')}
        onChange={e => onChange({ ...cenario, passos: e.target.value.split('\n') })}
        disabled={disabled}
        rows={2}
        className="input-base resize-none text-xs font-mono"
        placeholder="passos (um por linha)"
      />
      <div className="flex items-center gap-2">
        <input
          value={cenario.resultadoEsperado || ''}
          onChange={e => onChange({ ...cenario, resultadoEsperado: e.target.value })}
          disabled={disabled}
          className="input-base text-xs flex-1 py-1"
          placeholder="resultado esperado"
        />
        <select
          value={cenario.status || 'pendente'}
          onChange={e => onChange({ ...cenario, status: e.target.value })}
          disabled={disabled}
          className="input-base text-xs w-28 py-1"
        >
          <option value="pendente">pendente</option>
          <option value="passou">passou</option>
          <option value="falhou">falhou</option>
        </select>
      </div>
    </div>
  );
}

function ModuloTestes({ modulo, onChange, onRemove, disabled }) {
  function addCenario() {
    onChange({ ...modulo, cenarios: [...(modulo.cenarios || []), { nome: '', passos: [], resultadoEsperado: '', status: 'pendente' }] });
  }
  function updateCenario(i, val) {
    const next = [...(modulo.cenarios || [])];
    next[i] = val;
    onChange({ ...modulo, cenarios: next });
  }
  function removeCenario(i) {
    onChange({ ...modulo, cenarios: (modulo.cenarios || []).filter((_, j) => j !== i) });
  }

  return (
    <div className="border border-border rounded-btn overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 bg-cream">
        <input
          value={modulo.modulo || ''}
          onChange={e => onChange({ ...modulo, modulo: e.target.value })}
          disabled={disabled}
          className="flex-1 text-xs font-medium bg-transparent outline-none text-dark"
          placeholder="nome do módulo"
        />
        {!disabled && (
          <>
            <button onClick={addCenario} className="text-terra text-xs hover:underline flex items-center gap-1">
              <IconPlus size={11} /> cenário
            </button>
            <button onClick={onRemove} className="text-faint hover:text-red-400">
              <IconTrash size={12} />
            </button>
          </>
        )}
      </div>
      <div className="p-2 space-y-2">
        {(modulo.cenarios || []).map((c, i) => (
          <CenarioItem key={i} cenario={c} onChange={v => updateCenario(i, v)} disabled={disabled} />
        ))}
        {(modulo.cenarios || []).length === 0 && (
          <p className="text-xs text-faint px-1 py-1">nenhum cenário — clique em "+ cenário"</p>
        )}
      </div>
    </div>
  );
}

export default function Phase6Testes({ project, phase, onPhaseUpdated, onConclude }) {
  const { data, update, updateFn, saving } = usePhaseData(project, phase, onPhaseUpdated);
  const disabled = phase.status === 'concluida';

  const modulos = data.testesFuncionais || [];
  const testesSeguranca = data.testesSeguranca || [];
  const responsividade = data.responsividade || BREAKPOINTS.map(bp => ({ breakpoint: bp, feito: false }));
  const preDeployChecklist = data.preDeployChecklist || [
    { item: 'Variáveis de ambiente configuradas', feito: false },
    { item: 'Build sem erros', feito: false },
    { item: 'Banco em produção migrado', feito: false },
    { item: 'Domínio configurado', feito: false },
    { item: 'HTTPS ativo', feito: false },
  ];

  function addModulo() {
    updateFn(prev => ({ ...prev, testesFuncionais: [...(prev.testesFuncionais || []), { modulo: '', cenarios: [] }] }));
  }
  function updateModulo(i, val) {
    updateFn(prev => { const next = [...(prev.testesFuncionais || [])]; next[i] = val; return { ...prev, testesFuncionais: next }; });
  }
  function removeModulo(i) {
    updateFn(prev => ({ ...prev, testesFuncionais: (prev.testesFuncionais || []).filter((_, j) => j !== i) }));
  }

  function addTesteSeg() {
    updateFn(prev => ({ ...prev, testesSeguranca: [...(prev.testesSeguranca || []), { nome: '', ferramenta: '', status: 'pendente' }] }));
  }
  function updateTesteSeg(i, val) {
    updateFn(prev => { const next = [...(prev.testesSeguranca || [])]; next[i] = val; return { ...prev, testesSeguranca: next }; });
  }

  function toggleResp(i) {
    const next = [...responsividade];
    next[i] = { ...next[i], feito: !next[i].feito };
    update('responsividade', next);
  }

  function togglePreDeploy(i) {
    const next = [...preDeployChecklist];
    next[i] = { ...next[i], feito: !next[i].feito };
    update('preDeployChecklist', next);
  }

  function addPreDeploy() {
    update('preDeployChecklist', [...preDeployChecklist, { item: '', feito: false }]);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-faint">fase 6 — testes</p>
        <SavingDot saving={saving} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <PhaseCard
          title="testes funcionais por módulo"
          className="col-span-2"
          action={!disabled && (
            <button onClick={addModulo} className="flex items-center gap-1 text-xs text-terra hover:underline">
              <IconPlus size={12} /> módulo
            </button>
          )}
        >
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {modulos.length === 0 && <p className="text-xs text-faint">adicione módulos para organizar os cenários de teste</p>}
            {modulos.map((m, i) => (
              <ModuloTestes key={i} modulo={m} onChange={v => updateModulo(i, v)} onRemove={() => removeModulo(i)} disabled={disabled} />
            ))}
          </div>
        </PhaseCard>

        <PhaseCard
          title="testes de segurança"
          action={!disabled && (
            <button onClick={addTesteSeg} className="flex items-center gap-1 text-xs text-terra hover:underline">
              <IconPlus size={12} /> teste
            </button>
          )}
        >
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {testesSeguranca.length === 0 && <p className="text-xs text-faint">nenhum teste de segurança</p>}
            {testesSeguranca.map((t, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={t.nome || ''}
                  onChange={e => updateTesteSeg(i, { ...t, nome: e.target.value })}
                  disabled={disabled}
                  className="flex-1 text-xs bg-transparent outline-none text-dark border-b border-border focus:border-terra pb-0.5"
                  placeholder="nome do teste"
                />
                <input
                  value={t.ferramenta || ''}
                  onChange={e => updateTesteSeg(i, { ...t, ferramenta: e.target.value })}
                  disabled={disabled}
                  className="w-24 text-[10px] bg-transparent outline-none text-faint border-b border-border focus:border-terra pb-0.5"
                  placeholder="ferramenta"
                />
                <select
                  value={t.status || 'pendente'}
                  onChange={e => updateTesteSeg(i, { ...t, status: e.target.value })}
                  disabled={disabled}
                  className="text-[10px] bg-surface border border-border rounded px-1 py-0.5 outline-none"
                >
                  <option value="pendente">pendente</option>
                  <option value="executado">executado</option>
                </select>
                {!disabled && (
                  <button onClick={() => updateFn(prev => ({ ...prev, testesSeguranca: (prev.testesSeguranca || []).filter((_, j) => j !== i) }))} className="text-faint hover:text-red-400">
                    <IconTrash size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </PhaseCard>

        <PhaseCard title="responsividade">
          <div className="space-y-2">
            {responsividade.map((bp, i) => (
              <label key={i} className="flex items-center gap-2 text-xs cursor-pointer">
                <input type="checkbox" checked={bp.feito || false} onChange={() => !disabled && toggleResp(i)} disabled={disabled} />
                <span className={bp.feito ? 'line-through text-faint' : 'text-dark'}>{bp.breakpoint}</span>
              </label>
            ))}
          </div>
        </PhaseCard>

        <PhaseCard
          title="pré-deploy checklist"
          className="col-span-2"
          action={!disabled && (
            <button onClick={addPreDeploy} className="flex items-center gap-1 text-xs text-terra hover:underline">
              <IconPlus size={12} /> item
            </button>
          )}
        >
          <div className="grid grid-cols-2 gap-2">
            {preDeployChecklist.map((item, i) => (
              <label key={i} className="flex items-center gap-2 text-xs cursor-pointer">
                <input type="checkbox" checked={item.feito || false} onChange={() => !disabled && togglePreDeploy(i)} disabled={disabled} />
                <span className={item.feito ? 'line-through text-faint' : 'text-dark'}>{item.item}</span>
              </label>
            ))}
          </div>
        </PhaseCard>
      </div>

      <ConcludeButton phase={phase} project={project} onConclude={onConclude} />
    </div>
  );
}
