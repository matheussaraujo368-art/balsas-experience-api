# Balsas Experience API

API REST de experiências turísticas em Balsas-MA, construída no Laboratório da Aula 07 de
Programação para Web (ADS - Unibalsas). Nesta versão os dados ficam em um banco
**PostgreSQL on-line (Neon)**, e não mais em memória: as alterações sobrevivem ao reinício do servidor.

## Tecnologias

- Node.js 22+ (ES Modules, `--watch` e `--env-file` nativos)
- Express 5
- PostgreSQL no Neon (neon.tech), acessado pelo pacote `pg`
- CORS (`cors`) para consumo pela página da Aula 06
- Publicação no Render (render.com)

## Estrutura

```
balsas-experience-api/
├── src/
│   ├── controllers/atracoes.controller.js   regras e respostas HTTP
│   ├── routes/atracoes.routes.js            método + caminho -> função
│   ├── routes/categorias.routes.js
│   ├── db/conexao.js                        pool de conexões com o banco
│   ├── db/schema.sql                        estrutura da tabela
│   ├── db/setup.js                          cria a tabela e carrega os dados
│   ├── utils/filtros.js                     monta o SELECT dos filtros
│   ├── utils/validacao.js                   valida o corpo das requisições
│   ├── data/atracoes.json                   dados iniciais (carga do banco)
│   └── app.js
├── requisicoes.http                         coleção de testes (REST Client)
├── .env.example
├── .gitignore
└── package.json
```

## Como executar localmente

1. Crie um banco gratuito em https://neon.tech e copie a *connection string*.
2. Copie `.env.example` para `.env` e cole a connection string em `DATABASE_URL`.
3. Instale e prepare o banco:

```bash
npm install
npm run db:setup     # cria a tabela e carrega as 8 atrações
npm run dev          # http://localhost:3000
```

`npm run db:setup` também serve para **zerar** o banco antes de rodar os testes.

## Endpoints

| Método | Caminho | Descrição | Sucesso |
|---|---|---|---|
| GET | `/` | Identificação da API | 200 |
| GET | `/health` | Aplicação e banco de pé? | 200 (503 se o banco cair) |
| GET | `/atracoes` | Lista todas | 200 |
| GET | `/atracoes?categoria=` | Filtra por categoria (sem diferenciar maiúsculas) | 200 |
| GET | `/atracoes?tag=` | Filtra por característica | 200 |
| GET | `/atracoes?cidade=` | Filtra pela cidade da localização | 200 |
| GET | `/atracoes?ate=60` | Até 60 km do centro (ignora distância desconhecida) | 200 |
| GET | `/atracoes?ordem=nome` | Ordena por `nome` ou `distancia` | 200 |
| GET | `/atracoes?pagina=1&tamanho=3` | Paginação (tamanho máximo 50) | 200 |
| GET | `/atracoes/:id` | Busca uma | 200 / 404 |
| POST | `/atracoes` | Cria | 201 + `Location` / 400 |
| PUT | `/atracoes/:id` | Substitui inteira | 200 / 400 / 404 |
| PATCH | `/atracoes/:id` | Altera só os campos enviados | 200 / 400 / 404 |
| DELETE | `/atracoes/:id` | Remove | 204 / 404 |
| GET | `/categorias` | Categorias existentes, sem repetição | 200 |

Os filtros podem ser combinados: `/atracoes?categoria=Natureza%20e%20Aventura&tag=aventura&ordem=nome`.
Busca sem resultado devolve `200` com `[]`; `404` é só para recurso ou rota que não existe.

## Exemplo de requisição

```http
POST /atracoes
Content-Type: application/json

{
  "nome": "Parque de Lazer",
  "categoria": "Lazer",
  "descricao": "Espaço destinado ao lazer e à convivência.",
  "localizacao": { "cidade": "Balsas", "estado": "MA" },
  "distanciaCentroKm": 3,
  "tags": ["lazer", "família"]
}
```

Resposta `201 Created`, cabeçalho `Location: /atracoes/9`, com a atração criada no corpo.

Campos obrigatórios em POST e PUT: `nome`, `categoria`, `descricao`. Sem `localizacao`, vale Balsas-MA;
sem `distanciaCentroKm`, vale `null`; sem `tags`, vale `[]`.

## Banco de dados

Tabela `atracoes`: `id SERIAL`, `nome`, `categoria`, `descricao`, `cidade`, `estado`,
`distancia_centro_km REAL` (aceita NULL) e `tags TEXT[]`. O controller converte cada linha para o
mesmo formato JSON do laboratório (`localizacao: { cidade, estado }`, `distanciaCentroKm`).

O `id` vem do `SERIAL` do PostgreSQL, que nunca reutiliza um número: é a versão de banco do
`proximoId()` do laboratório. Todas as consultas usam parâmetros (`$1`, `$2`...), o que impede SQL injection.

## Testes

Abra `requisicoes.http` com a extensão **REST Client** do VS Code e clique em *Send Request* em cada
bloco, na ordem, logo depois de `npm run db:setup`.

## Publicação (Render)

Web Service ligado ao repositório, ambiente Node, Build `npm install`, Start `npm start`,
e a variável de ambiente `DATABASE_URL` cadastrada em *Environment*. Depois de publicar, rode
`npm run db:setup` uma vez na sua máquina (o banco é o mesmo, então a API publicada já enxerga os dados).
