-- Estrutura da tabela de atrações (PostgreSQL)
DROP TABLE IF EXISTS atracoes;

CREATE TABLE atracoes (
  id                   SERIAL       PRIMARY KEY,
  nome                 VARCHAR(150) NOT NULL,
  categoria            VARCHAR(80)  NOT NULL,
  descricao            TEXT         NOT NULL,
  cidade               VARCHAR(80)  NOT NULL DEFAULT 'Balsas',
  estado               CHAR(2)      NOT NULL DEFAULT 'MA',
  distancia_centro_km  REAL,
  tags                 TEXT[]       NOT NULL DEFAULT '{}'
);
