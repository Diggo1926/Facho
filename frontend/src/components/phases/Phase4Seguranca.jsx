import { usePhaseData } from '../../hooks/usePhaseData.jsx';
import { PhaseCard, SavingDot, ConcludeButton, RiskBadge, StatusBadge } from './shared.jsx';
import { IconPlus, IconTrash, IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import { useState } from 'react';

const CHECKLIST_DEFAULT = {
  autenticacao: ['JWT implementado', 'Refresh token com expiração', 'Senhas hasheadas (bcrypt)', 'Rate limiting no login'],
  cors: ['CORS restrito por origem', 'Headers de segurança (Helmet)', 'HTTPS forçado em produção'],
  banco: ['Queries parametrizadas', 'Sem credenciais no código', 'Variáveis de ambiente configuradas'],
  headers: ['Content-Security-Policy', 'X-Frame-Options', 'X-Content-Type-Options', 'HSTS configurado'],
};

function VulnItem({ vuln, onChange, onRemove, disabled }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-btn overflow-hidden">
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-cream"
        onClick={() => setOpen(o => !o)}
      >
        {open ? <IconChevronDown size={12} className="text-faint" /> : <IconChevronRight size={12} className="text-faint" />}
        <span className="flex-1 text-xs font-medium text-dark truncate">{vuln.nome || 'vulnerabilidade sem nome'}</span>
        <RiskBadge nivel={vuln.nivel} />
        {!disabled && (
          <button onClick={e => { e.stopPropagation(); onRemove(); }} className="text-faint hover:text-red-400">
            <IconTrash size={12} />
          </button>
        )}
      </div>
      {open && (
        <div className="px-3 pb-3 space-y-2 border-t border-border bg-[#FDFAF5]">
          <input
            value={vuln.nome || ''}
            onChange={e => onChange({ ...vuln, nome: e.target.value })}
            disabled={disabled}
            className="input-base text-xs py-1.5 mt-2"
            placeholder="nome da vulnerabilidade"
          />
          <select
            value={vuln.nivel || ''}
            onChange={e => onChange({ ...vuln, nivel: e.target.value })}
            disabled={disabled}
            className="input-base text-xs py-1.5"
          >
            <option value="">nível de risco...</option>
            <option value="critico">crítico</option>
            <option value="alto">alto</option>
            <option value="medio">médio</option>
            <option value="baixo">baixo</option>
          </select>
          <textarea
            value={vuln.descricao || ''}
            onChange={e => onChange({ ...vuln, descricao: e.target.value })}
            disabled={disabled}
            rows={2}
            className="input-base resize-none text-xs"
            placeholder="descrição da vulnerabilidade..."
          />
          <textarea
            value={vuln.mitigacao || ''}
            onChange={e => onChange({ ...vuln, mitigacao: e.target.value })}
            disabled={disabled}
            rows={2}
            className="input-base resize-none text-xs"
            placeholder="como foi ou será mitigada..."
          />
          <label className="flex items-center gap-2 text-xs text-muted cursor-pointer">
            <input
              type="checkbox"
              checked={vuln.resolvida || false}
              onChange={e => onChange({ ...vuln, resolvida: e.target.checked })}
              disabled={disabled}
            />
            resolvida
          </label>
        </div>
      )}
    </div>
  );
}

function CheckGroup({ group, label, items, onChange, disabled }) {
  const done = items.filter(i => i.feito).length;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <p className="text-[10px] font-medium text-muted uppercase tracking-wider">{label}</p>
        <span className="text-[10px] text-faint">{done}/{items.length}</span>
        <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
          <div className="h-full bg-terra rounded-full transition-all" style={{ width: `${items.length ? (done / items.length) * 100 : 0}%` }} />
        </div>
      </div>
      {items.map((item, i) => (
        <label key={i} className="flex items-start gap-2 text-xs text-dark cursor-pointer">
          <input
            type="checkbox"
            checked={item.feito || false}
            onChange={e => {
              const next = [...items];
              next[i] = { ...item, feito: e.target.checked };
              onChange(next);
            }}
            disabled={disabled}
            className="mt-0.5"
          />
          <span className={item.feito ? 'line-through text-faint' : ''}>{item.texto}</span>
        </label>
      ))}
    </div>
  );
}

