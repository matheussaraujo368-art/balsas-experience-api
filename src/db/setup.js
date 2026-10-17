// Cria a tabela no banco on-line e carrega as 8 atrações do atracoes.json.
// Rode com: npm run db:setup  (apaga e recria tudo, volta ao estado inicial)
import { readFile } from 'node:fs/promises';
import atracoes from '../data/atracoes.json' with { type: 'json' };
import { pool } from './conexao.js';

const schema = await readFile(new URL('./schema.sql', import.meta.url), 'utf8');

try {
  await pool.query(schema);
  console.log('Tabela atracoes criada');

  for (const a of atracoes) {
    await pool.query(
      `INSERT INTO atracoes (nome, categoria, descricao, cidade, estado, distancia_centro_km, tags)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [a.nome, a.categoria, a.descricao, a.localizacao.cidade, a.localizacao.estado, a.distanciaCentroKm, a.tags]
    );
  }

  const { rows } = await pool.query('SELECT COUNT(*)::int AS total FROM atracoes');
  console.log(`${rows[0].total} atrações carregadas no banco`);
} catch (erro) {
  console.error('Falha ao preparar o banco:', erro.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
