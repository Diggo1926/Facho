import { useEffect, useState, useCallback } from 'react';
import api from '../../services/api.jsx';
import {
  IconPlus, IconLoader2, IconFileText, IconFileCheck, IconFileX,
  IconCheck, IconX, IconUpload, IconDownload, IconAlertTriangle,
  IconChevronDown,
} from '@tabler/icons-react';

const STATUS_CONFIG = {
  rascunho:    { label: 'Rascunho',     bg: '#EDE4D8', color: '#8B5A2B' },
  em_revisao:  { label: 'Em Revisão',   bg: '#E8EEF8', color: '#3A5A8B' },
  aprovado:    { label: 'Aprovado',     bg: '#E8F0DC', color: '#4A6A1F' },
  assinado:    { label: 'Assinado',     bg: '#DFF0EA', color: '#1A6A4F' },
  cancelado:   { label: 'Cancelado',    bg: '#F0E0DC', color: '#8B2B2B' },
};

const TIPO_LABELS = {
  desenvolvimento:    'Desenvolvimento',
  licenca_manutencao: 'Licença e Manutenção',
  nda:                'NDA',
  outro:              'Outro',
};

const STATUS_TRANSITIONS = {
  rascunho:   ['em_revisao', 'aprovado', 'cancelado'],
  em_revisao: ['aprovado', 'rascunho', 'cancelado'],
  aprovado:   ['assinado', 'em_revisao', 'cancelado'],
  assinado:   [],
  cancelado:  [],
};

