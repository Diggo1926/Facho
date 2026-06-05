import { useState } from 'react';
import { usePhaseData } from '../../hooks/usePhaseData.jsx';
import { PhaseCard, SavingDot, ConcludeButton, EditableList } from './shared.jsx';
import { IconPlus, IconTrash } from '@tabler/icons-react';

const STACK_FIELDS = [
  { key: 'frontend', label: 'Frontend', color: 'bg-blue-100 text-blue-700' },
  { key: 'backend', label: 'Backend', color: 'bg-purple-100 text-purple-700' },
  { key: 'banco', label: 'Banco', color: 'bg-green-100 text-green-700' },
  { key: 'deploy', label: 'Deploy', color: 'bg-orange-100 text-orange-700' },
];

function ModuloItem({ modulo, onChange, onRemove, disabled }) {
  const [funcInput, setFuncInput] = useState('');

  function addFunc() {
    const v = funcInput.trim();
    if (!v) return;
    onChange({ ...modulo, funcionalidades: [...(modulo.funcionalidades || []), v] });
    setFuncInput('');
  }

  function removeFunc(i) {
    onChange({ ...modulo, funcionalidades: modulo.funcionalidades.filter((_, j) => j !== i) });
  }

  return (
    <div className="border border-border rounded-btn p-3 space-y-2 bg-[#FDFAF5]">
      <div className="flex items-center gap-2">
        <input
          value={modulo.nome}
          onChange={e => onChange({ ...modulo, nome: e.target.value })}
          disabled={disabled}
          className="input-base text-xs font-medium flex-1 py-1.5"
          placeholder="nome do módulo"
        />
        {!disabled && (
          <button onClick={onRemove} className="text-faint hover:text-red-400">
            <IconTrash size={14} />
          </button>
        )}
      </div>
      <input
        value={modulo.descricao || ''}
        onChange={e => onChange({ ...modulo, descricao: e.target.value })}
        disabled={disabled}
        className="input-base text-xs py-1.5"
        placeholder="descrição breve..."
      />
      <div className="flex flex-wrap gap-1.5">
        {(modulo.funcionalidades || []).map((f, i) => (
          <span key={i} className="flex items-center gap-1 px-2 py-0.5 bg-cream border border-border rounded-full text-[10px] text-muted">
            {f}
            {!disabled && (
              <button onClick={() => removeFunc(i)} className="text-faint hover:text-red-400">×</button>
            )}
          </span>
        ))}
        {!disabled && (
          <div className="flex gap-1">
            <input
              value={funcInput}
              onChange={e => setFuncInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addFunc()}
              className="border border-border rounded-full px-2 py-0.5 text-[10px] bg-surface focus:outline-none focus:border-terra w-28"
              placeholder="+ funcionalidade"
            />
          </div>
        )}
      </div>
    </div>
  );
}

