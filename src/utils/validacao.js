// Regras de validação do corpo das requisições de escrita.
// Cada função devolve uma mensagem de erro, ou null quando está tudo certo.

const textoPreenchido = (valor) => typeof valor === 'string' && valor.trim() !== '';

// Aceita cidade/estado soltos (formato do roteiro) ou dentro de localizacao (formato da Aula 07)
export function lerLocal(corpo) {
  return {
    cidade: corpo.cidade ?? corpo.localizacao?.cidade,
    estado: corpo.estado ?? corpo.localizacao?.estado,
  };
}

function validarCamposOpcionais(corpo) {
  const { localizacao, distanciaCentroKm, tags } = corpo;
  const { cidade, estado } = lerLocal(corpo);

  if (localizacao !== undefined && (typeof localizacao !== 'object' || localizacao === null || Array.isArray(localizacao))) {
    return 'O campo localizacao deve ser um objeto, como { "cidade": "Balsas", "estado": "MA" }';
  }
  if (cidade !== undefined && !textoPreenchido(cidade)) {
    return 'O campo cidade, quando enviado, deve ser um texto preenchido';
  }
  if (estado !== undefined && !/^[A-Za-z]{2}$/.test(estado)) {
    return 'O campo estado deve ser a sigla com duas letras, como "MA"';
  }
  if (distanciaCentroKm !== undefined && distanciaCentroKm !== null) {
    if (!Number.isInteger(distanciaCentroKm) || distanciaCentroKm < 0) {
      return 'O campo distanciaCentroKm deve ser um número inteiro maior ou igual a zero, ou null';
    }
  }
  if (tags !== undefined && (!Array.isArray(tags) || !tags.every(textoPreenchido))) {
    return 'O campo tags deve ser uma lista de textos';
  }
  return null;
}

// POST e PUT: recurso completo
export function validarCompleto(corpo) {
  const { nome, categoria, descricao } = corpo;
  if (!textoPreenchido(nome) || !textoPreenchido(descricao) || !textoPreenchido(categoria)) {
    return 'Os campos nome, descricao e categoria são obrigatórios';
  }
  return validarCamposOpcionais(corpo);
}

// PATCH: só o que foi enviado, mas o que foi enviado precisa ser válido
export function validarParcial(corpo) {
  for (const campo of ['nome', 'descricao', 'categoria']) {
    if (corpo[campo] !== undefined && !textoPreenchido(corpo[campo])) {
      return `O campo ${campo}, quando enviado, não pode ficar vazio`;
    }
  }
  return validarCamposOpcionais(corpo);
}

// Avaliação: visitante obrigatório, nota inteira de 1 a 5, comentário opcional
export function validarAvaliacao({ visitante, nota, comentario }) {
  if (!textoPreenchido(visitante) || !Number.isInteger(nota) || nota < 1 || nota > 5) {
    return 'Informe o visitante e uma nota inteira de 1 a 5';
  }
  if (comentario !== undefined && comentario !== null && typeof comentario !== 'string') {
    return 'O campo comentario deve ser um texto';
  }
  return null;
}
