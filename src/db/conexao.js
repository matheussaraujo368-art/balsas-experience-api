// Lê o arquivo .env (na sua máquina). No Render, as variáveis vêm do painel.
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL não definida. Crie o arquivo .env a partir do .env.example');
  process.exit(1);
}

// Pool: um conjunto de conexões reaproveitadas entre as requisições
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
});
