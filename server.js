// Servidor do app de correcao de redacao (metodo Jana Rabelo).
// Hospedavel publicamente: a correcao chama o Claude Code CLI usando um token
// de assinatura de longa duracao (gerado com "claude setup-token", variavel
// CLAUDE_CODE_OAUTH_TOKEN) em vez de uma chave de API paga por token. O acesso
// ao site exige login, com registro protegido por um codigo de convite
// definido pelo dono do site.

const express = require("express");
const session = require("express-session");
const bcrypt = require("bcryptjs");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 4321;
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "corrections.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const SKILL_DIR = path.join(__dirname, "skill");

const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL || "sonnet";
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex");
const REGISTRATION_CODE = process.env.REGISTRATION_CODE || "";

if (!process.env.CLAUDE_CODE_OAUTH_TOKEN) {
  console.warn(
    "\nAVISO: variavel de ambiente CLAUDE_CODE_OAUTH_TOKEN nao definida -- as correcoes vao falhar ate configura-la (gere com 'claude setup-token').\n"
  );
}
if (!process.env.SESSION_SECRET) {
  console.warn("AVISO: SESSION_SECRET nao definida -- usando um valor aleatorio gerado agora (sessoes de login serao invalidadas a cada reinicio do servidor).");
}
if (!REGISTRATION_CODE) {
  console.warn("AVISO: REGISTRATION_CODE nao definida -- ninguem consegue criar conta ate voce configurar essa variavel de ambiente.");
}

const app = express();
app.use(express.json({ limit: "5mb" }));
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: "lax", maxAge: 30 * 24 * 60 * 60 * 1000 },
  })
);

// ---------- Utilitarios de armazenamento local ----------

function ensureDataFile(file, defaultContent) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(file)) fs.writeFileSync(file, defaultContent, "utf8");
}

function readHistory() {
  ensureDataFile(DATA_FILE, "[]");
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Falha ao ler historico, recriando arquivo:", err.message);
    return [];
  }
}

function writeHistory(list) {
  ensureDataFile(DATA_FILE, "[]");
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), "utf8");
}

