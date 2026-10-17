// Carga inicial: APAGA tudo e insere as 8 atrações. Use só em banco novo ou de teste.
import { prisma } from '../src/prisma.js';
import atracoes from '../src/data/atracoes.json' with { type: 'json' };

const avaliacoesDeExemplo = [
  { atracao: 'Cachoeira do Macapá', visitante: 'Ana', nota: 5, comentario: 'Vale cada quilômetro.' },
  { atracao: 'Cachoeira do Macapá', visitante: 'Bruno', nota: 4, comentario: 'Estrada ruim no fim.' },
  { atracao: 'Prainha', visitante: 'Carla', nota: 4, comentario: null },
];

console.log('Limpando as tabelas...');
// Ordem importa: filhos antes dos pais, senão a chave estrangeira recusa
await prisma.avaliacao.deleteMany();
await prisma.atracao.deleteMany();
await prisma.tag.deleteMany();
await prisma.categoria.deleteMany();

console.log('Inserindo as atrações...');
for (const item of atracoes) {
  await prisma.atracao.create({
    data: {
      nome: item.nome,
      descricao: item.descricao,
      cidade: item.localizacao.cidade,
      estado: item.localizacao.estado,
      distanciaCentroKm: item.distanciaCentroKm,
      categoria: {
        connectOrCreate: {
          where: { nome: item.categoria },
          create: { nome: item.categoria },
        },
      },
      tags: {
        connectOrCreate: item.tags.map((tag) => ({
          where: { nome: tag },
          create: { nome: tag },
        })),
      },
    },
  });
}

console.log('Inserindo as avaliações...');
for (const avaliacao of avaliacoesDeExemplo) {
  const atracao = await prisma.atracao.findFirst({ where: { nome: avaliacao.atracao } });
  if (!atracao) {
    console.warn(`Atração "${avaliacao.atracao}" não encontrada no JSON; avaliação ignorada`);
    continue;
  }
  await prisma.avaliacao.create({
    data: {
      visitante: avaliacao.visitante,
      nota: avaliacao.nota,
      comentario: avaliacao.comentario,
      atracaoId: atracao.id,
    },
  });
}

const totais = {
  atracoes: await prisma.atracao.count(),
  categorias: await prisma.categoria.count(),
  tags: await prisma.tag.count(),
  avaliacoes: await prisma.avaliacao.count(),
};

console.log('Pronto:', totais);
await prisma.$disconnect();
