import { usePhaseData } from '../../hooks/usePhaseData.jsx';
import { PhaseCard, SavingDot, ConcludeButton, CopyButton, StatusBadge } from './shared.jsx';
import { IconPlus, IconTrash, IconExternalLink } from '@tabler/icons-react';

export default function Phase7Deploy({ project, phase, onPhaseUpdated, onConclude }) {
  const { data, update, updateFn, saving } = usePhaseData(project, phase, onPhaseUpdated);
  const disabled = phase.status === 'concluida';

  const variaveis = data.variaveis || [];
  const passos = data.passos || [];
  const validacao = data.validacaoPosDeploy || [
    { verificacao: 'Frontend carrega sem erros', feita: false },
    { verificacao: 'Login funcional', feita: false },
    { verificacao: 'Banco de dados conectado', feita: false },
    { verificacao: 'HTTPS ativo', feita: false },
    { verificacao: 'Variáveis de ambiente carregadas', feita: false },
  ];
  const urls = data.urls || { frontend: '', backend: '' };

  function addVariavel() {
    updateFn(prev => ({ ...prev, variaveis: [...(prev.variaveis || []), { nome: '', onde: '', descricao: '', preenchida: false }] }));
  }
  function updateVariavel(i, val) {
    updateFn(prev => { const next = [...(prev.variaveis || [])]; next[i] = val; return { ...prev, variaveis: next }; });
  }
  function removeVariavel(i) {
    updateFn(prev => ({ ...prev, variaveis: (prev.variaveis || []).filter((_, j) => j !== i) }));
  }

  function addPasso() {
    updateFn(prev => ({ ...prev, passos: [...(prev.passos || []), { ordem: (prev.passos || []).length + 1, titulo: '', comandos: [], status: 'pendente' }] }));
  }
  function updatePasso(i, val) {
    updateFn(prev => { const next = [...(prev.passos || [])]; next[i] = val; return { ...prev, passos: next }; });
  }
  function removePasso(i) {
    updateFn(prev => ({ ...prev, passos: (prev.passos || []).filter((_, j) => j !== i) }));
  }

  function toggleValidacao(i) {
    const next = [...validacao];
    next[i] = { ...next[i], feita: !next[i].feita };
    update('validacaoPosDeploy', next);
  }

  function addValidacao() {
    update('validacaoPosDeploy', [...validacao, { verificacao: '', feita: false }]);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-faint">fase 7 — deploy</p>
        <SavingDot saving={saving} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <PhaseCard title="URLs de produção">
          <div className="space-y-3">
            {[{ key: 'frontend', label: 'Frontend' }, { key: 'backend', label: 'Backend' }].map(({ key, label }) => (
              <div key={key} className="space-y-1">
                <label className="text-[10px] text-muted">{label}</label>
                <div className="flex items-center gap-2">
                  <input
                    value={urls[key] || ''}
                    onChange={e => update('urls', { ...urls, [key]: e.target.value })}
                    disabled={disabled}
                    className="input-base text-xs flex-1 py-1.5"
                    placeholder="https://..."
                  />
                  {urls[key] && <CopyButton text={urls[key]} />}
                  {urls[key] && (
                    <a href={urls[key]} target="_blank" rel="noopener noreferrer" className="text-faint hover:text-terra">
                      <IconExternalLink size={14} />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </PhaseCard>

        <PhaseCard
          title="validação pós-deploy"
          action={!disabled && (
            <button onClick={addValidacao} className="flex items-center gap-1 text-xs text-terra hover:underline">
              <IconPlus size={12} /> item
            </button>
          )}
        >
          <div className="space-y-2">
            {validacao.map((v, i) => (
              <label key={i} className="flex items-center gap-2 text-xs cursor-pointer">
                <input type="checkbox" checked={v.feita || false} onChange={() => !disabled && toggleValidacao(i)} disabled={disabled} />
                <span className={v.feita ? 'line-through text-faint' : 'text-dark'}>{v.verificacao}</span>
              </label>
            ))}
          </div>
        </PhaseCard>

        <PhaseCard
          title="checklist de variáveis de ambiente"
          className="col-span-2"
          action={!disabled && (
            <button onClick={addVariavel} className="flex items-center gap-1 text-xs text-terra hover:underline">
              <IconPlus size={12} /> variável
            </button>
          )}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-[10px] text-muted font-medium pb-2 pr-3">variável</th>
                  <th className="text-left text-[10px] text-muted font-medium pb-2 pr-3">onde</th>
                  <th className="text-left text-[10px] text-muted font-medium pb-2 pr-3">descrição</th>
                  <th className="text-left text-[10px] text-muted font-medium pb-2">ok</th>
                </tr>
              </thead>
              <tbody className="space-y-1">
                {variaveis.length === 0 && (
                  <tr><td colSpan={4} className="text-faint py-2">nenhuma variável cadastrada</td></tr>
                )}
                {variaveis.map((v, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-1 pr-3">
                      <input value={v.nome || ''} onChange={e => updateVariavel(i, { ...v, nome: e.target.value })} disabled={disabled} className="font-mono text-xs bg-transparent outline-none text-dark w-full" placeholder="NOME_VAR" />
                    </td>
                    <td className="py-1 pr-3">
                      <input value={v.onde || ''} onChange={e => updateVariavel(i, { ...v, onde: e.target.value })} disabled={disabled} className="text-xs bg-transparent outline-none text-faint w-full" placeholder="Railway/Vercel" />
                    </td>
                    <td className="py-1 pr-3">
                      <input value={v.descricao || ''} onChange={e => updateVariavel(i, { ...v, descricao: e.target.value })} disabled={disabled} className="text-xs bg-transparent outline-none text-faint w-full" placeholder="descrição..." />
                    </td>
                    <td className="py-1">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={v.preenchida || false} onChange={e => updateVariavel(i, { ...v, preenchida: e.target.checked })} disabled={disabled} />
                        {!disabled && <button onClick={() => removeVariavel(i)} className="text-faint hover:text-red-400"><IconTrash size={11} /></button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PhaseCard>

        <PhaseCard
          title="passos de deploy"
          className="col-span-2"
          action={!disabled && (
            <button onClick={addPasso} className="flex items-center gap-1 text-xs text-terra hover:underline">
              <IconPlus size={12} /> passo
            </button>
          )}
        >
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {passos.length === 0 && <p className="text-xs text-faint">adicione os passos do processo de deploy</p>}
            {passos.map((p, i) => (
              <div key={i} className="flex items-start gap-3 border border-border rounded-btn p-3">
                <span className="text-[10px] font-mono text-faint w-5 pt-1 shrink-0">{i + 1}.</span>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      value={p.titulo || ''}
                      onChange={e => updatePasso(i, { ...p, titulo: e.target.value })}
                      disabled={disabled}
                      className="flex-1 text-xs font-medium bg-transparent outline-none text-dark border-b border-border focus:border-terra pb-0.5"
                      placeholder="título do passo"
                    />
                    <select
                      value={p.status || 'pendente'}
                      onChange={e => updatePasso(i, { ...p, status: e.target.value })}
                      disabled={disabled}
                      className="text-[10px] bg-surface border border-border rounded px-1 py-0.5"
                    >
                      <option value="pendente">pendente</option>
                      <option value="executado">executado</option>
                      <option value="erro">erro</option>
                    </select>
                  </div>
                  <textarea
                    value={(p.comandos || []).join('\n')}
                    onChange={e => updatePasso(i, { ...p, comandos: e.target.value.split('\n').filter(Boolean) })}
                    disabled={disabled}
                    rows={2}
                    className="input-base resize-none text-xs font-mono"
                    placeholder="comandos (um por linha)..."
                  />
                </div>
                {!disabled && (
                  <button onClick={() => removePasso(i)} className="text-faint hover:text-red-400 pt-1">
                    <IconTrash size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </PhaseCard>
      </div>

      <ConcludeButton phase={phase} project={project} onConclude={onConclude} />
    </div>
  );
}
