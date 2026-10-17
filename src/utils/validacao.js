// Regras de validação do corpo das requisições de escrita.
// Devolve uma mensagem de erro, ou null quando está tudo certo.

const textoPreenchido = (valor) => typeof valor === 'string' && valor.trim() !== '';

export function validarCamposOpcionais({ localizacao, distanciaCentroKm, tags }) {
  if (localizacao !== undefined && (typeof localizacao !== 'object' || localizacao === null || Array.isArray(localizacao))) {
    return 'O campo localizacao deve ser um objeto, como { "cidade": "Balsas", "estado": "MA" }';
  }
  if (distanciaCentroKm !== undefined && distanciaCentroKm !== null) {
    if (typeof distanciaCentroKm !== 'number' || distanciaCentroKm < 0) {
      return 'O campo distanciaCentroKm deve ser um número maior ou igual a zero, ou null';
    }
  }
  if (tags !== undefined && (!Array.isArray(tags) || !tags.every((t) => typeof t === 'string'))) {
    return 'O campo tags deve ser uma lista de textos';
  }
  return null;
}

// POST e PUT: recurso completo
export function validarCompleto(corpo) {
  const { nome, categoria, descricao } = corpo;
  if (!textoPreenchido(nome) || !textoPreenchido(categoria) || !textoPreenchido(descricao)) {
    return 'Os campos nome, categoria e descricao são obrigatórios';
  }
  return validarCamposOpcionais(corpo);
}

// PATCH: só o que foi enviado, mas o que foi enviado precisa ser válido
export function validarParcial(corpo) {
  for (const campo of ['nome', 'categoria', 'descricao']) {
    if (corpo[campo] !== undefined && !textoPreenchido(corpo[campo])) {
      return `O campo ${campo}, quando enviado, não pode ficar vazio`;
    }
  }
  return validarCamposOpcionais(corpo);
}
