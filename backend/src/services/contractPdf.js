import puppeteer from 'puppeteer';

const TIPO_LABELS = {
  desenvolvimento: 'Contrato de Desenvolvimento de Software',
  licenca_manutencao: 'Contrato de Licença e Manutenção',
  nda: 'Acordo de Não Divulgação (NDA)',
  outro: 'Contrato',
};

function buildQualificacao(dados) {
  const tipo = dados._tipo_pessoa;
  if (tipo === 'PF') {
    const parts = [dados.contratante_nome].filter(Boolean);
    if (dados.contratante_estado_civil) parts.push(dados.contratante_estado_civil);
    if (dados.contratante_profissao) parts.push(dados.contratante_profissao);
    if (dados.contratante_cpf) parts.push(`inscrito no CPF sob o nº ${dados.contratante_cpf}`);
    if (dados.contratante_rg) parts.push(`RG nº ${dados.contratante_rg}`);
    return parts.join(', ');
  }
  if (tipo === 'PJ') {
    let q = dados.contratante_razao_social || '';
    if (dados.contratante_cnpj) q += `, pessoa jurídica inscrita no CNPJ sob o nº ${dados.contratante_cnpj}`;
    if (dados.contratante_representante_legal) q += `, neste ato representada por ${dados.contratante_representante_legal}`;
    if (dados.contratante_cpf_representante) q += `, CPF nº ${dados.contratante_cpf_representante}`;
    return q;
  }
  return '';
}

function buildEndereco(dados) {
  const parts = [];
  if (dados.contratante_rua) {
    parts.push(dados.contratante_numero
      ? `${dados.contratante_rua}, nº ${dados.contratante_numero}`
      : dados.contratante_rua);
  }
  if (dados.contratante_bairro) parts.push(dados.contratante_bairro);
  if (dados.contratante_cidade || dados.contratante_uf) {
    parts.push([dados.contratante_cidade, dados.contratante_uf].filter(Boolean).join('/'));
  }
  if (dados.contratante_cep) parts.push(`CEP ${dados.contratante_cep}`);
  return parts.join(', ');
}

export async function generateContractPdf(contract, template) {
  let corpo = template.corpo;

  const dados = { ...(contract.dados || {}) };
  dados.contratante_qualificacao = buildQualificacao(dados);
  dados.contratante_endereco = buildEndereco(dados);

  const contratanteNome = dados._tipo_pessoa === 'PJ'
    ? (dados.contratante_razao_social || 'Contratante')
    : (dados.contratante_nome || 'Contratante');
  const contratanteDoc = dados._tipo_pessoa === 'PJ'
    ? (dados.contratante_cnpj ? `CNPJ ${dados.contratante_cnpj}` : '')
    : (dados.contratante_cpf ? `CPF ${dados.contratante_cpf}` : '');

  for (const [key, value] of Object.entries(dados)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    corpo = corpo.replace(regex, value ?? '');
  }
  corpo = corpo.replace(/\{\{[^}]+\}\}/g, '');

  // Converter quebras de linha em parágrafos HTML, destacando títulos de cláusula
  const corpoHtml = corpo
    .split(/\n\n+/)
    .map(p => {
      const trimmed = p.trim();
      const ehTituloClausula = /^cl[áa]usula\b/i.test(trimmed) && trimmed.length < 120;
      const inner = trimmed.replace(/\n/g, '<br>');
      return ehTituloClausula ? `<p class="clausula-titulo">${inner}</p>` : `<p>${inner}</p>`;
    })
    .join('');

  const tipoLabel = TIPO_LABELS[contract.tipo] || 'Contrato';
  const dataFormatada = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: Georgia, 'Times New Roman', Times, serif;
      color: #111;
      background: #fff;
      font-size: 12.5px;
      line-height: 1.6;
    }

    .titulo-contrato {
      font-size: 18px;
      font-weight: 700;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 4px;
    }

    .subtitulo-contrato {
      font-size: 13px;
      font-style: italic;
      text-align: center;
      color: #333;
      margin-bottom: 32px;
    }

    p {
      color: #111;
      margin-bottom: 12px;
      text-align: justify;
    }

    .clausula-titulo {
      font-weight: 700;
      margin-top: 22px;
      margin-bottom: 8px;
    }

    .data-assinatura {
      text-align: center;
      margin-top: 48px;
      margin-bottom: 8px;
    }

    .assinaturas {
      margin-top: 56px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
    }

    .assinatura-bloco {
      border-top: 1px solid #111;
      padding-top: 8px;
      text-align: center;
    }

    .assinatura-bloco .nome {
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 2px;
    }

    .assinatura-bloco .cargo {
      font-size: 11px;
      color: #333;
    }
  </style>
</head>
<body>

  <div class="titulo-contrato">${tipoLabel.toUpperCase()}</div>
  ${contract.titulo && contract.titulo !== tipoLabel ? `<div class="subtitulo-contrato">${contract.titulo}</div>` : ''}

  ${corpoHtml}

  <p class="data-assinatura">${dataFormatada}.</p>

  <div class="assinaturas">
    <div class="assinatura-bloco">
      <p class="nome">Rodrigo Carvalho Mamede</p>
      <p class="cargo">Prestador de Serviços</p>
    </div>
    <div class="assinatura-bloco">
      <p class="nome">${contratanteNome}</p>
      <p class="cargo">${contratanteDoc || '&nbsp;'}</p>
    </div>
  </div>

</body>
</html>`;

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '2.5cm', right: '2.5cm', bottom: '2.5cm', left: '2.5cm' },
    displayHeaderFooter: true,
    headerTemplate: '<span></span>',
    footerTemplate: `<div style="width: 100%; text-align: center; font-size: 9px; color: #333; font-family: Georgia, 'Times New Roman', serif;">Página <span class="pageNumber"></span> de <span class="totalPages"></span></div>`,
  });

  await browser.close();
  return Buffer.from(pdf);
}
