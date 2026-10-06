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
const db = require("./db");
const guiado = require("./guiado");

const PORT = process.env.PORT || 4321;
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

// ---------- Acesso pelo app de celular (Roteiro ENEM 30) ----------
// O app Android roda numa WebView com origem propria (https://localhost) e nao
// carrega o cookie de sessao do site. Por isso ele entra com usuario e senha em
// /api/app/login, recebe um token e manda "Authorization: Bearer <token>".
// O site continua usando so o cookie, como antes.

const ORIGENS_APP = new Set(["https://localhost", "http://localhost", "capacitor://localhost", "http://localhost:8929"]);

app.use((req, res, next) => {
  const origem = req.headers.origin;
  if (origem && ORIGENS_APP.has(origem)) {
    res.setHeader("Access-Control-Allow-Origin", origem);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    res.setHeader("Access-Control-Max-Age", "86400");
    if (req.method === "OPTIONS") return res.sendStatus(204);
  }
  next();
});

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

// Descobre quem esta pedindo: cookie do site ou token do app.
app.use(async (req, res, next) => {
  if (req.session && req.session.userId) {
    req.userId = req.session.userId;
    return next();
  }
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Bearer ")) return next();
  try {
    const usuario = await db.getUserByAppToken(hashToken(auth.slice(7).trim()));
    if (usuario) {
      req.userId = usuario.id;
      req.username = usuario.username;
    }
  } catch (err) {
    console.error("Erro ao validar token do app:", err.message);
  }
  next();
});

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
  if (/Failed to authenticate|API Error: 401|OAuth access token has been revoked|token (has )?expired/i.test(String(rawOutput))) {
    throw new Error("O token do Claude neste servidor foi revogado ou expirou. Gere um novo com \"claude setup-token\" e atualize CLAUDE_CODE_OAUTH_TOKEN no Render.");
  }
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

// ---------- Chamada ao Gemini (tarefas curtas e frequentes) ----------
// O retorno de cada paragrafo (tutor) e o exercicio guiado sao pedidos curtos e
// frequentes: vao para o Gemini quando GEMINI_API_KEY esta configurada, para
// responder rapido e nao gastar a assinatura. Sem a chave, caem no Claude Code.
// A correcao da redacao completa continua no Claude.

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";

async function modelosGemini() {
  try {
    const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models", {
      headers: { "x-goog-api-key": process.env.GEMINI_API_KEY },
    });
    const j = await r.json();
    return (j.models || [])
      .filter((m) => (m.supportedGenerationMethods || []).includes("generateContent"))
      .map((m) => m.name.replace("models/", ""))
      .filter((n) => /flash|pro/.test(n) && !/image|tts|audio|robotics|computer|preview/.test(n))
      .slice(0, 8);
  } catch (_) {
    return [];
  }
}