function ContractCard({ contract, onAction }) {
  const s = STATUS_CONFIG[contract.status] || STATUS_CONFIG.rascunho;
  const temAssinado = contract.files?.some(f => f.tipoArquivo === 'assinado');
  const [showTransitions, setShowTransitions] = useState(false);
  const transitions = STATUS_TRANSITIONS[contract.status] || [];

  return (
    <div className="bg-surface border border-border rounded-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span
              className="text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0"
              style={{ backgroundColor: s.bg, color: s.color }}
            >
              {s.label}
            </span>
            <span className="text-[10px] text-faint">{TIPO_LABELS[contract.tipo] || contract.tipo}</span>
            <span className="text-[10px] text-faint">v{contract.versao}</span>
            {temAssinado && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#DFF0EA] text-[#1A6A4F] font-medium flex items-center gap-1">
                <IconFileCheck size={10} /> PDF assinado
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-dark truncate">{contract.titulo}</p>
          {contract.valorTotal && (
            <p className="text-xs text-faint mt-0.5">
              R$ {Number(contract.valorTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          )}
          {contract.assinadoEm && (
            <p className="text-[11px] text-faint">
              assinado em {new Date(contract.assinadoEm).toLocaleDateString('pt-BR')}
            </p>
          )}
        </div>
      </div>

      {/* Ações */}
      <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-border">
        <button
          onClick={() => onAction('generate-pdf', contract)}
          className="flex items-center gap-1 text-xs text-muted hover:text-terra transition-colors"
        >
          <IconFileText size={13} /> gerar PDF
        </button>

        {contract.status !== 'assinado' && contract.status !== 'cancelado' && (
          <button
            onClick={() => onAction('upload-signed', contract)}
            className="flex items-center gap-1 text-xs text-muted hover:text-terra transition-colors"
          >
            <IconUpload size={13} /> PDF assinado
          </button>
        )}

        {contract.files?.length > 0 && (
          <button
            onClick={() => onAction('download', contract)}
            className="flex items-center gap-1 text-xs text-muted hover:text-terra transition-colors"
          >
            <IconDownload size={13} /> baixar
          </button>
        )}

        {transitions.length > 0 && (
          <div className="relative ml-auto">
            <button
              onClick={() => setShowTransitions(v => !v)}
              className="flex items-center gap-1 text-xs text-faint hover:text-dark transition-colors"
            >
              status <IconChevronDown size={11} />
            </button>
            {showTransitions && (
              <div className="absolute right-0 bottom-6 z-10 bg-surface border border-border rounded-card shadow-lg py-1 min-w-[130px]">
                {transitions.map(t => {
                  const ts = STATUS_CONFIG[t];
                  return (
                    <button
                      key={t}
                      onClick={() => { onAction('change-status', contract, t); setShowTransitions(false); }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-cream flex items-center gap-2"
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: ts.color }}
                      />
                      {ts.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Chaves gerenciadas pelo formulário de identificação/endereço — excluídas do tab "Contrato"
const BUILTIN_KEYS = new Set([
  '_tipo_pessoa',
  'contratante_nome', 'contratante_cpf', 'contratante_rg',
  'contratante_estado_civil', 'contratante_profissao',
  'contratante_razao_social', 'contratante_cnpj',
  'contratante_representante_legal', 'contratante_cpf_representante',
  'contratante_rua', 'contratante_numero', 'contratante_bairro',
  'contratante_cidade', 'contratante_uf', 'contratante_cep',
  'contratante_qualificacao', 'contratante_endereco',
]);

const UF_LIST = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS',
  'MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
];

const ESTADO_CIVIL_LIST = ['solteiro(a)', 'casado(a)', 'divorciado(a)', 'viúvo(a)', 'união estável'];

const TABS = ['Identificação', 'Endereço', 'Contrato'];

function maskCPF(v) {
  return v.replace(/\D/g,'').slice(0,11)
    .replace(/(\d{3})(\d)/,'$1.$2')
    .replace(/(\d{3})(\d)/,'$1.$2')
    .replace(/(\d{3})(\d{1,2})$/,'$1-$2');
}
function maskCNPJ(v) {
  return v.replace(/\D/g,'').slice(0,14)
    .replace(/(\d{2})(\d)/,'$1.$2')
    .replace(/(\d{3})(\d)/,'$1.$2')
    .replace(/(\d{3})(\d)/,'$1/$2')
    .replace(/(\d{4})(\d{1,2})$/,'$1-$2');
}
function maskCEP(v) {
  return v.replace(/\D/g,'').slice(0,8)
    .replace(/(\d{5})(\d{1,3})$/,'$1-$2');
}

function inputCls(hasError) {
  return `w-full text-sm bg-cream border rounded-btn px-3 py-2 text-dark placeholder:text-faint focus:outline-none focus:ring-1 focus:ring-terra ${
    hasError ? 'border-red-400 focus:ring-red-400' : 'border-border'
  }`;
}

function FieldError({ msg }) {
  if (!msg) return null;
  return <p className="text-[11px] text-red-500 mt-1">{msg}</p>;
}

function NewContractModal({ projectId, onClose, onCreated }) {
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loadingFields, setLoadingFields] = useState(false);

  const [tab, setTab] = useState(0);
  const [tipoPessoa, setTipoPessoa] = useState('PF');

  const [ident, setIdent] = useState({
    nome: '', cpf: '', rg: '', estadoCivil: '', profissao: '',
    razaoSocial: '', cnpj: '', representanteLegal: '', cpfRepresentante: '',
  });
  const [endereco, setEndereco] = useState({
    rua: '', numero: '', bairro: '', cidade: '', uf: '', cep: '',
  });

  const [titulo, setTitulo] = useState('');
  const [valorTotal, setValorTotal] = useState('');
  const [camposList, setCamposList] = useState([]);
  const [campos, setCampos] = useState({});

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    api.get('/api/contract-templates')
      .then(r => setTemplates(r.data))
      .catch(() => {})
      .finally(() => setLoadingTemplates(false));
  }, []);

  async function selectTemplate(t) {
    setSelectedTemplate(t);
    setTitulo(t.nome);
    setCamposList([]);
    setCampos({});
    setTab(0);
    setErrors({});
    setSaveError('');
    setLoadingFields(true);
    try {
      const { data: full } = await api.get(`/api/contract-templates/${t.id}`);
      const detected = [...new Set(
        [...(full.corpo || '').matchAll(/\{\{(\w+)\}\}/g)].map(m => m[1])
      )];
      const defined = new Map((full.campos || []).map(c => [c.chave, c]));
      const extra = detected
        .filter(k => !defined.has(k) && !BUILTIN_KEYS.has(k))
        .map(k => ({ chave: k, rotulo: k.replace(/_/g, ' '), tipo: 'texto', placeholder: '' }));
      const all = [...(full.campos || []).filter(c => !BUILTIN_KEYS.has(c.chave)), ...extra];
      setCamposList(all);
      const init = {};
      all.forEach(c => { init[c.chave] = ''; });
      setCampos(init);
    } catch {
      setCamposList([]);
    } finally {
      setLoadingFields(false);
    }
  }

  function setI(key, val) {
    setIdent(p => ({ ...p, [key]: val }));
    if (errors[key]) setErrors(p => ({ ...p, [key]: '' }));
  }
  function setE(key, val) {
    setEndereco(p => ({ ...p, [key]: val }));
    if (errors[key]) setErrors(p => ({ ...p, [key]: '' }));
  }

  function validateTab(idx) {
    const errs = {};
    if (idx === 0) {
      if (tipoPessoa === 'PF') {
        if (!ident.nome.trim()) errs.nome = 'Nome obrigatório';
        if (!ident.cpf.trim()) errs.cpf = 'CPF obrigatório';
        else if (ident.cpf.replace(/\D/g,'').length !== 11) errs.cpf = 'CPF inválido';
      } else {
        if (!ident.razaoSocial.trim()) errs.razaoSocial = 'Razão social obrigatória';
        if (!ident.cnpj.trim()) errs.cnpj = 'CNPJ obrigatório';
        else if (ident.cnpj.replace(/\D/g,'').length !== 14) errs.cnpj = 'CNPJ inválido';
        if (!ident.representanteLegal.trim()) errs.representanteLegal = 'Representante legal obrigatório';
      }
    }
    if (idx === 1) {
      if (!endereco.rua.trim()) errs.rua = 'Rua obrigatória';
      if (!endereco.numero.trim()) errs.numero = 'Número obrigatório';
      if (!endereco.bairro.trim()) errs.bairro = 'Bairro obrigatório';
      if (!endereco.cidade.trim()) errs.cidade = 'Cidade obrigatória';
      if (!endereco.uf) errs.uf = 'UF obrigatória';
      if (!endereco.cep.trim()) errs.cep = 'CEP obrigatório';
      else if (endereco.cep.replace(/\D/g,'').length !== 8) errs.cep = 'CEP inválido';
    }
    if (idx === 2) {
      if (!titulo.trim()) errs.titulo = 'Título obrigatório';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleNext() {
    if (validateTab(tab)) setTab(t => t + 1);
  }

  async function handleSubmit() {
    if (!validateTab(2)) return;
    setSaving(true);
    setSaveError('');
    try {
      const dados = {
        _tipo_pessoa: tipoPessoa,
        ...(tipoPessoa === 'PF' ? {
          contratante_nome: ident.nome,
          contratante_cpf: ident.cpf,
          contratante_rg: ident.rg,
          contratante_estado_civil: ident.estadoCivil,
          contratante_profissao: ident.profissao,
        } : {
          contratante_razao_social: ident.razaoSocial,
          contratante_cnpj: ident.cnpj,
          contratante_representante_legal: ident.representanteLegal,
          contratante_cpf_representante: ident.cpfRepresentante,
        }),
        contratante_rua: endereco.rua,
        contratante_numero: endereco.numero,
        contratante_bairro: endereco.bairro,
        contratante_cidade: endereco.cidade,
        contratante_uf: endereco.uf,
        contratante_cep: endereco.cep,
        ...campos,
      };
      await api.post(`/api/projects/${projectId}/contracts`, {
        templateId: selectedTemplate.id,
        titulo: titulo.trim(),
        dados,
        valorTotal: valorTotal ? parseFloat(valorTotal) : null,
      });
      onCreated();
      onClose();
    } catch (err) {
      setSaveError(err.response?.data?.error || 'Erro ao criar contrato.');
    } finally {
      setSaving(false);
    }
  }

  // Tela de seleção de modelo
  if (!selectedTemplate) {
    return (
      <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center md:p-6">
        <div className="absolute inset-0 bg-black/40 hidden md:block" onClick={onClose} />
        <div className="relative bg-surface w-full h-full md:h-auto md:max-w-lg md:rounded-card md:border border-border shadow-lg z-10 flex flex-col">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 className="text-sm font-medium text-dark">novo contrato — escolha o modelo</h2>
            <button onClick={onClose} className="text-faint hover:text-dark"><IconX size={16} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-5">
            {loadingTemplates ? (
              <div className="flex items-center gap-2 text-faint text-xs">
                <IconLoader2 size={14} className="animate-spin" /> carregando modelos...
              </div>
            ) : templates.length === 0 ? (
              <p className="text-xs text-faint">
                nenhum modelo cadastrado. Crie um em{' '}
                <a href="/contratos/modelos" className="text-terra hover:underline">Modelos de Contrato</a>.
              </p>
            ) : (
              <div className="grid gap-2">
                {templates.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => selectTemplate(t)}
                    className="text-left px-3 py-2.5 rounded-btn border border-border text-xs transition-colors hover:bg-cream hover:border-terra"
                  >
                    <span className="font-medium text-dark">{t.nome}</span>
                    <span className="text-faint ml-2">· {TIPO_LABELS[t.tipo] || t.tipo}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="p-5 border-t border-border">
            <button onClick={onClose} className="btn-secondary text-sm w-full">cancelar</button>
          </div>
        </div>
      </div>
    );
  }

  // Formulário em abas
  return (
    <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center md:p-6">
      <div className="absolute inset-0 bg-black/40 hidden md:block" onClick={onClose} />
      <div className="relative bg-surface w-full h-full md:h-auto md:max-w-lg md:rounded-card md:border border-border shadow-lg z-10 flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border">
          <div>
            <h2 className="text-sm font-medium text-dark">novo contrato</h2>
            <p className="text-xs text-faint mt-0.5">
              {selectedTemplate.nome}
              <button
                type="button"
                onClick={() => setSelectedTemplate(null)}
                className="ml-2 text-terra hover:underline"
              >trocar modelo</button>
            </p>
          </div>
          <button onClick={onClose} className="text-faint hover:text-dark"><IconX size={16} /></button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-border px-5">
          {TABS.map((label, i) => (
            <button
              key={i}
              type="button"
              onClick={() => { if (tab > i) setTab(i); }}
              className={`py-2.5 px-1 mr-5 text-xs border-b-2 transition-colors ${
                tab === i
                  ? 'border-terra text-terra font-medium'
                  : tab > i
                  ? 'border-transparent text-muted hover:text-dark'
                  : 'border-transparent text-faint cursor-default'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* TAB 0 — Identificação */}
          {tab === 0 && (
            <div className="space-y-4">
              <div className="flex gap-2">
                {['PF', 'PJ'].map(tipo => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => { setTipoPessoa(tipo); setErrors({}); }}
                    className={`flex-1 py-2 text-xs rounded-btn border font-medium transition-colors ${
                      tipoPessoa === tipo
                        ? 'border-terra bg-[#F5EDE5] text-terra'
                        : 'border-border text-muted hover:bg-cream'
                    }`}
                  >
                    {tipo === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}
                  </button>
                ))}
              </div>

              {tipoPessoa === 'PF' ? (
                <>
                  <div>
                    <label className="block text-xs text-muted mb-1.5">Nome completo <span className="text-red-400">*</span></label>
                    <input value={ident.nome} onChange={e => setI('nome', e.target.value)}
                      placeholder="Nome completo do contratante"
                      className={inputCls(!!errors.nome)} />
                    <FieldError msg={errors.nome} />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1.5">CPF <span className="text-red-400">*</span></label>
                    <input value={ident.cpf}
                      onChange={e => setI('cpf', maskCPF(e.target.value))}
                      placeholder="000.000.000-00"
                      className={inputCls(!!errors.cpf)} />
                    <FieldError msg={errors.cpf} />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1.5">RG <span className="text-faint text-[11px]">(opcional)</span></label>
                    <input value={ident.rg} onChange={e => setI('rg', e.target.value)}
                      placeholder="Documento de identidade"
                      className={inputCls(false)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-muted mb-1.5">Estado civil <span className="text-faint text-[11px]">(opcional)</span></label>
                      <select value={ident.estadoCivil} onChange={e => setI('estadoCivil', e.target.value)}
                        className={inputCls(false)}>
                        <option value="">— selecione —</option>
                        {ESTADO_CIVIL_LIST.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-muted mb-1.5">Profissão <span className="text-faint text-[11px]">(opcional)</span></label>
                      <input value={ident.profissao} onChange={e => setI('profissao', e.target.value)}
                        placeholder="ex: designer"
                        className={inputCls(false)} />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs text-muted mb-1.5">Razão social <span className="text-red-400">*</span></label>
                    <input value={ident.razaoSocial} onChange={e => setI('razaoSocial', e.target.value)}
                      placeholder="Nome jurídico da empresa"
                      className={inputCls(!!errors.razaoSocial)} />
                    <FieldError msg={errors.razaoSocial} />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1.5">CNPJ <span className="text-red-400">*</span></label>
                    <input value={ident.cnpj}
                      onChange={e => setI('cnpj', maskCNPJ(e.target.value))}
                      placeholder="00.000.000/0000-00"
                      className={inputCls(!!errors.cnpj)} />
                    <FieldError msg={errors.cnpj} />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1.5">Representante legal <span className="text-red-400">*</span></label>
                    <input value={ident.representanteLegal} onChange={e => setI('representanteLegal', e.target.value)}
                      placeholder="Nome do responsável legal"
                      className={inputCls(!!errors.representanteLegal)} />
                    <FieldError msg={errors.representanteLegal} />
                  </div>
                  <div>
                    <label className="block text-xs text-muted mb-1.5">CPF do representante <span className="text-faint text-[11px]">(opcional)</span></label>
                    <input value={ident.cpfRepresentante}
                      onChange={e => setI('cpfRepresentante', maskCPF(e.target.value))}
                      placeholder="000.000.000-00"
                      className={inputCls(false)} />
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 1 — Endereço */}
          {tab === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-muted mb-1.5">Rua / Avenida <span className="text-red-400">*</span></label>
                <input value={endereco.rua} onChange={e => setE('rua', e.target.value)}
                  placeholder="Rua das Flores"
                  className={inputCls(!!errors.rua)} />
                <FieldError msg={errors.rua} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-muted mb-1.5">Número <span className="text-red-400">*</span></label>
                  <input value={endereco.numero} onChange={e => setE('numero', e.target.value)}
                    placeholder="123"
                    className={inputCls(!!errors.numero)} />
                  <FieldError msg={errors.numero} />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-muted mb-1.5">Bairro <span className="text-red-400">*</span></label>
                  <input value={endereco.bairro} onChange={e => setE('bairro', e.target.value)}
                    placeholder="Centro"
                    className={inputCls(!!errors.bairro)} />
                  <FieldError msg={errors.bairro} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs text-muted mb-1.5">Cidade <span className="text-red-400">*</span></label>
                  <input value={endereco.cidade} onChange={e => setE('cidade', e.target.value)}
                    placeholder="São Paulo"
                    className={inputCls(!!errors.cidade)} />
                  <FieldError msg={errors.cidade} />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1.5">UF <span className="text-red-400">*</span></label>
                  <select value={endereco.uf} onChange={e => setE('uf', e.target.value)}
                    className={inputCls(!!errors.uf)}>
                    <option value="">—</option>
                    {UF_LIST.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                  <FieldError msg={errors.uf} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1.5">CEP <span className="text-red-400">*</span></label>
                <input value={endereco.cep}
                  onChange={e => setE('cep', maskCEP(e.target.value))}
                  placeholder="00000-000"
                  className={inputCls(!!errors.cep)} />
                <FieldError msg={errors.cep} />
              </div>
            </div>
          )}

          {/* TAB 2 — Contrato */}
          {tab === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-muted mb-1.5">Título do contrato <span className="text-red-400">*</span></label>
                <input
                  value={titulo}
                  onChange={e => { setTitulo(e.target.value); if (errors.titulo) setErrors(p => ({ ...p, titulo: '' })); }}
                  placeholder="ex: Contrato — Cliente XYZ"
                  className={inputCls(!!errors.titulo)}
                />
                <FieldError msg={errors.titulo} />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1.5">Valor total <span className="text-faint text-[11px]">(opcional)</span></label>
                <input
                  type="number"
                  value={valorTotal}
                  onChange={e => setValorTotal(e.target.value)}
                  placeholder="0,00"
                  min="0"
                  step="0.01"
                  className={inputCls(false)}
                />
              </div>

              {loadingFields ? (
                <div className="flex items-center gap-2 text-faint text-xs py-2">
                  <IconLoader2 size={14} className="animate-spin" /> carregando campos do modelo...
                </div>
              ) : camposList.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-border">
                  <p className="text-xs font-medium text-muted">campos do modelo</p>
                  {camposList.map(campo => (
                    <div key={campo.chave}>
                      <label className="block text-xs text-muted mb-1">{campo.rotulo}</label>
                      {campo.tipo === 'textarea' ? (
                        <textarea
                          value={campos[campo.chave] || ''}
                          onChange={e => setCampos(p => ({ ...p, [campo.chave]: e.target.value }))}
                          placeholder={campo.placeholder || campo.rotulo}
                          rows={4}
                          className="w-full text-sm bg-cream border border-border rounded-btn px-3 py-2 text-dark placeholder:text-faint focus:outline-none focus:ring-1 focus:ring-terra resize-y"
                        />
                      ) : (
                        <input
                          type={campo.tipo === 'data' ? 'date' : campo.tipo === 'numero' ? 'number' : 'text'}
                          value={campos[campo.chave] || ''}
                          onChange={e => setCampos(p => ({ ...p, [campo.chave]: e.target.value }))}
                          placeholder={campo.placeholder || campo.rotulo}
                          className={inputCls(false)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {saveError && (
                <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 border border-red-200 rounded-btn px-3 py-2">
                  <IconAlertTriangle size={13} /> {saveError}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rodapé de navegação */}
        <div className="p-5 border-t border-border flex gap-2">
          {tab > 0 && (
            <button type="button" onClick={() => setTab(t => t - 1)} className="btn-secondary text-sm">
              voltar
            </button>
          )}
          {tab < TABS.length - 1 ? (
            <button type="button" onClick={handleNext} className="btn-primary flex-1 text-sm">
              próximo
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="btn-primary flex-1 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? <IconLoader2 size={14} className="animate-spin" /> : <IconCheck size={14} />}
              {saving ? 'salvando...' : 'criar contrato'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function UploadSignedModal({ contract, onClose, onUploaded }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function handleUpload() {
    if (!file) { setError('Selecione um arquivo PDF.'); return; }
    if (file.type !== 'application/pdf') { setError('Apenas arquivos PDF são aceitos.'); return; }
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('pdf', file);
      await api.post(`/api/contracts/${contract.id}/upload-signed`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onUploaded();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao enviar arquivo.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-surface border border-border rounded-card shadow-lg w-full max-w-sm z-10 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-dark">anexar PDF assinado</h2>
          <button onClick={onClose} className="text-faint hover:text-dark"><IconX size={16} /></button>
        </div>

        <p className="text-xs text-faint">
          Envie o PDF do contrato assinado via gov.br. O status será automaticamente marcado como <strong>assinado</strong>.
        </p>

        <label className="block cursor-pointer">
          <div className={`border-2 border-dashed rounded-card p-6 text-center transition-colors ${
            file ? 'border-terra bg-[#F5EDE5]' : 'border-border hover:border-terra hover:bg-cream'
          }`}>
            <IconUpload size={24} className={`mx-auto mb-2 ${file ? 'text-terra' : 'text-faint'}`} />
            {file ? (
              <p className="text-xs text-terra font-medium">{file.name}</p>
            ) : (
              <p className="text-xs text-faint">clique para selecionar o PDF assinado</p>
            )}
          </div>
          <input
            type="file"
            accept="application/pdf"
            className="sr-only"
            onChange={e => { setFile(e.target.files[0]); setError(''); }}
          />
        </label>

        {error && (
          <div className="flex items-center gap-2 text-red-600 text-xs bg-red-50 border border-red-200 rounded-btn px-3 py-2">
            <IconAlertTriangle size={13} /> {error}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleUpload}
            disabled={uploading || !file}
            className="btn-primary flex-1 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {uploading ? <IconLoader2 size={14} className="animate-spin" /> : <IconFileCheck size={14} />}
            {uploading ? 'enviando...' : 'anexar assinado'}
          </button>
          <button onClick={onClose} className="btn-secondary text-sm">cancelar</button>
        </div>
      </div>
    </div>
  );
}

export default function ContractsTab({ projectId }) {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [uploadTarget, setUploadTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/api/projects/${projectId}/contracts`);
      setContracts(data);
    } catch {}
    setLoading(false);
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  async function handleAction(action, contract, extra) {
    if (action === 'generate-pdf') {
      setActionLoading(contract.id + '-pdf');
      try {
        const res = await api.post(`/api/contracts/${contract.id}/generate-pdf`, {}, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = `${contract.titulo.toLowerCase().replace(/\s+/g, '-')}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        load();
      } catch {
        alert('Erro ao gerar PDF.');
      } finally {
        setActionLoading(null);
      }
    }

    if (action === 'upload-signed') {
      setUploadTarget(contract);
    }

    if (action === 'download') {
      const file = [...(contract.files || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
      if (!file) return;
      setActionLoading(contract.id + '-dl');
      try {
        const res = await api.get(`/api/contracts/${contract.id}/files/${file.id}`, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
        const a = document.createElement('a');
        a.href = url;
        a.download = `${contract.titulo.toLowerCase().replace(/\s+/g, '-')}-${file.tipoArquivo}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } catch {
        alert('Erro ao baixar arquivo.');
      } finally {
        setActionLoading(null);
      }
    }

    if (action === 'change-status') {
      setActionLoading(contract.id + '-status');
      try {
        await api.put(`/api/contracts/${contract.id}`, { status: extra });
        load();
      } catch {
        alert('Erro ao atualizar status.');
      } finally {
        setActionLoading(null);
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32 text-faint">
        <IconLoader2 size={20} className="animate-spin" />
      </div>
    );
  }

  const ativos = contracts.filter(c => c.status !== 'cancelado');
  const cancelados = contracts.filter(c => c.status === 'cancelado');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-faint">
          {ativos.length} {ativos.length === 1 ? 'contrato' : 'contratos'}
          {cancelados.length > 0 && ` · ${cancelados.length} cancelado${cancelados.length > 1 ? 's' : ''}`}
        </p>
        <button
          onClick={() => setShowNew(true)}
          className="btn-primary flex items-center gap-1.5 text-xs"
        >
          <IconPlus size={13} /> novo contrato
        </button>
      </div>

      {ativos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center border border-dashed border-border rounded-card">
          <IconFileText size={40} className="text-border" />
          <p className="text-sm text-faint">nenhum contrato ainda</p>
          <button onClick={() => setShowNew(true)} className="btn-primary text-xs">
            criar primeiro contrato
          </button>
        </div>
      )}

      <div className="grid gap-3">
        {ativos.map(c => (
          <div key={c.id} className="relative">
            {actionLoading?.startsWith(c.id) && (
              <div className="absolute inset-0 bg-surface/70 rounded-card flex items-center justify-center z-10">
                <IconLoader2 size={18} className="animate-spin text-terra" />
              </div>
            )}
            <ContractCard contract={c} onAction={handleAction} />
          </div>
        ))}
      </div>

      {cancelados.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-xs text-faint hover:text-muted list-none flex items-center gap-1.5 pt-2">
            <IconFileX size={13} />
            {cancelados.length} contrato{cancelados.length > 1 ? 's' : ''} cancelado{cancelados.length > 1 ? 's' : ''}
          </summary>
          <div className="grid gap-3 mt-3 opacity-60">
            {cancelados.map(c => (
              <ContractCard key={c.id} contract={c} onAction={handleAction} />
            ))}
          </div>
        </details>
      )}

      {showNew && (
        <NewContractModal
          projectId={projectId}
          onClose={() => setShowNew(false)}
          onCreated={load}
        />
      )}

      {uploadTarget && (
        <UploadSignedModal
          contract={uploadTarget}
          onClose={() => setUploadTarget(null)}
          onUploaded={() => { setUploadTarget(null); load(); }}
        />
      )}
    </div>
  );
}
