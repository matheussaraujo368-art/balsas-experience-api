import { prisma } from '../prisma.js';
import { montarConsulta, ErroDeFiltro } from '../utils/filtros.js';

// No Express 5, um erro lançado dentro de uma função async vai sozinho
// para o middleware de erro do app.js.

// Toda resposta de atração vem com a categoria e as tags já resolvidas (JOIN)
const COM_RELACOES = {
  categoria: true,
  tags: { orderBy: { nome: 'asc' } },
};

// '7' vira 7; 'abc' ou '1.5' viram null (e a rota responde 404)
function lerId(valor) {
  const id = Number(valor);
  return Number.isInteger(id) && id > 0 ? id : null;
}

const naoEncontrada = (res) => res.status(404).json({ erro: 'Atração não encontrada' });

// GET /atracoes  (categoria, tag, q, cidade, ate, ordem, pagina, tamanho)
export async function listar(req, res) {
  let consulta;
  try {
    consulta = montarConsulta(req.query);
  } catch (erro) {
    if (erro instanceof ErroDeFiltro) return res.status(400).json({ erro: erro.message });
    throw erro;
  }

  const atracoes = await prisma.atracao.findMany({ ...consulta, include: COM_RELACOES });
  res.json(atracoes);
}

// GET /atracoes/:id  (com avaliações e nota média)
export async function buscarPorId(req, res) {
  const id = lerId(req.params.id);
  if (!id) return naoEncontrada(res);

  const atracao = await prisma.atracao.findUnique({
    where: { id },
    include: { ...COM_RELACOES, avaliacoes: { orderBy: { criadaEm: 'desc' } } },
  });
  if (!atracao) return naoEncontrada(res);

  // A média e a contagem são calculadas pelo banco (AVG e COUNT)
  const resumo = await prisma.avaliacao.aggregate({
    where: { atracaoId: id },
    _avg: { nota: true },
    _count: true,
  });

  res.json({ ...atracao, notaMedia: resumo._avg.nota, totalAvaliacoes: resumo._count });
}