function readUsers() {
  ensureDataFile(USERS_FILE, "[]");
  try {
    const raw = fs.readFileSync(USERS_FILE, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Falha ao ler usuarios, recriando arquivo:", err.message);
    return [];
  }
}

function writeUsers(list) {
  ensureDataFile(USERS_FILE, "[]");
  fs.writeFileSync(USERS_FILE, JSON.stringify(list, null, 2), "utf8");
}

// ---------- Montagem do conteudo da skill ----------

function loadSkillContent() {
  let content = "";
  const skillMd = path.join(SKILL_DIR, "SKILL.md");
  if (fs.existsSync(skillMd)) {
    content += fs.readFileSync(skillMd, "utf8") + "\n\n";
  }
  const refsDir = path.join(SKILL_DIR, "references");
  if (fs.existsSync(refsDir)) {
    for (const file of fs.readdirSync(refsDir).sort()) {
      if (file.endsWith(".md")) {
        content += `\n\n----- references/${file} -----\n\n`;
        content += fs.readFileSync(path.join(refsDir, file), "utf8");
      }
    }
  }
  return content;
}

// Cache em memoria -- os arquivos da skill nao mudam durante a execucao.
const SKILL_CONTENT = loadSkillContent();

// ---------- Construcao do prompt enviado ao Claude ----------

function buildCorrectionPrompt(tema, texto) {
  return `Voce deve atuar exatamente como a skill "correcao-redacao-enem-jana-rabelo" descrita abaixo. Leia todo o conteudo da skill (instrucoes principais + arquivos de referencia) e aplique o "Modo Correcao" com rigor ao texto do usuario, usando o vocabulario tecnico do metodo (lacuna argumentativa, repertorio de bolso vs. produtivo, tangenciamento interno, tecnica do sanduiche, etc.) sempre que fizer sentido.

===== INICIO DO CONTEUDO DA SKILL =====
${SKILL_CONTENT}
===== FIM DO CONTEUDO DA SKILL =====

Agora corrija a redacao abaixo.

Tema da proposta (se informado pelo usuario): ${tema && tema.trim() ? tema.trim() : "nao informado -- identifique pelo proprio texto"}

Texto da redacao:
"""
${texto}
"""

IMPORTANTE: responda ESTRITAMENTE com um unico objeto JSON valido, sem nenhum texto antes ou depois, sem blocos de codigo markdown (sem \`\`\`), seguindo EXATAMENTE este formato:

{
  "tema": "string - o tema identificado ou informado",
  "notaTotal": number,
  "competencias": [
    {"numero":1,"nome":"Dominio da norma culta","nota":number,"justificativa":"string em prosa, citando trechos do texto"},
    {"numero":2,"nome":"Compreensao do tema e repertorio","nota":number,"justificativa":"string"},
    {"numero":3,"nome":"Projeto de texto e argumentacao","nota":number,"justificativa":"string"},
    {"numero":4,"nome":"Coesao textual","nota":number,"justificativa":"string"},
    {"numero":5,"nome":"Proposta de intervencao","nota":number,"justificativa":"string"}
  ],
  "analiseParagrafos": [
    {"parte":"Introducao","comentario":"string"},
    {"parte":"Desenvolvimento 1","comentario":"string"},
    {"parte":"Desenvolvimento 2","comentario":"string"},
    {"parte":"Conclusao / Proposta de intervencao","comentario":"string"}
  ],
  "veredito": "string - paragrafo final resumindo pontos fortes e as principais melhorias a priorizar",
  "marcacoes": [
    {"trecho":"string - copiado EXATAMENTE do texto do aluno, caractere por caractere, sem parafrasear (entre 3 e 15 palavras)","competencia":number de 1 a 5,"tipo":"acerto ou erro","comentario":"string curta explicando o que esse trecho especifico representa"}
  ]
}

Regras do formato: as notas de cada competencia devem ser multiplos de 40 (0, 40, 80, 120, 160 ou 200); notaTotal deve ser exatamente a soma das cinco notas de competencia; se a redacao tiver mais de dois paragrafos de desenvolvimento, inclua todos em analiseParagrafos mantendo os nomes "Desenvolvimento N". Responda em portugues do Brasil.

Regras de "marcacoes" (marcacao de trechos do texto, como se voce estivesse grifando a redacao a mao com canetas coloridas por competencia): este campo e OBRIGATORIO e nao pode ficar vazio, exceto se o texto enviado for curto demais para ter qualquer trecho analisavel. Identifique de 8 a 18 trechos ao todo, cobrindo os pontos mais relevantes que voce mencionou na sua analise (tanto acertos quanto erros), distribuidos entre as competencias -- nao precisa ser exaustivo, priorize o que mais pesa na nota. Cada "trecho" tem que ser uma citacao EXATA e continua do texto do aluno (mesma pontuacao, acentuacao e espacamento), pois sera usado para localizar o trecho no texto original por busca literal -- se voce parafrasear, a marcacao sera descartada. Nunca inclua dois trechos que se sobrepoem no texto.`;
}

function buildTutorPrompt(tema, etapaLabel, dica, texto, etapasAnteriores) {
  const contextoAnterior = (etapasAnteriores || [])
    .map((e) => `--- ${e.titulo} (ja escrito pelo aluno) ---\n${e.texto}`)
    .join("\n\n");

  return `Voce deve atuar exatamente como a skill "correcao-redacao-enem-jana-rabelo" descrita abaixo, especificamente incorporando o "Modo Escrita" (orientacao/planejamento) e o tom didatico da professora Jana Rabelo. Leia todo o conteudo da skill antes de responder.

===== INICIO DO CONTEUDO DA SKILL =====
${SKILL_CONTENT}
===== FIM DO CONTEUDO DA SKILL =====

Contexto: um aluno esta aprendendo a escrever uma redacao nos moldes do ENEM, construindo o texto etapa por etapa (paragrafo por paragrafo), com orientacao a cada etapa -- como se voce fosse a professora Jana dando feedback em tempo real, em primeira pessoa, tom encorajador mas rigoroso e preciso (nunca vago ou generico).

Tema da redacao: ${tema}

${
  contextoAnterior
    ? `Paragrafos que o aluno ja escreveu em etapas anteriores, para contexto (nao avalie eles agora, use apenas para checar coerencia e progressao com o que vem a seguir):\n\n${contextoAnterior}\n\n`
    : ""
}O aluno agora escreveu a etapa "${etapaLabel}". O que se espera nessa etapa, segundo o metodo: ${dica}

Texto que o aluno escreveu para esta etapa:
"""
${texto}
"""

Avalie ESPECIFICAMENTE este paragrafo (nao a redacao inteira, que ainda nao esta completa). Verifique coerencia com as etapas anteriores (se houver), aderencia ao que o metodo espera para esta etapa especifica, e aponte no maximo 3 pontos fortes e 3 pontos de melhoria bem especificos, citando o trecho do proprio aluno sempre que apontar um problema. Use o vocabulario tecnico do metodo (lacuna argumentativa, repertorio de bolso vs. produtivo, topico frasal, amarracao lexical, tangenciamento, generalizacao excessiva, etc.) quando o fenomeno correspondente aparecer.

IMPORTANTE: responda ESTRITAMENTE com um unico objeto JSON valido, sem nenhum texto antes ou depois, sem blocos de codigo markdown (sem \`\`\`), seguindo EXATAMENTE este formato:

{
  "mensagem": "string em portugues, em primeira pessoa como a professora Jana falando diretamente com o aluno, tom didatico e encorajador mas preciso -- de 3 a 6 frases, pode citar trechos do texto do aluno entre aspas",
  "pontosFortes": ["string curta", "string curta"],
  "pontosMelhorar": ["string curta e acionavel", "string curta e acionavel"],
  "coerente": boolean
}

"coerente" deve ser true se o paragrafo cumpre o essencial esperado da etapa (mesmo com pontos de melhoria a fazer) e false se ha um problema estrutural serio que precisa ser corrigido antes de avancar para a proxima etapa (por exemplo: tese sem os dois argumentos, paragrafo fora do recorte do tema, proposta de intervencao sem elementos minimos). Responda em portugues do Brasil.`;
}

// ---------- Chamada ao Claude Code CLI ----------

// Garante que o binario local do Claude Code (instalado como dependencia do
// projeto) seja encontrado, independente de o processo ter sido iniciado com
// "npm start" ou diretamente com "node server.js".
const CLAUDE_BIN_DIR = path.join(__dirname, "node_modules", ".bin");

function extractJsonObject(text) {
  // Remove possiveis cercas de bloco de codigo e tenta parsear.
  const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch (_) {
    // Tenta isolar o primeiro { ate o ultimo } do texto.
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      const slice = cleaned.slice(start, end + 1);
      try {
        return JSON.parse(slice);
      } catch (_) {
        // cai no erro abaixo, com a resposta bruta para diagnostico
      }
    }
    const preview = cleaned.slice(0, 400);
    throw new Error(`Nao foi possivel extrair JSON valido da resposta do modelo. Resposta recebida: "${preview}"`);
  }
}

