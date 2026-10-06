// Camada de acesso ao banco de dados (Postgres) -- substitui o armazenamento
// em arquivo local, para que contas e historico sobrevivam a reinicios do
// servidor em hospedagens sem disco persistente (ex.: plano gratuito da Render).

const { Pool } = require("pg");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("\nAVISO: variavel de ambiente DATABASE_URL nao definida -- contas e historico nao serao salvos.\n");
}

const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: connectionString.includes("localhost") ? false : { rejectUnauthorized: false },
    })
  : null;

function requireDb() {
  if (!pool) {
    throw new Error("DATABASE_URL nao configurada neste servidor. O administrador do site precisa definir essa variavel de ambiente.");
  }
}

async function ensureSchema() {
  if (!pool) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS corrections (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      data TIMESTAMPTZ NOT NULL DEFAULT now(),
      origem TEXT NOT NULL DEFAULT 'corrigir',
      tema TEXT,
      texto TEXT NOT NULL,
      nota_total INTEGER,
      competencias JSONB,
      analise_paragrafos JSONB,
      veredito TEXT,
      marcacoes JSONB
    );
  `);
  // Tokens do app de celular (Roteiro ENEM 30). Guarda so o hash do token.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_tokens (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

async function createAppToken(tokenHash, userId) {
  requireDb();
  await pool.query("INSERT INTO app_tokens (token_hash, user_id) VALUES ($1, $2)", [tokenHash, userId]);
}

async function getUserByAppToken(tokenHash) {
  requireDb();
  const { rows } = await pool.query(
    "SELECT u.id, u.username FROM app_tokens t JOIN users u ON u.id = t.user_id WHERE t.token_hash = $1",
    [tokenHash]
  );
  return rows[0] || null;
}

async function deleteAppToken(tokenHash) {
  requireDb();
  await pool.query("DELETE FROM app_tokens WHERE token_hash = $1", [tokenHash]);
}

async function getUserByUsername(username) {
  requireDb();
  const { rows } = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
  return rows[0] || null;
}

async function createUser({ id, username, passwordHash }) {
  requireDb();
  await pool.query("INSERT INTO users (id, username, password_hash) VALUES ($1, $2, $3)", [id, username, passwordHash]);
}

function mapCorrectionRow(row) {
  return {
    id: row.id,
    userId: row.user_id,
    data: row.data.toISOString(),
    origem: row.origem,
    tema: row.tema,
    texto: row.texto,
    notaTotal: row.nota_total,
    competencias: row.competencias || [],
    analiseParagrafos: row.analise_paragrafos || [],
    veredito: row.veredito || "",
    marcacoes: row.marcacoes || [],
  };
}

async function insertCorrection(registro) {
  requireDb();
  await pool.query(
    `INSERT INTO corrections
      (id, user_id, data, origem, tema, texto, nota_total, competencias, analise_paragrafos, veredito, marcacoes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
    [
      registro.id,
      registro.userId,
      registro.data,
      registro.origem,
      registro.tema,
      registro.texto,
      registro.notaTotal,
      JSON.stringify(registro.competencias || []),
      JSON.stringify(registro.analiseParagrafos || []),
      registro.veredito || "",
      JSON.stringify(registro.marcacoes || []),
    ]
  );
}

async function getHistoryForUser(userId) {
  requireDb();
  const { rows } = await pool.query("SELECT * FROM corrections WHERE user_id = $1 ORDER BY data ASC", [userId]);
  return rows.map(mapCorrectionRow);
}

async function getCorrectionById(id, userId) {
  requireDb();
  const { rows } = await pool.query("SELECT * FROM corrections WHERE id = $1 AND user_id = $2", [id, userId]);
  return rows[0] ? mapCorrectionRow(rows[0]) : null;
}

async function deleteCorrectionById(id, userId) {
  requireDb();
  const { rowCount } = await pool.query("DELETE FROM corrections WHERE id = $1 AND user_id = $2", [id, userId]);
  return rowCount > 0;
}

module.exports = {
  ensureSchema,
  getUserByUsername,
  createUser,
  insertCorrection,
  getHistoryForUser,
  getCorrectionById,
  deleteCorrectionById,
  createAppToken,
  getUserByAppToken,
  deleteAppToken,
};
