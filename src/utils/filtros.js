// Monta o SELECT da listagem a partir dos query parameters.
// Os valores nunca são colados no texto do SQL: vão em $1, $2... (evita SQL injection).

const ORDENACOES = {
  nome: 'nome ASC',
  distancia: 'distancia_centro_km ASC NULLS LAST, nome ASC',
};

export class ErroDeFiltro extends Error {}

function inteiroPositivo(valor, campo) {
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero < 1) {
    throw new ErroDeFiltro(`O parâmetro ${campo} deve ser um número inteiro maior que zero`);
  }
  return numero;
}

export function montarListagem(query = {}) {
  // ?tag=a&tag=b chega como lista; usamos só o primeiro valor de cada parâmetro
  const primeiro = (valor) => (Array.isArray(valor) ? valor[0] : valor);
  const { categoria, tag, cidade, ate, ordem, pagina, tamanho } = Object.fromEntries(
    Object.entries(query).map(([chave, valor]) => [chave, primeiro(valor)])
  );

  const condicoes = [];
  const valores = [];

  // Cada filtro acrescenta um valor e usa a posição dele ($1, $2...)
  const parametro = (valor) => {
    valores.push(valor);
    return `$${valores.length}`;
  };

  if (categoria) {
    condicoes.push(`LOWER(categoria) = LOWER(${parametro(categoria)})`);
  }

  if (tag) {
    condicoes.push(
      `EXISTS (SELECT 1 FROM unnest(tags) AS t WHERE LOWER(t) = LOWER(${parametro(tag)}))`
    );
  }

  if (cidade) {
    condicoes.push(`LOWER(cidade) = LOWER(${parametro(cidade)})`);
  }

  if (ate !== undefined) {
    const limite = Number(ate);
    if (ate === '' || Number.isNaN(limite) || limite < 0) {
      throw new ErroDeFiltro('O parâmetro ate deve ser um número maior ou igual a zero');
    }
    // distancia_centro_km pode ser NULL: atrações sem distância conhecida ficam de fora
    condicoes.push(`distancia_centro_km IS NOT NULL AND distancia_centro_km <= ${parametro(limite)}`);
  }

  let ordenacao = 'id ASC';
  if (ordem !== undefined) {
    ordenacao = ORDENACOES[String(ordem).toLowerCase()];
    if (!ordenacao) {
      throw new ErroDeFiltro(`O parâmetro ordem aceita: ${Object.keys(ORDENACOES).join(', ')}`);
    }
  }

  let sql = 'SELECT * FROM atracoes';
  if (condicoes.length > 0) {
    sql += ` WHERE ${condicoes.join(' AND ')}`;
  }
  sql += ` ORDER BY ${ordenacao}`;

  if (pagina !== undefined || tamanho !== undefined) {
    const numPagina = pagina === undefined ? 1 : inteiroPositivo(pagina, 'pagina');
    const numTamanho = tamanho === undefined ? 10 : inteiroPositivo(tamanho, 'tamanho');
    if (numTamanho > 50) {
      throw new ErroDeFiltro('O parâmetro tamanho aceita no máximo 50');
    }
    sql += ` LIMIT ${parametro(numTamanho)} OFFSET ${parametro((numPagina - 1) * numTamanho)}`;
  }

  return { sql, valores };
}