function runClaudeCLI(prompt) {
  return new Promise((resolve, reject) => {
    const env = Object.assign({}, process.env, {
      PATH: `${CLAUDE_BIN_DIR}${path.delimiter}${process.env.PATH || ""}`,
    });

    const child = spawn("claude", ["-p", "--output-format", "json", "--model", CLAUDE_MODEL], {
      shell: process.platform === "win32",
      env,
    });

    let stdout = "";
    let stderr = "";
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error("O Claude Code demorou demais para responder (timeout de 6 minutos)."));
    }, 6 * 60 * 1000);

    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));

    child.on("error", (err) => {
      clearTimeout(timeout);
      if (err.code === "ENOENT") {
        reject(new Error('Comando "claude" nao encontrado neste servidor. Confirme que "@anthropic-ai/claude-code" esta instalado.'));
      } else {
        reject(err);
      }
    });

    child.on("close", (code) => {
      clearTimeout(timeout);
      if (code !== 0 && !stdout.trim()) {
        reject(
          new Error(
            `Claude Code encerrou com erro (codigo ${code}): ${
              stderr || "sem detalhes"
            }. Verifique se CLAUDE_CODE_OAUTH_TOKEN esta configurada e valida.`
          )
        );
        return;
      }
      resolve(stdout);
    });

    child.stdin.write(prompt);
    child.stdin.end();
  });
}