export default function Phase4Seguranca({ project, phase, onPhaseUpdated, onConclude }) {
  const { data, update, updateFn, saving } = usePhaseData(project, phase, onPhaseUpdated);
  const disabled = phase.status === 'concluida';

  const vulns = data.vulnerabilidades || [];
  const testes = data.testesSeguranca || [];

  const checklist = data.checklist || Object.fromEntries(
    Object.entries(CHECKLIST_DEFAULT).map(([k, v]) => [k, v.map(t => ({ texto: t, feito: false }))])
  );

  function updateVuln(i, val) {
    updateFn(prev => {
      const next = [...(prev.vulnerabilidades || [])];
      next[i] = val;
      return { ...prev, vulnerabilidades: next };
    });
  }

  function addVuln() {
    updateFn(prev => ({ ...prev, vulnerabilidades: [...(prev.vulnerabilidades || []), { nome: '', nivel: '', descricao: '', mitigacao: '', resolvida: false }] }));
  }

  function removeVuln(i) {
    updateFn(prev => ({ ...prev, vulnerabilidades: (prev.vulnerabilidades || []).filter((_, j) => j !== i) }));
  }

  function updateCheckGroup(group, items) {
    update('checklist', { ...checklist, [group]: items });
  }

  function updateTeste(i, val) {
    updateFn(prev => {
      const next = [...(prev.testesSeguranca || [])];
      next[i] = val;
      return { ...prev, testesSeguranca: next };
    });
  }

  function addTeste() {
    updateFn(prev => ({ ...prev, testesSeguranca: [...(prev.testesSeguranca || []), { teste: '', ferramenta: '', executado: false }] }));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-faint">fase 4 — segurança</p>
        <SavingDot saving={saving} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <PhaseCard title="nível de risco geral">
          <div className="space-y-2">
            <select
              value={data.nivelRisco || ''}
              onChange={e => update('nivelRisco', e.target.value)}
              disabled={disabled}
              className="input-base text-xs"
            >
              <option value="">selecionar risco...</option>
              <option value="critico">crítico</option>
              <option value="alto">alto</option>
              <option value="medio">médio</option>
              <option value="baixo">baixo</option>
            </select>
            {data.nivelRisco && (
              <div className="flex justify-center py-3">
                <RiskBadge nivel={data.nivelRisco} />
              </div>
            )}
          </div>
        </PhaseCard>

        <PhaseCard
          title="vulnerabilidades"
          action={!disabled && (
            <button onClick={addVuln} className="flex items-center gap-1 text-xs text-terra hover:underline">
              <IconPlus size={12} /> adicionar
            </button>
          )}
        >
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {vulns.length === 0 && <p className="text-xs text-faint">nenhuma vulnerabilidade registrada</p>}
            {vulns.map((v, i) => (
              <VulnItem key={i} vuln={v} onChange={val => updateVuln(i, val)} onRemove={() => removeVuln(i)} disabled={disabled} />
            ))}
          </div>
        </PhaseCard>

        <PhaseCard title="checklist de segurança">
          <div className="space-y-4 max-h-72 overflow-y-auto">
            {Object.entries(checklist).map(([group, items]) => (
              <CheckGroup
                key={group}
                group={group}
                label={group}
                items={items}
                onChange={v => updateCheckGroup(group, v)}
                disabled={disabled}
              />
            ))}
          </div>
        </PhaseCard>

        <PhaseCard
          title="testes de segurança"
          action={!disabled && (
            <button onClick={addTeste} className="flex items-center gap-1 text-xs text-terra hover:underline">
              <IconPlus size={12} /> adicionar
            </button>
          )}
        >
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {testes.length === 0 && <p className="text-xs text-faint">nenhum teste definido</p>}
            {testes.map((t, i) => (
              <div key={i} className="flex items-center gap-2 border border-border rounded-btn px-2 py-1.5">
                <input
                  type="checkbox"
                  checked={t.executado || false}
                  onChange={e => updateTeste(i, { ...t, executado: e.target.checked })}
                  disabled={disabled}
                />
                <input
                  value={t.teste || ''}
                  onChange={e => updateTeste(i, { ...t, teste: e.target.value })}
                  disabled={disabled}
                  className="flex-1 text-xs bg-transparent outline-none text-dark"
                  placeholder="teste..."
                />
                <input
                  value={t.ferramenta || ''}
                  onChange={e => updateTeste(i, { ...t, ferramenta: e.target.value })}
                  disabled={disabled}
                  className="w-24 text-[10px] bg-transparent outline-none text-faint text-right"
                  placeholder="ferramenta"
                />
                {!disabled && (
                  <button onClick={() => updateFn(prev => ({ ...prev, testesSeguranca: (prev.testesSeguranca || []).filter((_, j) => j !== i) }))} className="text-faint hover:text-red-400">
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
