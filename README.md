# Facho

Base de conhecimento, biblioteca de referências e gerenciador de projetos pessoal para o desenvolvedor **Rodrigo Carvalho Mamede (Diggo Dev)**.

O Facho é o espaço central de criação e organização: projetos com pipeline de 8 fases, biblioteca de referências por categoria, e exportador de contexto para alimentar conversas com o Claude.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React + Vite + Tailwind CSS → Vercel |
| Backend | Node.js + Express + Prisma ORM → Railway |
| Banco | PostgreSQL (Railway) |
| Auth | JWT (15min) + Refresh Token (7 dias) |

---

## Instalação local

### Pré-requisitos
- Node.js 18+
- PostgreSQL rodando localmente (ou conexão remota)

### Backend

```bash
cd backend
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite .env com sua DATABASE_URL e segredos JWT

# Gere o cliente Prisma e rode as migrations
npx prisma generate
npx prisma migrate dev --name init

# Popule o banco com dados de exemplo
npm run seed

# Inicie o servidor de desenvolvimento
npm run dev
```

O backend sobe em `http://localhost:3000`.

### Frontend

```bash
cd frontend
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite .env se o backend não estiver em localhost:3000

# Inicie o servidor de desenvolvimento
npm run dev
```

O frontend sobe em `http://localhost:5173`.

---

## Variáveis de ambiente

### backend/.env

```env
DATABASE_URL=postgresql://user:password@host:5432/facho
JWT_SECRET=minimo_32_caracteres_aleatorios_aqui
JWT_REFRESH_SECRET=minimo_32_caracteres_aleatorios_diferente
CORS_ORIGIN=http://localhost:5173
PORT=3000
NODE_ENV=development
```

### frontend/.env

```env
VITE_API_URL=http://localhost:3000
```

---

## Credenciais padrão (seed)

```
Email: rodrigomamedecarvalho@gmail.com
Senha: facho2024@admin
```

> Altere a senha após o primeiro acesso.

---

## Deploy

### Backend → Railway

1. Crie um novo projeto no [Railway](https://railway.app)
2. Adicione um serviço PostgreSQL e copie a `DATABASE_URL`
3. Conecte o repositório e configure o serviço com:
   - **Root directory:** `backend`
   - **Start command:** `node src/app.js`
   - **Build command:** `npm install && npx prisma generate`
4. Adicione todas as variáveis de ambiente do `.env.example`
5. Após o primeiro deploy: `npx prisma migrate deploy`

### Frontend → Vercel

1. Importe o repositório na [Vercel](https://vercel.com)
2. Configure:
   - **Root directory:** `frontend`
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
3. Adicione a variável `VITE_API_URL` apontando para a URL do Railway

---

## Pipeline de 8 fases

| # | Fase | Descrição |
|---|------|-----------|
| 1 | Briefing | Levantamento de requisitos |
| 2 | Referências | Coleta de inspirações e referências |
| 3 | Identidade | Paleta, tipografia e identidade visual |
| 4 | Wireframe | Estrutura e fluxos das telas |
| 5 | Design | Design final das interfaces |
| 6 | Código | Implementação |
| 7 | Testes | Testes manuais e automatizados |
| 8 | Deploy | Publicação em produção |

---

## Créditos

Desenvolvido por **Rodrigo Carvalho Mamede** — [Diggo Dev](https://github.com/diggodev)