function unwrapClaudeOutput(rawOutput) {
  // O modo --output-format json do Claude Code envolve a resposta num objeto
  // com metadados. Tentamos extrair o campo de texto final; se o formato for
  // diferente do esperado, caimos para tratar a saida inteira como o texto.
  try {
    const wrapper = JSON.parse(rawOutput);
    if (typeof wrapper === "object" && wrapper !== null) {
      return wrapper.result || wrapper.response || wrapper.output_text || rawOutput;
    }
  } catch (_) {
    // rawOutput ja era texto puro (ou markdown com JSON dentro) -- segue com ele mesmo.
  }
  return rawOutput;
}

async function correctWithClaude(tema, texto) {
  const prompt = buildCorrectionPrompt(tema, texto);
  const rawOutput = await runClaudeCLI(prompt);
  return extractJsonObject(unwrapClaudeOutput(rawOutput));
}

async function tutorWithClaude(tema, etapaLabel, dica, texto, etapasAnteriores) {
  const prompt = buildTutorPrompt(tema, etapaLabel, dica, texto, etapasAnteriores);
  const rawOutput = await runClaudeCLI(prompt);
  return extractJsonObject(unwrapClaudeOutput(rawOutput));
}

// ---------- Autenticacao ----------

function normalizarUsuario(username) {
  return String(username || "").trim().toLowerCase();
}

