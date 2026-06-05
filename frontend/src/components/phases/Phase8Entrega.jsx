import { usePhaseData } from '../../hooks/usePhaseData.jsx';
import { PhaseCard, SavingDot, ConcludeButton, EditableList } from './shared.jsx';
import { IconPlus, IconTrash, IconDownload } from '@tabler/icons-react';

function exportarEntrega(project, data) {
  const modulos = (data.modulosEntregues || []).map(m => `• ${m.nome} — ${m.descricao}`).join('\n');
  const acessos = (data.acessos || []).map(a => `• ${a.ambiente}: ${a.url}${a.observacoes ? ` (${a.observacoes})` : ''}`).join('\n');
  const proximos = (data.proximosPassos || []).map(p => `• ${p}`).join('\n');

  const doc = `DOCUMENTO DE ENTREGA — ${project.nome.toUpperCase()}
${'='.repeat(50)}
Cliente: ${project.cliente || '—'}
Data: ${new Date().toLocaleDateString('pt-BR')}

RESUMO EXECUTIVO
${'-'.repeat(30)}
${data.resumoExecutivo || '—'}

MÓDULOS ENTREGUES
${'-'.repeat(30)}
${modulos || '—'}

ACESSOS AO SISTEMA
${'-'.repeat(30)}
${acessos || '—'}

PRÓXIMOS PASSOS SUGERIDOS
${'-'.repeat(30)}
${proximos || '—'}
`;

  const blob = new Blob([doc], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `entrega-${project.nome.toLowerCase().replace(/\s+/g, '-')}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Phase8Entrega({ project, phase, onPhaseUpdated, onConclude }) {
  const { data, update, updateFn, saving } = usePhaseData(project, phase, onPhaseUpdated);
  const disabled = phase.status === 'concluida';

  const modulos = data.modulosEntregues || [];
  const acessos = data.acessos || [];

  function updateModulo(i, val) {
    updateFn(prev => { const next = [...(prev.modulosEntregues || [])]; next[i] = val; return { ...prev, modulosEntregues: next }; });
  }
  function addModulo() {
    updateFn(prev => ({ ...prev, modulosEntregues: [...(prev.modulosEntregues || []), { nome: '', descricao: '', status: 'entregue' }] }));
  }
  function removeModulo(i) {
    updateFn(prev => ({ ...prev, modulosEntregues: (prev.modulosEntregues || []).filter((_, j) => j !== i) }));
  }

  function updateAcesso(i, val) {
    updateFn(prev => { const next = [...(prev.acessos || [])]; next[i] = val; return { ...prev, acessos: next }; });
  }
  function addAcesso() {
    updateFn(prev => ({ ...prev, acessos: [...(prev.acessos || []), { ambiente: '', url: '', observacoes: '' }] }));
  }
  function removeAcesso(i) {
    updateFn(prev => ({ ...prev, acessos: (prev.acessos || []).filter((_, j) => j !== i) }));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-faint">fase 8 — entrega ao cliente</p>
        <SavingDot saving={saving} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <PhaseCard title="resumo executivo" className="col-span-2">
          <textarea
            value={data.resumoExecutivo || ''}
            onChange={e => update('resumoExecutivo', e.target.value)}
            rows={5}
            disabled={disabled}
            className="input-base resize-none text-xs leading-relaxed disabled:opacity-60"
            placeholder="descreva o sistema entregue em linguagem não técnica, voltada para o cliente. O que foi construído, quais problemas resolve e o que ele pode fazer agora..."
          />
        </PhaseCard>

        <PhaseCard
          title="módulos entregues"
          action={!disabled && (
            <button onClick={addModulo} className="flex items-center gap-1 text-xs text-terra hover:underline">
              <IconPlus size={12} /> módulo
            </button>
          )}
        >
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {modulos.length === 0 && <p className="text-xs text-faint">nenhum módulo cadastrado</p>}
            {modulos.map((m, i) => (
              <div key={i} className="border border-border rounded-btn p-2 space-y-1">
                <div className="flex items-center gap-2">
                  <input
                    value={m.nome || ''}
                    onChange={e => updateModulo(i, { ...m, nome: e.target.value })}
                    disabled={disabled}
                    className="flex-1 text-xs font-medium bg-transparent outline-none text-dark border-b border-border focus:border-terra pb-0.5"
                    placeholder="nome do módulo"
                  />
                  <select
                    value={m.status || 'entregue'}
                    onChange={e => updateModulo(i, { ...m, status: e.target.value })}
                    disabled={disabled}
                    className="text-[10px] bg-surface border border-border rounded px-1 py-0.5"
                  >
                    <option value="entregue">entregue</option>
                    <option value="pendente">pendente</option>
                  </select>
                  {!disabled && <button onClick={() => removeModulo(i)} className="text-faint hover:text-red-400"><IconTrash size={11} /></button>}
                </div>
                <input
                  value={m.descricao || ''}
                  onChange={e => updateModulo(i, { ...m, descricao: e.target.value })}
                  disabled={disabled}
                  className="w-full text-xs bg-transparent outline-none text-faint"
                  placeholder="descrição simples..."
                />
              </div>
            ))}
          </div>
        </PhaseCard>

        <PhaseCard
          title="acessos ao sistema"
          action={!disabled && (
            <button onClick={addAcesso} className="flex items-center gap-1 text-xs text-terra hover:underline">
              <IconPlus size={12} /> acesso
            </button>
          )}
        >
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {acessos.length === 0 && <p className="text-xs text-faint">cadastre as URLs de acesso ao sistema</p>}
            {acessos.map((a, i) => (
              <div key={i} className="border border-border rounded-btn p-2 space-y-1">
                <div className="flex items-center gap-2">
                  <input
                    value={a.ambiente || ''}
                    onChange={e => updateAcesso(i, { ...a, ambiente: e.target.value })}
                    disabled={disabled}
                    className="flex-1 text-xs font-medium bg-transparent outline-none text-dark border-b border-border focus:border-terra pb-0.5"
                    placeholder="ambiente (ex: Produção)"
                  />
                  {!disabled && <button onClick={() => removeAcesso(i)} className="text-faint hover:text-red-400"><IconTrash size={11} /></button>}
                </div>
                <input
                  value={a.url || ''}
                  onChange={e => updateAcesso(i, { ...a, url: e.target.value })}
                  disabled={disabled}
                  className="w-full text-xs bg-transparent outline-none text-caramel"
                  placeholder="https://..."
                />
                <input
                  value={a.observacoes || ''}
                  onChange={e => updateAcesso(i, { ...a, observacoes: e.target.value })}
                  disabled={disabled}
                  className="w-full text-[10px] bg-transparent outline-none text-faint"
                  placeholder="observações..."
                />
              </div>
            ))}
          </div>
        </PhaseCard>

        <PhaseCard title="próximos passos sugeridos" className="col-span-2">
          <EditableList
            items={data.proximosPassos || []}
            onChange={v => update('proximosPassos', v)}
            placeholder="sugestão de evolução futura..."
            disabled={disabled}
          />
        </PhaseCard>
      </div>

      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => exportarEntrega(project, data)}
          className="flex items-center gap-2 btn-secondary"
        >
          <IconDownload size={16} />
          exportar documento de entrega
        </button>
        <ConcludeButton phase={phase} project={project} onConclude={onConclude} />
      </div>
    </div>
  );
}
