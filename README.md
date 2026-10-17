# Balsas Experience API

API REST de experiências turísticas em Balsas-MA (Programação para Web, UNIBALSAS, Aulas 07 e 08).
Os dados ficam em um banco **PostgreSQL on-line (Neon)**, acessado pelo **Prisma 7.10.0**.

## Tecnologias

- Node.js 22+ (ES Modules)
- Express 5
- Prisma 7.10.0 (`prisma`, `@prisma/client`, `@prisma/adapter-pg`) com o driver `pg`
- PostgreSQL no Neon
- `cors`, para consumo pela página da Aula 06
- Publicação no Render

## Modelo de dados

| Modelo | Campos | Relações |
|---|---|---|
| `Categoria` | `id`, `nome` (único) | tem muitas `Atracao` |
| `Tag` | `id`, `nome` (único) | N:N com `Atracao` (tabela `_AtracaoToTag`) |
| `Atracao` | `id`, `nome`, `descricao`, `cidade` (padrão Balsas), `estado` (padrão MA), `distanciaCentroKm` (opcional), `criadaEm`, `categoriaId` | pertence a uma `Categoria`; tem muitas `Tag` e `Avaliacao` |
| `Avaliacao` | `id`, `visitante`, `nota` (1 a 5), `comentario` (opcional), `criadaEm`, `atracaoId` | pertence a uma `Atracao` (`onDelete: Cascade`) |

O schema completo está em `prisma/schema.prisma`; a URL do banco é lida em `prisma7.config.ts`.

## Como executar localmente

1. Crie um banco gratuito em https://neon.com e copie a *connection string*.
2. Copie `.env.example` para `.env` e cole a string em `DATABASE_URL`.
3. Instale, crie as tabelas e carregue os dados:

```bash
npm install
npx prisma migrate dev     # aplica as migrações de prisma/migrations
npx prisma generate        # gera o cliente (na versão 7 o migrate não gera sozinho)
npm run seed               # APAGA tudo e carrega 8 atrações, 3 categorias, 15 tags, 3 avaliações
npm run dev                # http://localhost:3000
```

O `seed` começa apagando as tabelas: use só em banco novo ou de teste.

## Migrações

- Desenvolvimento: `npx prisma migrate dev --name descricao-da-mudanca` cria uma migração nova em `prisma/migrations`.
- Produção: `npx prisma migrate deploy` só aplica as migrações que já existem, sem apagar nada (é o que o `npm run build` faz no Render).
- A pasta `prisma/migrations` é versionada no Git.

## Endpoints

| Método | Caminho | Descrição | Sucesso |
|---|---|---|---|
| GET | `/` | Identificação da API | 200 |
| GET | `/health` | Aplicação e banco de pé | 200 (503 se o banco cair) |
| GET | `/atracoes` | Lista, com categoria e tags | 200 |
| GET | `/atracoes?categoria=&tag=&q=` | Filtros no banco, sem diferenciar maiúsculas | 200 |
| GET | `/atracoes?cidade=&ate=60` | Cidade; até N km (ignora distância desconhecida) | 200 |
| GET | `/atracoes?ordem=nome\|distancia` | Ordenação | 200 |
| GET | `/atracoes?pagina=1&tamanho=3` | Paginação (máximo 50) | 200 |
| GET | `/atracoes/:id` | Uma atração com avaliações, `notaMedia` e `totalAvaliacoes` | 200 / 404 |
| POST | `/atracoes` | Cria | 201 + `Location` / 400 |
| PUT | `/atracoes/:id` | Substitui inteira, inclusive as tags | 200 / 400 / 404 |
| PATCH | `/atracoes/:id` | Altera só os campos enviados | 200 / 400 / 404 |
| DELETE | `/atracoes/:id` | Remove, com as avaliações | 204 / 404 |
| POST | `/atracoes/:id/avaliacoes` | Avalia (nota inteira de 1 a 5) | 201 / 400 / 404 |
| DELETE | `/atracoes/:id/avaliacoes/:avaliacaoId` | Remove uma avaliação | 204 / 404 |
| GET | `/categorias` | Categorias com a contagem de atrações | 200 |
| GET | `/tags` | Tags com a contagem de atrações | 200 |

## Exemplo

```http
POST /atracoes
Content-Type: application/json

{
  "nome": "Parque de Lazer",
  "descricao": "Espaço destinado ao lazer e à convivência.",
  "categoria": "Lazer",
  "distanciaCentroKm": 3,
  "tags": ["lazer", "família", "parque"]
}
```

Resposta `201 Created`, com `Location: /atracoes/<id>` e a atração com `categoria` e `tags` resolvidas.
Obrigatórios: `nome`, `descricao`, `categoria`. Padrões: cidade Balsas, estado MA, distância `null`, tags `[]`.
`cidade` e `estado` podem vir soltos ou dentro de `localizacao`.

## Testes

Abra `requisicoes.http` com a extensão **REST Client** do VS Code, rode `npm run seed` e envie os 15 testes na ordem.

## Publicação (Render)

| Campo | Valor |
|---|---|
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |
| Variável de ambiente | `DATABASE_URL`, com a string do Neon |
