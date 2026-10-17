// Traduz os query parameters da listagem em um objeto de consulta do Prisma.
// Quem filtra é o banco: aqui só montamos o pedido.

export class ErroDeFiltro extends Error {}

const ORDENACOES = {
  nome: [{ nome: 'asc' }],
  distancia: [{ distanciaCentroKm: { sort: 'asc', nulls: 'last' } }, { nome: 'asc' }],
};

const semDiferenciar = (valor) => ({ equals: valor, mode: 'insensitive' });

function inteiroPositivo(valor, campo) {
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero < 1) {
    throw new ErroDeFiltro(`O parâmetro ${campo} deve ser um número inteiro maior que zero`);
  }
  return numero;
}

export function montarConsulta(query = {}) {
  // ?tag=a&tag=b chega como lista; usamos só o primeiro valor de cada parâmetro
  const primeiro = (valor) => (Array.isArray(valor) ? valor[0] : valor);
  const { categoria, tag, q, cidade, ate, ordem, pagina, tamanho } = Object.fromEntries(
    Object.entries(query).map(([chave, valor]) => [chave, primeiro(valor)])
  );

  // undefined = "não filtre por isso": o Prisma ignora a condição
  const where = {
    categoria: categoria ? { nome: semDiferenciar(categoria) } : undefined,
    tags: tag ? { some: { nome: semDiferenciar(tag) } } : undefined,
    cidade: cidade ? semDiferenciar(cidade) : undefined,
    OR: q
      ? [
          { nome: { contains: q, mode: 'insensitive' } },
          { descricao: { contains: q, mode: 'insensitive' } },
        ]
      : undefined,
  };

  if (ate !== undefined) {
    const limite = Number(ate);
    if (ate === '' || Number.isNaN(limite) || limite < 0) {
      throw new ErroDeFiltro('O parâmetro ate deve ser um número maior ou igual a zero');
    }
    // lte nunca casa com null: atrações sem distância conhecida ficam de fora
    where.distanciaCentroKm = { lte: limite };
  }

  let orderBy = ORDENACOES.nome;
  if (ordem !== undefined) {
    orderBy = ORDENACOES[String(ordem).toLowerCase()];
    if (!orderBy) {
      throw new ErroDeFiltro(`O parâmetro ordem aceita: ${Object.keys(ORDENACOES).join(', ')}`);
    }
  }

  const consulta = { where, orderBy };

  if (pagina !== undefined || tamanho !== undefined) {
    const numPagina = pagina === undefined ? 1 : inteiroPositivo(pagina, 'pagina');
    const numTamanho = tamanho === undefined ? 10 : inteiroPositivo(tamanho, 'tamanho');
    if (numTamanho > 50) {
      throw new ErroDeFiltro('O parâmetro tamanho aceita no máximo 50');
    }
    consulta.skip = (numPagina - 1) * numTamanho; // quantas pular
    consulta.take = numTamanho; // quantas trazer
  }

  return consulta;
}
