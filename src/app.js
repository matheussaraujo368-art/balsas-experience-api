import express from 'express';
import cors from 'cors';
import { prisma } from './prisma.js';
import atracoesRoutes from './routes/atracoes.routes.js';
import categoriasRoutes from './routes/categorias.routes.js';
import tagsRoutes from './routes/tags.routes.js';

const app = express();
const PORTA = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    nome: 'Balsas Experience API',
    versao: '2.0.0',
    descricao: 'API de experiências turísticas em Balsas-MA',
  });
});

// Saúde: a aplicação está de pé? E o banco responde?
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok' });
  } catch {
    res.status(503).json({ status: 'erro', banco: 'indisponível' });
  }
});

app.use('/atracoes', atracoesRoutes);
app.use('/categorias', categoriasRoutes);
app.use('/tags', tagsRoutes);

// Qualquer caminho que não casou com as rotas acima
app.use((req, res) => {
  res.status(404).json({ erro: `Rota não encontrada: ${req.method} ${req.originalUrl}` });
});

// Middleware de erro: quatro parâmetros, sempre por último
app.use((erro, req, res, next) => {
  console.error(erro);
  const status = erro.status ?? 500;
  const mensagem = status === 500 ? 'Erro interno no servidor' : 'Corpo da requisição inválido';
  res.status(status).json({ erro: mensagem });
});

app.listen(PORTA, '0.0.0.0', () => {
  console.log(`Servidor executando na porta ${PORTA}`);
});