function TabelaItem({ tabela, onChange, onRemove, disabled }) {
  const [campoInput, setCampoInput] = useState('');

  function addCampo() {
    const v = campoInput.trim();
    if (!v) return;
    onChange({ ...tabela, campos: [...(tabela.campos || []), v] });
    setCampoInput('');
  }

  return (
    <div className="border border-border rounded-btn p-3 space-y-2">
      <div className="flex items-center gap-2">
        <input
          value={tabela.nome}
          onChange={e => onChange({ ...tabela, nome: e.target.value })}
          disabled={disabled}
          className="input-base text-xs font-medium flex-1 py-1.5"
          placeholder="nome da tabela"
        />
        {!disabled && (
          <button onClick={onRemove} className="text-faint hover:text-red-400">
            <IconTrash size={14} />
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {(tabela.campos || []).map((c, i) => (
          <span key={i} className="flex items-center gap-1 px-2 py-0.5 bg-cream border border-border rounded-full text-[10px] font-mono text-muted">
            {c}
            {!disabled && (
              <button onClick={() => onChange({ ...tabela, campos: tabela.campos.filter((_, j) => j !== i) })} className="text-faint hover:text-red-400">×</button>
            )}
          </span>
        ))}
        {!disabled && (
          <div className="flex gap-1">
            <input
              value={campoInput}
              onChange={e => setCampoInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addCampo()}
              className="border border-border rounded-full px-2 py-0.5 text-[10px] font-mono bg-surface focus:outline-none focus:border-terra w-28"
              placeholder="+ campo"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function Phase2Arquitetura({ project, phase, onPhaseUpdated, onConclude }) {
  const { data, update, updateFn, saving } = usePhaseData(project, phase, onPhaseUpdated);
  const disabled = phase.status === 'concluida';
  const stack = data.stack || {};
  const modulos = data.modulos || [];
  const tabelas = data.tabelas || [];

  function updateModulo(i, val) {
    updateFn(prev => {
      const next = [...(prev.modulos || [])];
      next[i] = val;
      return { ...prev, modulos: next };
    });
  }

  function addModulo() {
    updateFn(prev => ({ ...prev, modulos: [...(prev.modulos || []), { nome: '', descricao: '', funcionalidades: [] }] }));
  }

  function removeModulo(i) {
    updateFn(prev => ({ ...prev, modulos: (prev.modulos || []).filter((_, j) => j !== i) }));
  }

  function updateTabela(i, val) {
    updateFn(prev => {
      const next = [...(prev.tabelas || [])];
      next[i] = val;
      return { ...prev, tabelas: next };
    });
  }

  function addTabela() {
    updateFn(prev => ({ ...prev, tabelas: [...(prev.tabelas || []), { nome: '', campos: [] }] }));
  }

  function removeTabela(i) {
    updateFn(prev => ({ ...prev, tabelas: (prev.tabelas || []).filter((_, j) => j !== i) }));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-faint">fase 2 — arquitetura técnica</p>
        <SavingDot saving={saving} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <PhaseCard title="stack tecnológica">
          <div className="space-y-2">
            {STACK_FIELDS.map(({ key, label, color }) => (
              <div key={key} className="flex items-center gap-2">
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${color}`}>{label}</span>
                <input
                  value={stack[key] || ''}
                  onChange={e => update('stack', { ...stack, [key]: e.target.value })}
                  disabled={disabled}
                  className="input-base text-xs flex-1 py-1.5"
                  placeholder={`tecnologia de ${label.toLowerCase()}...`}
                />
              </div>
            ))}
          </div>
        </PhaseCard>

        <PhaseCard
          title="módulos do sistema"
          action={!disabled && (
            <button onClick={addModulo} className="flex items-center gap-1 text-xs text-terra hover:underline">
              <IconPlus size={12} /> módulo
            </button>
          )}
        >
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {modulos.length === 0 && <p className="text-xs text-faint">nenhum módulo definido</p>}
            {modulos.map((m, i) => (
              <ModuloItem
                key={i}
                modulo={m}
                onChange={v => updateModulo(i, v)}
                onRemove={() => removeModulo(i)}
                disabled={disabled}
              />
            ))}
          </div>
        </PhaseCard>

        <PhaseCard title="estrutura de pastas">
          <textarea
            value={data.estruturaPastas || ''}
            onChange={e => update('estruturaPastas', e.target.value)}
            rows={8}
            disabled={disabled}
            className="input-base resize-none text-xs font-mono leading-relaxed disabled:opacity-60"
            placeholder="src/&#10;  components/&#10;  pages/&#10;  hooks/&#10;  services/"
          />
        </PhaseCard>

        <PhaseCard
          title="tabelas do banco"
          action={!disabled && (
            <button onClick={addTabela} className="flex items-center gap-1 text-xs text-terra hover:underline">
              <IconPlus size={12} /> tabela
            </button>
          )}
        >
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {tabelas.length === 0 && <p className="text-xs text-faint">nenhuma tabela definida</p>}
            {tabelas.map((t, i) => (
              <TabelaItem
                key={i}
                tabela={t}
                onChange={v => updateTabela(i, v)}
                onRemove={() => removeTabela(i)}
                disabled={disabled}
              />
            ))}
          </div>
        </PhaseCard>
      </div>

      <ConcludeButton phase={phase} project={project} onConclude={onConclude} />
    </div>
  );
}
