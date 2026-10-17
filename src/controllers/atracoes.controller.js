import { prisma } from '../prisma.js';
import { montarConsulta, ErroDeFiltro } from '../utils/filtros.js';
import { validarCompleto, validarParcial, lerLocal } from '../utils/validacao.js';

// No Express 5, um erro lançado dentro de uma função async vai sozinho
// para o middleware de erro do app.js.

// Toda resposta de atração vem com a categoria e as tags já resolvidas (JOIN)
const COM_RELACOES = {
  categoria: true,
  tags: { orderBy: { nome: 'asc' } },
};

// "Procure pelo nome único; se achar, ligue; se não achar, crie e ligue"
const ligarCategoria = (nome) => ({
  connectOrCreate: { where: { nome }, create: { nome } },
});
const ligarTags = (tags) =>
  [...new Set(tags)].map((nome) => ({ where: { nome }, create: { nome } }));

// As rotas de escrita montam o mesmo objeto: ele mora em um lugar só
function dadosDaAtracao(corpo) {
  const { cidade, estado } = lerLocal(corpo);
  return {
    nome: corpo.nome,
    descricao: corpo.descricao,
    cidade: cidade ?? 'Balsas',
    estado: (estado ?? 'MA').toUpperCase(),
    distanciaCentroKm: corpo.distanciaCentroKm ?? null,
    categoria: ligarCategoria(corpo.categoria),
    tags: { connectOrCreate: ligarTags(corpo.tags ?? []) },
  };
}

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

// POST /atracoes
export async function criar(req, res) {
  const corpo = req.body ?? {};
  const problema = validarCompleto(corpo);
  if (problema) return res.status(400).json({ erro: problema });

  // O id vem do banco: nunca se repete, nem depois de remoções
  const nova = await prisma.atracao.create({
    data: dadosDaAtracao(corpo),
    include: COM_RELACOES,
  });

  res.status(201).location(`/atracoes/${nova.id}`).json(nova);
}

// PUT /atracoes/:id  (substitui o recurso inteiro, inclusive as tags)
export async function atualizar(req, res) {
  const id = lerId(req.params.id);
  if (!id) return naoEncontrada(res);

  const corpo = req.body ?? {};
  const problema = validarCompleto(corpo);
  if (problema) return res.status(400).json({ erro: problema });

  const dados = dadosDaAtracao(corpo);

  try {
    const atualizada = await prisma.atracao.update({
      where: { id },
      // set: [] desliga todas as tags atuais antes de ligar as novas
      data: { ...dados, tags: { set: [], connectOrCreate: dados.tags.connectOrCreate } },
      include: COM_RELACOES,
    });
    res.json(atualizada);
  } catch (erro) {
    if (erro.code === 'P2025') return naoEncontrada(res);
    throw erro;
  }
}

// PATCH /atracoes/:id  (altera só os campos enviados)
export async function alterarParcial(req, res) {
  const id = lerId(req.params.id);
  if (!id) return naoEncontrada(res);

  const corpo = req.body ?? {};
  const problema = validarParcial(corpo);
  if (problema) return res.status(400).json({ erro: problema });

  const { cidade, estado } = lerLocal(corpo);
  const data = {};
  if (corpo.nome !== undefined) data.nome = corpo.nome;
  if (corpo.descricao !== undefined) data.descricao = corpo.descricao;
  if (cidade !== undefined) data.cidade = cidade;
  if (estado !== undefined) data.estado = estado.toUpperCase();
  if (corpo.distanciaCentroKm !== undefined) data.distanciaCentroKm = corpo.distanciaCentroKm;
  if (corpo.categoria !== undefined) data.categoria = ligarCategoria(corpo.categoria);
  if (corpo.tags !== undefined) {
    data.tags = { set: [], connectOrCreate: ligarTags(corpo.tags) };
  }

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ erro: 'Envie ao menos um campo para alterar' });
  }

  try {
    const alterada = await prisma.atracao.update({ where: { id }, data, include: COM_RELACOES });
    res.json(alterada);
  } catch (erro) {
    if (erro.code === 'P2025') return naoEncontrada(res);
    throw erro;
  }
}

// DELETE /atracoes/:id  (as avaliações somem junto: onDelete Cascade)
export async function remover(req, res) {
  const id = lerId(req.params.id);
  if (!id) return naoEncontrada(res);

  try {
    await prisma.atracao.delete({ where: { id } });
    res.status(204).end();
  } catch (erro) {
    if (erro.code === 'P2025') return naoEncontrada(res);
    throw erro;
  }
}
