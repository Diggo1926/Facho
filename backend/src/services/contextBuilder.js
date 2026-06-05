export function buildContext(project, phases, references, preferences) {
  const fasesConcluidas = phases
    .filter((p) => p.status === 'concluida')
    .map((p) => p.nome)
    .join(', ');

  const faseAtual = phases.find((p) => p.numero === project.currentPhase);
  const refsList = references.map((r) => `- ${r.nome} (${r.subcategoria || r.categoria})`).join('\n');

  const paleta = faseAtual?.paleta ? JSON.stringify(faseAtual.paleta, null, 2) : null;
  const tipografia = faseAtual?.tipografia ? JSON.stringify(faseAtual.tipografia, null, 2) : null;

  return `--- CONTEXTO DO PROJETO ---

PROJETO: ${project.nome}
CLIENTE: ${project.cliente || 'não informado'}
TIPO: ${project.tipo || 'não informado'}
COMPLEXIDADE: ${project.complexidade || 'não informada'}

FASE ATUAL: ${faseAtual?.numero} — ${faseAtual?.nome} (${faseAtual?.status})
FASES CONCLUÍDAS: ${fasesConcluidas || 'nenhuma'}

${paleta ? `PALETA DEFINIDA:\n${paleta}\n` : ''}${tipografia ? `TIPOGRAFIA DEFINIDA:\n${tipografia}\n` : ''}
REFERÊNCIAS VINCULADAS:
${refsList || 'nenhuma vinculada'}

NOTAS DA FASE ATUAL:
${faseAtual?.notas || 'sem notas'}

${preferences?.padroesCodigo ? `PADRÕES DE CÓDIGO:\n${preferences.padroesCodigo}\n` : ''}${preferences?.observacoesFixas ? `OBSERVAÇÕES FIXAS:\n${preferences.observacoesFixas}\n` : ''}${preferences?.stackFavorita ? `STACK FAVORITA:\n${preferences.stackFavorita}\n` : ''}
---`;
}
