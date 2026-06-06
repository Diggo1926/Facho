import puppeteer from 'puppeteer';

export async function generateProposal(project, phases) {
  const fase1 = phases.find(p => p.numero === 1)?.resultado || {};
  const fase2 = phases.find(p => p.numero === 2)?.resultado || {};
  const fase3 = phases.find(p => p.numero === 3)?.resultado || {};
  const fase8 = phases.find(p => p.numero === 8)?.resultado || {};

  const modulos = fase2.modulos || [];
  const stack = fase2.stack || {};
  const paleta = fase3.paleta || {};
  const funcionalidades = fase1.funcionalidades || [];
  const proximosPassos = fase8.proximosPassos || [];

  const estimativaHoras = modulos.length * 12 + 20;
  const valorSugerido = estimativaHoras * 80;

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
      font-size: 14px;
      line-height: 1.6;
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
      font-size: 11px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #A0896E;
      margin-bottom: 24px;
    }

    .cover-title {
      font-size: 48px;
      font-weight: 700;
      color: #2C1810;
      line-height: 1.1;
      margin-bottom: 16px;
    }

    .cover-client {
      font-size: 18px;
      color: #7A4A3A;
      margin-bottom: 48px;
    }

    .cover-meta {
      display: flex;
      gap: 48px;
      border-top: 1px solid #E0D8CC;
      padding-top: 32px;
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
      font-size: 16px;
      font-weight: 500;
      color: #2C1810;
    }

    .page {
      padding: 60px 80px;
      page-break-after: always;
    }

    .page:last-child {
      page-break-after: avoid;
    }

    .section-label {
      font-size: 10px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #A0896E;
      margin-bottom: 8px;
    }

    h2 {
      font-size: 28px;
      font-weight: 700;
      color: #2C1810;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #E0D8CC;
    }

    h3 {
      font-size: 16px;
      font-weight: 500;
      color: #2C1810;
      margin-bottom: 8px;
      margin-top: 24px;
    }

    p {
      color: #6B5440;
      margin-bottom: 12px;
    }

    .card {
      background: #F5F0E8;
      border: 1px solid #E0D8CC;
      border-radius: 8px;
      padding: 20px 24px;
      margin-bottom: 16px;
    }

    .card-title {
      font-size: 14px;
      font-weight: 500;
      color: #2C1810;
      margin-bottom: 8px;
    }

    .card-desc {
      font-size: 13px;
      color: #6B5440;
      margin-bottom: 12px;
    }

    .chip {
      display: inline-block;
      background: #fff;
      border: 1px solid #E0D8CC;
      border-radius: 4px;
      padding: 2px 10px;
      font-size: 11px;
      color: #6B5440;
      margin-right: 6px;
      margin-bottom: 4px;
    }

    .stack-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 24px;
    }

    .stack-item {
      background: #F5F0E8;
      border: 1px solid #E0D8CC;
      border-radius: 6px;
      padding: 12px 16px;
    }

    .stack-item label {
      font-size: 10px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #A0896E;
      display: block;
      margin-bottom: 4px;
    }

    .stack-item span {
      font-size: 13px;
      font-weight: 500;
      color: #2C1810;
    }

    .value-box {
      background: #7A4A3A;
      color: #F5F0E8;
      border-radius: 8px;
      padding: 32px 40px;
      margin: 32px 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .value-label {
      font-size: 12px;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      opacity: 0.7;
      margin-bottom: 4px;
    }

    .value-amount {
      font-size: 36px;
      font-weight: 700;
    }

    .value-hours {
      text-align: right;
      opacity: 0.8;
    }

    .timeline {
      border-left: 2px solid #E0D8CC;
      padding-left: 24px;
      margin: 16px 0;
    }

    .timeline-item {
      margin-bottom: 20px;
      position: relative;
    }

    .timeline-item::before {
      content: '';
      width: 10px;
      height: 10px;
      background: #7A4A3A;
      border-radius: 50%;
      position: absolute;
      left: -30px;
      top: 4px;
    }

    .timeline-fase {
      font-size: 11px;
      color: #A0896E;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }

    .timeline-desc {
      font-size: 13px;
      color: #2C1810;
      font-weight: 500;
    }

    .footer {
      margin-top: 48px;
      padding-top: 24px;
      border-top: 1px solid #E0D8CC;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #C9BFB0;
    }
  </style>
</head>
<body>

  <!-- CAPA -->
  <div class="cover">
    <div class="cover-label">Proposta de Desenvolvimento</div>
    <div class="cover-title">${project.nome}</div>
    <div class="cover-client">${project.cliente || 'Cliente'}</div>
    <div class="cover-meta">
      <div class="cover-meta-item">
        <label>Tipo de Sistema</label>
        <span>${project.tipo || '—'}</span>
      </div>
      <div class="cover-meta-item">
        <label>Complexidade</label>
        <span>${project.complexidade || '—'}</span>
      </div>
      <div class="cover-meta-item">
        <label>Estimativa</label>
        <span>${estimativaHoras}h</span>
      </div>
      <div class="cover-meta-item">
        <label>Data</label>
        <span>${new Date().toLocaleDateString('pt-BR')}</span>
      </div>
    </div>
    <div style="margin-top: 48px; font-size: 12px; color: #A0896E;">
      Rodrigo Carvalho Mamede — Diggo Dev
    </div>
  </div>

  <!-- VISÃO GERAL -->
  <div class="page">
    <div class="section-label">01 — Visão Geral</div>
    <h2>Sobre o Projeto</h2>
    <p>${fase1.problema || project.descricao || 'Descrição do projeto.'}</p>
    ${fase1.publicoAlvo ? `<h3>Público-alvo</h3><p>${fase1.publicoAlvo}</p>` : ''}
    ${funcionalidades.length > 0 ? `
      <h3>Funcionalidades Principais</h3>
      <div style="margin-top: 8px;">
        ${funcionalidades.map(f => `<div class="chip">${f}</div>`).join('')}
      </div>
    ` : ''}
  </div>

  <!-- MÓDULOS -->
  ${modulos.length > 0 ? `
  <div class="page">
    <div class="section-label">02 — Escopo</div>
    <h2>Módulos do Sistema</h2>
    ${modulos.map(m => `
      <div class="card">
        <div class="card-title">${m.nome}</div>
        <div class="card-desc">${m.descricao}</div>
        ${(m.funcionalidades || []).map(f => `<span class="chip">${f}</span>`).join('')}
      </div>
    `).join('')}
  </div>
  ` : ''}

  <!-- STACK -->
  <div class="page">
    <div class="section-label">03 — Tecnologia</div>
    <h2>Stack Técnica</h2>
    <div class="stack-grid">
      ${stack.frontend ? `<div class="stack-item"><label>Frontend</label><span>${stack.frontend}</span></div>` : ''}
      ${stack.backend ? `<div class="stack-item"><label>Backend</label><span>${stack.backend}</span></div>` : ''}
      ${stack.banco ? `<div class="stack-item"><label>Banco de Dados</label><span>${stack.banco}</span></div>` : ''}
      ${stack.deploy ? `<div class="stack-item"><label>Deploy</label><span>${stack.deploy}</span></div>` : ''}
    </div>
    <h3>Processo de Desenvolvimento</h3>
    <div class="timeline">
      <div class="timeline-item">
        <div class="timeline-fase">Fase 1</div>
        <div class="timeline-desc">Levantamento de requisitos e briefing</div>
      </div>
      <div class="timeline-item">
        <div class="timeline-fase">Fase 2</div>
        <div class="timeline-desc">Definição da arquitetura técnica</div>
      </div>
      <div class="timeline-item">
        <div class="timeline-fase">Fase 3</div>
        <div class="timeline-desc">Identidade visual e design de interface</div>
      </div>
      <div class="timeline-item">
        <div class="timeline-fase">Fase 4</div>
        <div class="timeline-desc">Análise e implementação de segurança</div>
      </div>
      <div class="timeline-item">
        <div class="timeline-fase">Fase 5</div>
        <div class="timeline-desc">Desenvolvimento e implementação</div>
      </div>
      <div class="timeline-item">
        <div class="timeline-fase">Fase 6</div>
        <div class="timeline-desc">Testes e validação</div>
      </div>
      <div class="timeline-item">
        <div class="timeline-fase">Fase 7</div>
        <div class="timeline-desc">Deploy e publicação em produção</div>
      </div>
      <div class="timeline-item">
        <div class="timeline-fase">Fase 8</div>
        <div class="timeline-desc">Entrega, treinamento e documentação</div>
      </div>
    </div>
  </div>

  <!-- INVESTIMENTO -->
  <div class="page">
    <div class="section-label">04 — Investimento</div>
    <h2>Valor e Prazo</h2>
    <div class="value-box">
      <div>
        <div class="value-label">Valor Total</div>
        <div class="value-amount">R$ ${valorSugerido.toLocaleString('pt-BR')}</div>
      </div>
      <div class="value-hours">
        <div class="value-label">Estimativa</div>
        <div style="font-size: 24px; font-weight: 600;">${estimativaHoras}h</div>
      </div>
    </div>
    <div class="card">
      <div class="card-title">Condições de Pagamento</div>
      <div class="card-desc">50% na aprovação da proposta · 50% na entrega</div>
    </div>
    <div class="card">
      <div class="card-title">O que está incluído</div>
      <div style="margin-top: 8px;">
        <div class="chip">Desenvolvimento completo</div>
        <div class="chip">Deploy em produção</div>
        <div class="chip">Documentação</div>
        <div class="chip">Suporte pós-entrega (30 dias)</div>
      </div>
    </div>
    ${proximosPassos.length > 0 ? `
      <h3>Evoluções Futuras (não inclusas)</h3>
      ${proximosPassos.map(p => `<div class="chip">${p}</div>`).join('')}
    ` : ''}
    <div class="footer">
      <span>Rodrigo Carvalho Mamede — Diggo Dev</span>
      <span>Proposta válida por 15 dias · ${new Date().toLocaleDateString('pt-BR')}</span>
    </div>
  </div>

</body>
</html>
  `;

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
