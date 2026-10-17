import { pool } from '../db/conexao.js';
import { montarListagem, ErroDeFiltro } from '../utils/filtros.js';
import { validarCompleto, validarParcial } from '../utils/validacao.js';

// No Express 5, um erro lançado dentro de uma função async vai sozinho
// para o middleware de erro do app.js. Não precisa de try/catch em cada rota.

// O banco guarda em snake_case e colunas separadas; a API devolve no formato do JSON original
function paraApi(linha) {
  return {
    id: linha.id,
    nome: linha.nome,
    categoria: linha.categoria,
    descricao: linha.descricao,
    localizacao: { cidade: linha.cidade, estado: linha.estado },
    distanciaCentroKm: linha.distancia_centro_km,
    tags: linha.tags,
  };
}

// '7' vira 7; 'abc' ou '1.5' viram null (e a rota responde 404)
function lerId(req) {
  const id = Number(req.params.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function existe(id) {
  const { rowCount } = await pool.query('SELECT 1 FROM atracoes WHERE id = $1', [id]);
  return rowCount > 0;
}

const naoEncontrada = (res) => res.status(404).json({ erro: 'Atração não encontrada' });

// GET /atracoes  (filtros: categoria, tag, cidade, ate, ordem, pagina, tamanho)
export async function listar(req, res) {
  let consulta;
  try {
    consulta = montarListagem(req.query);
  } catch (erro) {
    if (erro instanceof ErroDeFiltro) {
      return res.status(400).json({ erro: erro.message });
    }
    throw erro;
  }
  const { rows } = await pool.query(consulta.sql, consulta.valores);
  res.json(rows.map(paraApi));
}

// GET /atracoes/:id
export async function buscarPorId(req, res) {
  const id = lerId(req);
  if (!id) return naoEncontrada(res);

  const { rows } = await pool.query('SELECT * FROM atracoes WHERE id = $1', [id]);
  if (rows.length === 0) return naoEncontrada(res);

  res.json(paraApi(rows[0]));
}

// POST /atracoes
export async function criar(req, res) {
  const corpo = req.body ?? {};
  const problema = validarCompleto(corpo);
  if (problema) return res.status(400).json({ erro: problema });

  const { nome, categoria, descricao, localizacao, distanciaCentroKm, tags } = corpo;

  // O id vem do SERIAL do banco: nunca se repete, mesmo depois de remoções
  const { rows } = await pool.query(
    `INSERT INTO atracoes (nome, categoria, descricao, cidade, estado, distancia_centro_km, tags)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      nome,
      categoria,
      descricao,
      localizacao?.cidade ?? 'Balsas',
      localizacao?.estado ?? 'MA',
      distanciaCentroKm ?? null,
      tags ?? [],
    ]
  );

  const nova = paraApi(rows[0]);
  res.status(201).location(`/atracoes/${nova.id}`).json(nova);
}

// PUT /atracoes/:id  (substitui o recurso inteiro)
export async function atualizar(req, res) {
  const id = lerId(req);
  if (!id || !(await existe(id))) return naoEncontrada(res);

  const corpo = req.body ?? {};
  const problema = validarCompleto(corpo);
  if (problema) return res.status(400).json({ erro: problema });

  const { nome, categoria, descricao, localizacao, distanciaCentroKm, tags } = corpo;

  const { rows } = await pool.query(
    `UPDATE atracoes
        SET nome = $1, categoria = $2, descricao = $3, cidade = $4, estado = $5,
            distancia_centro_km = $6, tags = $7
      WHERE id = $8
      RETURNING *`,
    [
      nome,
      categoria,
      descricao,
      localizacao?.cidade ?? 'Balsas',
      localizacao?.estado ?? 'MA',
      distanciaCentroKm ?? null,
      tags ?? [],
      id,
    ]
  );

  res.json(paraApi(rows[0]));
}

// PATCH /atracoes/:id  (altera só os campos enviados)
export async function alterarParcial(req, res) {
  const id = lerId(req);
  if (!id || !(await existe(id))) return naoEncontrada(res);

  const corpo = req.body ?? {};
  const problema = validarParcial(corpo);
  if (problema) return res.status(400).json({ erro: problema });

  // Campo da API -> coluna do banco
  const alteracoes = [];
  const valores = [];
  const definir = (coluna, valor) => {
    valores.push(valor);
    alteracoes.push(`${coluna} = $${valores.length}`);
  };

  if (corpo.nome !== undefined) definir('nome', corpo.nome);
  if (corpo.categoria !== undefined) definir('categoria', corpo.categoria);
  if (corpo.descricao !== undefined) definir('descricao', corpo.descricao);
  if (corpo.localizacao?.cidade !== undefined) definir('cidade', corpo.localizacao.cidade);
  if (corpo.localizacao?.estado !== undefined) definir('estado', corpo.localizacao.estado);
  if (corpo.distanciaCentroKm !== undefined) definir('distancia_centro_km', corpo.distanciaCentroKm);
  if (corpo.tags !== undefined) definir('tags', corpo.tags);

  if (alteracoes.length === 0) {
    return res.status(400).json({ erro: 'Envie ao menos um campo para alterar' });
  }

  valores.push(id);
  const { rows } = await pool.query(
    `UPDATE atracoes SET ${alteracoes.join(', ')} WHERE id = $${valores.length} RETURNING *`,
    valores
  );

  res.json(paraApi(rows[0]));
}

// DELETE /atracoes/:id
export async function remover(req, res) {
  const id = lerId(req);
  if (!id) return naoEncontrada(res);

  const { rowCount } = await pool.query('DELETE FROM atracoes WHERE id = $1', [id]);
  if (rowCount === 0) return naoEncontrada(res);

  res.status(204).end();
}

// GET /categorias  (sem repetição)
export async function listarCategorias(req, res) {
  const { rows } = await pool.query('SELECT DISTINCT categoria FROM atracoes ORDER BY categoria');
  res.json(rows.map((linha) => linha.categoria));
}