app.post("/api/register", async (req, res) => {
  const { username, password, codigo } = req.body || {};

  if (!REGISTRATION_CODE) {
    return res.status(500).json({ erro: "Registro desabilitado: o administrador do site ainda nao configurou o codigo de convite." });
  }
  if (codigo !== REGISTRATION_CODE) {
    return res.status(403).json({ erro: "Codigo de convite invalido." });
  }

  const usernameNormalizado = normalizarUsuario(username);
  if (usernameNormalizado.length < 3) {
    return res.status(400).json({ erro: "O usuario precisa ter pelo menos 3 caracteres." });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ erro: "A senha precisa ter pelo menos 6 caracteres." });
  }

  const usuarios = readUsers();
  if (usuarios.some((u) => u.username === usernameNormalizado)) {
    return res.status(409).json({ erro: "Ja existe uma conta com esse nome de usuario." });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const usuario = {
    id: crypto.randomUUID(),
    username: usernameNormalizado,
    passwordHash,
    criadoEm: new Date().toISOString(),
  };
  usuarios.push(usuario);
  writeUsers(usuarios);

  req.session.userId = usuario.id;
  req.session.username = usuario.username;
  res.json({ ok: true, username: usuario.username });
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body || {};
  const usernameNormalizado = normalizarUsuario(username);

  const usuarios = readUsers();
  const usuario = usuarios.find((u) => u.username === usernameNormalizado);
  if (!usuario) {
    return res.status(401).json({ erro: "Usuario ou senha invalidos." });
  }

  const senhaOk = await bcrypt.compare(password || "", usuario.passwordHash);
  if (!senhaOk) {
    return res.status(401).json({ erro: "Usuario ou senha invalidos." });
  }

  req.session.userId = usuario.id;
  req.session.username = usuario.username;
  res.json({ ok: true, username: usuario.username });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get("/api/session", (req, res) => {
  if (req.session && req.session.userId) {
    res.json({ loggedIn: true, username: req.session.username });
  } else {
    res.json({ loggedIn: false });
  }
});

// Portas de entrada publicas: paginas de login/registro e seus scripts, alem
// das rotas acima. Tudo o mais exige sessao autenticada.
const CAMINHOS_PUBLICOS = new Set([
  "/login.html",
  "/register.html",
  "/login.js",
  "/register.js",
  "/styles.css",
  "/auth.css",
  "/img/login-bg.jpg",
  "/favicon.ico",
]);

app.use((req, res, next) => {
  if (CAMINHOS_PUBLICOS.has(req.path) || req.path.startsWith("/api/login") || req.path.startsWith("/api/register")) {
    return next();
  }
  if (req.session && req.session.userId) {
    return next();
  }
  if (req.path.startsWith("/api/")) {
    return res.status(401).json({ erro: "Nao autenticado. Faca login." });
  }
  return res.redirect("/login.html");
});

app.use(express.static(path.join(__dirname, "public")));

// ---------- Rotas da API ----------

app.get("/api/status", (req, res) => {
  res.json({ iaDisponivel: !!process.env.CLAUDE_CODE_OAUTH_TOKEN });
});

const ORIGENS_VALIDAS = ["corrigir", "praticar", "aprender"];

app.post("/api/correct", async (req, res) => {
  const { tema, texto, origem } = req.body || {};
  if (!texto || !texto.trim()) {
    return res.status(400).json({ erro: "Envie o texto da redacao no campo 'texto'." });
  }

  try {
    const resultado = await correctWithClaude(tema, texto);

    const registro = {
      id: crypto.randomUUID(),
      userId: req.session.userId,
      data: new Date().toISOString(),
      origem: ORIGENS_VALIDAS.includes(origem) ? origem : "corrigir",
      tema: resultado.tema || tema || "Tema nao identificado",
      texto,
      notaTotal: resultado.notaTotal,
      competencias: resultado.competencias,
      analiseParagrafos: resultado.analiseParagrafos || [],
      veredito: resultado.veredito || "",
      marcacoes: resultado.marcacoes || [],
    };

    const historico = readHistory();
    historico.push(registro);
    writeHistory(historico);

    res.json(registro);
  } catch (err) {
    console.error("Erro ao corrigir redacao:", err);
    res.status(500).json({ erro: err.message || "Erro desconhecido ao corrigir a redacao." });
  }
});

app.post("/api/tutor", async (req, res) => {
  const { tema, etapaLabel, dica, texto, etapasAnteriores } = req.body || {};
  if (!texto || !texto.trim()) {
    return res.status(400).json({ erro: "Envie o texto desta etapa no campo 'texto'." });
  }
  if (!etapaLabel) {
    return res.status(400).json({ erro: "Etapa nao informada." });
  }

  try {
    const resultado = await tutorWithClaude(tema, etapaLabel, dica || "", texto, etapasAnteriores || []);
    res.json(resultado);
  } catch (err) {
    console.error("Erro ao gerar feedback do tutor:", err);
    res.status(500).json({ erro: err.message || "Erro desconhecido ao gerar feedback." });
  }
});

app.get("/api/historico", (req, res) => {
  const historico = readHistory()
    .filter((r) => r.userId === req.session.userId)
    .slice()
    .sort((a, b) => new Date(a.data) - new Date(b.data))
    .map((r) => ({
      id: r.id,
      data: r.data,
      origem: r.origem || "corrigir",
      tema: r.tema,
      notaTotal: r.notaTotal,
      competencias: (r.competencias || []).map((c) => ({ numero: c.numero, nome: c.nome, nota: c.nota })),
    }));
  res.json(historico);
});

app.get("/api/historico/:id", (req, res) => {
  const historico = readHistory();
  const registro = historico.find((r) => r.id === req.params.id && r.userId === req.session.userId);
  if (!registro) return res.status(404).json({ erro: "Redacao nao encontrada no historico." });
  res.json(registro);
});

app.delete("/api/historico/:id", (req, res) => {
  const historico = readHistory();
  const alvo = historico.find((r) => r.id === req.params.id && r.userId === req.session.userId);
  if (!alvo) return res.json({ ok: true, removido: false });
  const next = historico.filter((r) => r.id !== req.params.id);
  writeHistory(next);
  res.json({ ok: true, removido: true });
});

app.listen(PORT, () => {
  console.log(`\nApp de correcao de redacao rodando em http://localhost:${PORT}\n`);
});