async function callGemini(prompt, maxOutputTokens, modelo) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelo || GEMINI_MODEL)}:generateContent`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 75 * 1000);
  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, responseMimeType: "application/json", maxOutputTokens: maxOutputTokens || 8192 },
      }),
      signal: ctrl.signal,
    });
  } catch (err) {
    const e = new Error(err.name === "AbortError" ? "O Gemini demorou demais para responder." : `Gemini: ${err.message}`);
    e.temporario = true;
    throw e;
  } finally {
    clearTimeout(timer);
  }
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = json && json.error ? json.error.message : `HTTP ${res.status}`;
    if (/not available|not found|no longer available/i.test(msg)) {
      const nomes = await modelosGemini();
      throw new Error(`Gemini: ${msg}${nomes.length ? ` -- modelos disponiveis para a chave: ${nomes.join(", ")} (ajuste GEMINI_MODEL)` : ""}`);
    }
    const e = new Error(`Gemini: ${msg}`);
    // sobrecarga, limite de uso ou falha do lado do Google: vale tentar de novo ou usar o Claude
    e.temporario = [429, 500, 502, 503, 504].includes(res.status) || /high demand|overloaded|unavailable|try again|quota|rate/i.test(msg);
    throw e;
  }
  const cand = json && json.candidates && json.candidates[0];
  const text = cand && cand.content && cand.content.parts ? cand.content.parts.map((p) => p.text || "").join("") : "";
  if (!text) throw new Error(`Gemini devolveu resposta vazia (${(cand && cand.finishReason) || "sem motivo"}).`);
  if (cand.finishReason === "MAX_TOKENS") throw new Error("A resposta do Gemini foi cortada no limite de tamanho.");
  return text;
}

// Pede JSON para a IA das tarefas curtas: Gemini se houver chave, senao Claude Code.
// Se o Gemini estiver sobrecarregado, tenta mais uma vez quando a falha foi rapida
// e, persistindo, usa o Claude Code para o aluno nao ficar sem resposta.
// Outro modelo "flash" disponivel para a chave, para quando o principal estiver sobrecarregado.
let MODELO_RESERVA;
async function modeloReserva() {
  if (MODELO_RESERVA === undefined) {
    const nomes = (await modelosGemini()).filter((n) => n !== GEMINI_MODEL && /flash/.test(n));
    MODELO_RESERVA = nomes.find((n) => !/lite/.test(n)) || nomes[0] || null;
  }
  return MODELO_RESERVA;
}

async function iaRapida(prompt, maxOutputTokens) {
  if (process.env.GEMINI_API_KEY) {
    const modelos = [GEMINI_MODEL];
    for (let i = 0; i < modelos.length; i++) {
      try {
        return extractJsonObject(await callGemini(prompt, maxOutputTokens, modelos[i]));
      } catch (err) {
        if (!err.temporario) throw err;
        console.warn(`Gemini ${modelos[i]} indisponivel: ${err.message}`);
        if (i === 0) {
          const reserva = await modeloReserva();
          if (reserva) modelos.push(reserva);
        }
      }
    }
    console.warn("Usando o Claude Code no lugar do Gemini.");
  }
  return extractJsonObject(unwrapClaudeOutput(await runClaudeCLI(prompt)));
}

async function correctWithClaude(tema, texto) {
  const prompt = buildCorrectionPrompt(tema, texto);
  const rawOutput = await runClaudeCLI(prompt);
  return extractJsonObject(unwrapClaudeOutput(rawOutput));
}

async function tutorWithClaude(tema, etapaLabel, dica, texto, etapasAnteriores) {
  const prompt = buildTutorPrompt(tema, etapaLabel, dica, texto, etapasAnteriores);
  return guiado.normalizarTutor(await iaRapida(prompt, 4096));
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

  try {
    const existente = await db.getUserByUsername(usernameNormalizado);
    if (existente) {
      return res.status(409).json({ erro: "Ja existe uma conta com esse nome de usuario." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const usuario = { id: crypto.randomUUID(), username: usernameNormalizado, passwordHash };
    await db.createUser(usuario);

    req.session.userId = usuario.id;
    req.session.username = usuario.username;
    res.json({ ok: true, username: usuario.username });
  } catch (err) {
    console.error("Erro ao criar conta:", err);
    res.status(500).json({ erro: err.message || "Erro desconhecido ao criar conta." });
  }
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body || {};
  const usernameNormalizado = normalizarUsuario(username);

  try {
    const usuario = await db.getUserByUsername(usernameNormalizado);
    if (!usuario) {
      return res.status(401).json({ erro: "Usuario ou senha invalidos." });
    }

    const senhaOk = await bcrypt.compare(password || "", usuario.password_hash);
    if (!senhaOk) {
      return res.status(401).json({ erro: "Usuario ou senha invalidos." });
    }

    req.session.userId = usuario.id;
    req.session.username = usuario.username;
    res.json({ ok: true, username: usuario.username });
  } catch (err) {
    console.error("Erro ao entrar:", err);
    res.status(500).json({ erro: err.message || "Erro desconhecido ao entrar." });
  }
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.post("/api/app/login", async (req, res) => {
  const { username, password } = req.body || {};
  try {
    const usuario = await db.getUserByUsername(normalizarUsuario(username));
    const senhaOk = usuario && (await bcrypt.compare(password || "", usuario.password_hash));
    if (!senhaOk) {
      return res.status(401).json({ erro: "Usuario ou senha invalidos." });
    }
    const token = crypto.randomBytes(32).toString("hex");
    await db.createAppToken(hashToken(token), usuario.id);
    res.json({ ok: true, token, username: usuario.username, iaDisponivel: !!process.env.CLAUDE_CODE_OAUTH_TOKEN });
  } catch (err) {
    console.error("Erro no login do app:", err);
    res.status(500).json({ erro: err.message || "Erro desconhecido ao entrar." });
  }
});

app.post("/api/app/logout", async (req, res) => {
  const auth = req.headers.authorization || "";
  try {
    if (auth.startsWith("Bearer ")) await db.deleteAppToken(hashToken(auth.slice(7).trim()));
  } catch (err) {
    console.error("Erro ao sair do app:", err.message);
  }
  res.json({ ok: true });
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
  if (CAMINHOS_PUBLICOS.has(req.path) || req.path.startsWith("/api/login") || req.path.startsWith("/api/register") || req.path.startsWith("/api/app/")) {
    return next();
  }
  if (req.userId) {
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
  res.json({ iaDisponivel: !!process.env.CLAUDE_CODE_OAUTH_TOKEN, gemini: !!process.env.GEMINI_API_KEY });
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
      userId: req.userId,
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

    await db.insertCorrection(registro);

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

// ---------- Aprendizado guiado (exercicio de lacunas) ----------

app.post("/api/exercicio", async (req, res) => {
  const { parte, tema } = req.body || {};
  try {
    const bruto = await iaRapida(guiado.promptExercicio(SKILL_CONTENT, parte, tema), 8192);
    res.json(guiado.normalizarExercicio(bruto));
  } catch (err) {
    console.error("Erro ao gerar exercicio guiado:", err);
    res.status(500).json({ erro: err.message || "Erro desconhecido ao gerar o exercicio." });
  }
});

app.post("/api/exercicio/analisar", async (req, res) => {
  const { exercicio, respostas } = req.body || {};
  if (!exercicio || !exercicio.modelo) {
    return res.status(400).json({ erro: "Envie o exercicio recebido no campo 'exercicio'." });
  }
  const preenchido = guiado.montarPreenchido(exercicio.modelo, respostas || {});
  if (/lacuna não preenchida/.test(preenchido)) {
    return res.status(400).json({ erro: "Preencha todas as lacunas antes de pedir a analise." });
  }
  try {
    const bruto = await iaRapida(guiado.promptAnaliseGuiada(SKILL_CONTENT, exercicio, preenchido), 16384);
    res.json({ preenchido, analise: guiado.normalizarAnaliseGuiada(bruto, preenchido) });
  } catch (err) {
    console.error("Erro ao analisar exercicio guiado:", err);
    res.status(500).json({ erro: err.message || "Erro desconhecido ao analisar o exercicio." });
  }
});

// ---------- Avaliacao por criterios (exercicios curtos do app) ----------

app.post("/api/avaliar", async (req, res) => {
  const { tema, tarefa, texto, criterios } = req.body || {};
  if (!texto || !String(texto).trim()) return res.status(400).json({ erro: "Envie o texto no campo 'texto'." });
  if (!Array.isArray(criterios) || !criterios.length || criterios.length > 10) {
    return res.status(400).json({ erro: "Envie de 1 a 10 criterios no campo 'criterios'." });
  }
  try {
    const lista = criterios.map((c) => String(c).slice(0, 200));
    const bruto = await iaRapida(guiado.promptAvaliar(SKILL_CONTENT, { tema, tarefa: String(tarefa || "").slice(0, 400), texto: String(texto).slice(0, 4000), criterios: lista }), 4096);
    res.json(guiado.normalizarAvaliacao(bruto, lista.length));
  } catch (err) {
    console.error("Erro ao avaliar exercicio:", err);
    res.status(500).json({ erro: err.message || "Erro desconhecido ao avaliar o exercicio." });
  }
});

app.get("/api/historico", async (req, res) => {
  try {
    const historico = (await db.getHistoryForUser(req.userId)).map((r) => ({
      id: r.id,
      data: r.data,
      origem: r.origem || "corrigir",
      tema: r.tema,
      notaTotal: r.notaTotal,
      competencias: (r.competencias || []).map((c) => ({ numero: c.numero, nome: c.nome, nota: c.nota })),
    }));
    res.json(historico);
  } catch (err) {
    console.error("Erro ao carregar historico:", err);
    res.status(500).json({ erro: err.message || "Erro desconhecido ao carregar historico." });
  }
});

app.get("/api/historico/:id", async (req, res) => {
  try {
    const registro = await db.getCorrectionById(req.params.id, req.userId);
    if (!registro) return res.status(404).json({ erro: "Redacao nao encontrada no historico." });
    res.json(registro);
  } catch (err) {
    console.error("Erro ao carregar redacao:", err);
    res.status(500).json({ erro: err.message || "Erro desconhecido ao carregar redacao." });
  }
});

app.delete("/api/historico/:id", async (req, res) => {
  try {
    const removido = await db.deleteCorrectionById(req.params.id, req.userId);
    res.json({ ok: true, removido });
  } catch (err) {
    console.error("Erro ao remover redacao:", err);
    res.status(500).json({ erro: err.message || "Erro desconhecido ao remover redacao." });
  }
});

db.ensureSchema()
  .catch((err) => {
    console.error("Falha ao preparar o banco de dados:", err.message);
  })
  .finally(() => {
    app.listen(PORT, () => {
      console.log(`\nApp de correcao de redacao rodando em http://localhost:${PORT}\n`);
    });
  });
