import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

function resolveAdminPassword() {
  const fromEnv = process.env.ADMIN_SEED_PASSWORD;
  if (fromEnv && fromEnv.trim().length >= 12) return fromEnv.trim();

  if (process.env.NODE_ENV === 'production') {
    console.error('');
    console.error('ERRO: ADMIN_SEED_PASSWORD não definida em produção.');
    console.error('Defina a variável no Railway antes de executar o seed.');
    console.error('');
    process.exit(1);
  }

  const generated = randomBytes(18).toString('base64url');
  console.warn('');
  console.warn('⚠  ADMIN_SEED_PASSWORD não definido.');
  console.warn(`   Senha gerada para desenvolvimento: ${generated}`);
  console.warn('   Em produção, defina ADMIN_SEED_PASSWORD antes de rodar o seed.');
  console.warn('');
  return generated;
}

const PHASES = [
  { numero: 1, nome: 'Briefing' },
  { numero: 2, nome: 'Referências' },
  { numero: 3, nome: 'Identidade' },
  { numero: 4, nome: 'Wireframe' },
  { numero: 5, nome: 'Design' },
  { numero: 6, nome: 'Código' },
  { numero: 7, nome: 'Testes' },
  { numero: 8, nome: 'Deploy' },
];

async function main() {
  const password = resolveAdminPassword();
  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email: 'rodrigomamedecarvalho@gmail.com' },
    update: {},
    create: {
      email: 'rodrigomamedecarvalho@gmail.com',
      password: hashedPassword,
      name: 'Rodrigo Carvalho Mamede',
    },
  });

  // Projeto RM Modas — fases 1-3 concluídas, fase 4 ativa
  const rmModas = await prisma.project.create({
    data: {
      userId: user.id,
      nome: 'RM Modas',
      tipo: 'CRM',
      complexidade: 'alta',
      cliente: 'Família Mamede',
      descricao: 'Sistema CRM completo para gerenciamento de clientes, vendas e estoque da RM Modas.',
      icone: 'ti-hanger',
      status: 'andamento',
      currentPhase: 4,
    },
  });

  for (const ph of PHASES) {
    await prisma.phase.create({
      data: {
        projectId: rmModas.id,
        numero: ph.numero,
        nome: ph.nome,
        status: ph.numero <= 3 ? 'concluida' : ph.numero === 4 ? 'ativa' : 'pendente',
        notas: ph.numero === 4 ? 'Estruturando wireframes das telas de cliente e vendas.' : null,
        paleta: ph.numero === 3 ? {
          cores: [
            { hex: '#7A4A3A', label: 'Terracota' },
            { hex: '#C17A3A', label: 'Caramelo' },
            { hex: '#F5F0E8', label: 'Creme' },
            { hex: '#2C1810', label: 'Escuro' },
          ]
        } : null,
        tipografia: ph.numero === 3 ? {
          fonte: 'DM Sans',
          pesos: ['400', '500', '700'],
          url: 'https://fonts.google.com/specimen/DM+Sans',
        } : null,
      },
    });
  }

  // Projeto Eloana Velluto — todas as 8 fases concluídas
  const eloana = await prisma.project.create({
    data: {
      userId: user.id,
      nome: 'Eloana Velluto',
      tipo: 'Estoque',
      complexidade: 'média',
      cliente: 'Natalina',
      descricao: 'Sistema de controle de estoque e pedidos para loja de tecidos Eloana Velluto.',
      icone: 'ti-shopping-bag',
      status: 'concluido',
      currentPhase: 8,
    },
  });

  for (const ph of PHASES) {
    await prisma.phase.create({
      data: {
        projectId: eloana.id,
        numero: ph.numero,
        nome: ph.nome,
        status: 'concluida',
        notas: `Fase ${ph.numero} concluída com sucesso.`,
      },
    });
  }

  // Projeto Feira Certa — fases 1-2 concluídas, fase 3 ativa
  const feiraCerta = await prisma.project.create({
    data: {
      userId: user.id,
      nome: 'Feira Certa',
      tipo: 'Inventário',
      complexidade: 'baixa',
      cliente: 'Pessoal',
      descricao: 'App pessoal para organizar lista de compras e controlar inventário da despensa.',
      icone: 'ti-basket',
      status: 'andamento',
      currentPhase: 3,
    },
  });

  for (const ph of PHASES) {
    await prisma.phase.create({
      data: {
        projectId: feiraCerta.id,
        numero: ph.numero,
        nome: ph.nome,
        status: ph.numero <= 2 ? 'concluida' : ph.numero === 3 ? 'ativa' : 'pendente',
        notas: ph.numero === 3 ? 'Definindo paleta de cores e tipografia do app.' : null,
      },
    });
  }

  // Referências — Design
  const refDesign = [
    { nome: 'Color Hunt', link: 'https://colorhunt.co', categoria: 'design', subcategoria: 'paletas', anotacoes: 'Paletas de cores curadas para projetos.' },
    { nome: 'Haikei', link: 'https://haikei.app', categoria: 'design', subcategoria: 'backgrounds', anotacoes: 'Gerador de backgrounds SVG e blobs.' },
    { nome: 'DM Sans', link: 'https://fonts.google.com/specimen/DM+Sans', categoria: 'design', subcategoria: 'tipografia', anotacoes: 'Fonte sans-serif humanista, usada no Facho.' },
    { nome: 'Soilboy', link: 'https://soilboy.com', categoria: 'design', subcategoria: 'inspiração', anotacoes: 'Portfólio com design orgânico e texturas terrosas.' },
    { nome: 'SVG Repo', link: 'https://svgrepo.com', categoria: 'design', subcategoria: 'ícones', anotacoes: 'Repositório de SVGs e ícones gratuitos.' },
    { nome: 'CSS Buttons', link: 'https://cssbuttons.io', categoria: 'design', subcategoria: 'componentes', anotacoes: 'Coleção de botões CSS prontos para usar.' },
    { nome: 'Animista', link: 'https://animista.net', categoria: 'design', subcategoria: 'animações', anotacoes: 'Gerador de animações CSS com preview ao vivo.' },
  ];

  for (const ref of refDesign) {
    await prisma.reference.create({ data: { userId: user.id, ...ref } });
  }

  // Referências — Segurança
  const refSeguranca = [
    { nome: 'OWASP Top 10', link: 'https://owasp.org/www-project-top-ten/', categoria: 'seguranca', subcategoria: 'vulnerabilidades', anotacoes: 'As 10 principais vulnerabilidades de segurança web.' },
    { nome: 'Checklist JWT', link: 'https://jwt.io/introduction', categoria: 'seguranca', subcategoria: 'autenticação', anotacoes: 'Boas práticas para implementação de JWT.' },
    { nome: 'Checklist CORS', link: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS', categoria: 'seguranca', subcategoria: 'headers', anotacoes: 'Configuração segura de CORS para APIs.' },
  ];

  for (const ref of refSeguranca) {
    await prisma.reference.create({ data: { userId: user.id, ...ref } });
  }

  // Referências — Infraestrutura
  const refInfra = [
    { nome: 'Railway Deploy', link: 'https://railway.app/docs', categoria: 'infraestrutura', subcategoria: 'deploy', anotacoes: 'Deploy de backends Node.js e PostgreSQL no Railway.' },
    { nome: 'Vercel Deploy', link: 'https://vercel.com/docs', categoria: 'infraestrutura', subcategoria: 'deploy', anotacoes: 'Deploy de frontends React/Vite na Vercel.' },
  ];

  for (const ref of refInfra) {
    await prisma.reference.create({ data: { userId: user.id, ...ref } });
  }

  // Referências — Código
  const refCodigo = [
    { nome: 'Estrutura Node.js + Express', link: null, categoria: 'codigo', subcategoria: 'arquitetura', anotacoes: 'src/routes, src/middleware, src/services, prisma/. Entry point: src/app.js.' },
    { nome: 'Estrutura React + Vite', link: null, categoria: 'codigo', subcategoria: 'arquitetura', anotacoes: 'src/components, src/pages, src/services, src/hooks. Entry: main.jsx.' },
  ];

  for (const ref of refCodigo) {
    await prisma.reference.create({ data: { userId: user.id, ...ref } });
  }

  // Referências — Prompts
  const refPrompts = [
    { nome: 'Prompt de estrutura inicial', link: null, categoria: 'prompts', subcategoria: 'início', anotacoes: 'Descreva o projeto, stack, estrutura de pastas esperada e objetivo principal. Peça para criar todos os arquivos base com imports corretos.' },
    { nome: 'Prompt de autenticação', link: null, categoria: 'prompts', subcategoria: 'auth', anotacoes: 'JWT + Refresh Token. Peça: login, refresh, logout, middleware de proteção de rotas, bloqueio de brute force.' },
  ];

  for (const ref of refPrompts) {
    await prisma.reference.create({ data: { userId: user.id, ...ref } });
  }

  // Templates padrão
  const templatesDefault = [
    {
      id: 'loja-moda_default',
      nome: 'Loja de Moda',
      tipo: 'E-commerce',
      complexidade: 'media',
      descricao: 'Sistema de gestão para loja de moda com caixa, estoque e relatórios.',
      fase2: {
        stack: { frontend: 'React + Vite + Tailwind CSS', backend: 'Node.js + Express + Prisma', banco: 'PostgreSQL (Railway)', deploy: 'Vercel + Railway' },
        modulos: [
          { nome: 'Caixa', descricao: 'Registro de vendas e fechamento do dia', funcionalidades: ['Múltiplas formas de pagamento', 'Troco automático', 'Fechamento do dia'] },
          { nome: 'Estoque', descricao: 'Cadastro e controle de produtos', funcionalidades: ['Upload de foto', 'Alertas de estoque baixo', 'Código de produto'] },
          { nome: 'Relatório', descricao: 'Faturamento e análises', funcionalidades: ['Faturamento por período', 'Breakdown por pagamento', 'Exportação PDF'] },
        ],
      },
      fase4: {
        nivelRisco: 'medio',
        checklist: {
          autenticacao: [{ item: 'JWT implementado', feito: false }, { item: 'Refresh token', feito: false }, { item: 'Senhas hasheadas', feito: false }],
          cors: [{ item: 'CORS restrito', feito: false }, { item: 'Helmet.js', feito: false }],
          banco: [{ item: 'Queries via ORM', feito: false }, { item: 'SSL no banco', feito: false }],
        },
      },
    },
    {
      id: 'crm_default',
      nome: 'Sistema de Gestão (CRM)',
      tipo: 'CRM',
      complexidade: 'media',
      descricao: 'Sistema de gestão de clientes com cadastro, histórico e comunicação.',
      fase2: {
        stack: { frontend: 'React + Vite + Tailwind CSS', backend: 'Node.js + Express + Prisma', banco: 'PostgreSQL (Railway)', deploy: 'Vercel + Railway' },
        modulos: [
          { nome: 'Clientes', descricao: 'Cadastro e gestão de clientes', funcionalidades: ['Cadastro completo', 'Histórico de compras', 'Controle de fiado'] },
          { nome: 'Comunicação', descricao: 'Envio de mensagens', funcionalidades: ['WhatsApp', 'Histórico de contatos'] },
          { nome: 'Relatórios', descricao: 'Análise de clientes', funcionalidades: ['Clientes por período', 'Top compradores'] },
        ],
      },
    },
    {
      id: 'landing-page_default',
      nome: 'Landing Page',
      tipo: 'Landing Page',
      complexidade: 'baixa',
      descricao: 'Site institucional ou de apresentação de produto/serviço.',
      fase2: {
        stack: { frontend: 'Next.js + Tailwind CSS', backend: 'Não necessário', banco: 'Não necessário', deploy: 'Vercel' },
        modulos: [
          { nome: 'Hero', descricao: 'Seção principal com CTA', funcionalidades: ['Headline', 'CTA principal', 'Imagem/vídeo'] },
          { nome: 'Sobre', descricao: 'Apresentação do negócio', funcionalidades: ['Texto', 'Fotos'] },
          { nome: 'Contato', descricao: 'Formulário de contato', funcionalidades: ['WhatsApp', 'E-mail', 'Mapa'] },
        ],
      },
    },
    {
      id: 'financeiro_default',
      nome: 'Sistema Financeiro',
      tipo: 'Financeiro',
      complexidade: 'alta',
      descricao: 'Sistema de controle financeiro com entradas, saídas e relatórios.',
      fase2: {
        stack: { frontend: 'React + Vite + Tailwind CSS', backend: 'Node.js + Express + Prisma', banco: 'PostgreSQL (Railway)', deploy: 'Vercel + Railway' },
        modulos: [
          { nome: 'Entradas', descricao: 'Registro de receitas', funcionalidades: ['Categorias', 'Recorrência', 'Comprovantes'] },
          { nome: 'Saídas', descricao: 'Registro de despesas', funcionalidades: ['Categorias', 'Recorrência', 'Comprovantes'] },
          { nome: 'Dashboard', descricao: 'Visão geral financeira', funcionalidades: ['Saldo atual', 'Gráficos', 'Projeções'] },
          { nome: 'Relatórios', descricao: 'Análises detalhadas', funcionalidades: ['Por período', 'Por categoria', 'Exportação'] },
        ],
      },
    },
  ];

  for (const t of templatesDefault) {
    const { id, ...data } = t;
    await prisma.projectTemplate.upsert({
      where: { id },
      update: {},
      create: { id, userId: user.id, ...data },
    });
  }

  console.log('✓ Seed concluído com sucesso.');
  console.log(`  Usuário: rodrigomamedecarvalho@gmail.com`);
  console.log(`  Projetos: RM Modas, Eloana Velluto, Feira Certa`);
  console.log(`  Referências: ${refDesign.length + refSeguranca.length + refInfra.length + refCodigo.length + refPrompts.length} criadas`);
}

main()
  .catch((e) => {
    console.error('Erro no seed:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
