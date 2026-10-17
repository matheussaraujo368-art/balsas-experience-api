import { prisma } from '../prisma.js';

// GET /categorias  (a contagem vem do banco, sem laço em JavaScript)
export async function listarCategorias(req, res) {
  const categorias = await prisma.categoria.findMany({
    include: { _count: { select: { atracoes: true } } },
    orderBy: { nome: 'asc' },
  });

  res.json(categorias.map(({ id, nome, _count }) => ({ id, nome, atracoes: _count.atracoes })));
}

// GET /tags  (mesmo modelo do /categorias)
export async function listarTags(req, res) {
  const tags = await prisma.tag.findMany({
    include: { _count: { select: { atracoes: true } } },
    orderBy: { nome: 'asc' },
  });

  res.json(tags.map(({ id, nome, _count }) => ({ id, nome, atracoes: _count.atracoes })));
}
