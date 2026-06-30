import puppeteer from 'puppeteer';

const TIPO_LABELS = {
  desenvolvimento: 'Contrato de Desenvolvimento de Software',
  licenca_manutencao: 'Contrato de Licença e Manutenção',
  nda: 'Acordo de Não Divulgação (NDA)',
  outro: 'Contrato',
};

export async function generateContractPdf(contract, template) {
  let corpo = template.corpo;

  if (contract.dados && typeof contract.dados === 'object') {
    for (const [key, value] of Object.entries(contract.dados)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      corpo = corpo.replace(regex, value ?? '—');
    }
  }
  corpo = corpo.replace(/\{\{[^}]+\}\}/g, '—');

  // Converter quebras de linha em parágrafos HTML
  const corpoHtml = corpo
    .split(/\n\n+/)
    .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
    .join('');

  const tipoLabel = TIPO_LABELS[contract.tipo] || 'Contrato';
  const dataFormatada = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'DM Sans', sans-serif;
      color: #2C1810;
      background: #fff;
      font-size: 13px;
      line-height: 1.8;
    }

    .cover {
      background: #F5F0E8;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 80px;
      page-break-after: always;
    }

    .cover-label {
      font-size: 10px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #A0896E;
      margin-bottom: 20px;
    }

    .cover-tipo {
      font-size: 32px;
      font-weight: 700;
      color: #2C1810;
      line-height: 1.2;
      margin-bottom: 12px;
    }

    .cover-titulo {
      font-size: 20px;
      color: #7A4A3A;
      margin-bottom: 48px;
    }

    .cover-meta {
      display: flex;
      gap: 48px;
      border-top: 1px solid #E0D8CC;
      padding-top: 28px;
    }

    .cover-meta-item label {
      font-size: 10px;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #A0896E;
      display: block;
      margin-bottom: 4px;
    }

    .cover-meta-item span {
      font-size: 15px;
      font-weight: 500;
      color: #2C1810;
    }

    .corpo-page {
      padding: 64px 80px;
    }

    .section-label {
      font-size: 10px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #A0896E;
      margin-bottom: 6px;
    }

    h2 {
      font-size: 22px;
      font-weight: 700;
      color: #2C1810;
      margin-bottom: 28px;
      padding-bottom: 14px;
      border-bottom: 1px solid #E0D8CC;
    }

    p {
      color: #3D2418;
      margin-bottom: 14px;
      text-align: justify;
    }

    .footer {
      margin-top: 64px;
      padding-top: 24px;
      border-top: 1px solid #E0D8CC;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #C9BFB0;
    }

    .assinaturas {
      margin-top: 80px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 48px;
    }

    .assinatura-bloco {
      border-top: 1px solid #2C1810;
      padding-top: 12px;
    }

    .assinatura-bloco p {
      font-size: 12px;
      color: #6B5440;
      margin-bottom: 2px;
    }

    .versao-badge {
      display: inline-block;
      background: #EDE4D8;
      color: #7A4A3A;
      border-radius: 4px;
      padding: 2px 10px;
      font-size: 10px;
      font-weight: 500;
    }
  </style>
</head>
<body>

  <div class="cover">
    <div class="cover-label">Facho · Rodrigo Carvalho Mamede</div>
    <div class="cover-tipo">${tipoLabel}</div>
    <div class="cover-titulo">${contract.titulo}</div>
    <div class="cover-meta">
      <div class="cover-meta-item">
        <label>Data</label>
        <span>${dataFormatada}</span>
      </div>
      <div class="cover-meta-item">
        <label>Versão</label>
        <span>v${contract.versao}</span>
      </div>
      ${contract.valorTotal ? `
      <div class="cover-meta-item">
        <label>Valor Total</label>
        <span>R$ ${Number(contract.valorTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
      </div>
      ` : ''}
      <div class="cover-meta-item">
        <label>Status</label>
        <span>${contract.status.charAt(0).toUpperCase() + contract.status.slice(1).replace('_', ' ')}</span>
      </div>
    </div>
  </div>

  <div class="corpo-page">
    <div class="section-label">Corpo do Contrato</div>
    <h2>${tipoLabel}</h2>
    ${corpoHtml}

    <div class="assinaturas">
      <div class="assinatura-bloco">
        <p>Rodrigo Carvalho Mamede</p>
        <p style="color: #A0896E">Prestador de Serviços — Diggo Dev</p>
      </div>
      <div class="assinatura-bloco">
        <p>Contratante</p>
        <p style="color: #A0896E">&nbsp;</p>
      </div>
    </div>

    <div class="footer">
      <span>Gerado via Facho · Rodrigo Carvalho Mamede</span>
      <span>${dataFormatada} · <span class="versao-badge">v${contract.versao}</span></span>
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
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
  });

  await browser.close();
  return pdf;
}
