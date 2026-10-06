# Redação ENEM — Método Jana Rabelo

Aplicativo web para corrigir redações no estilo ENEM usando o método de correção da professora Jana Rabelo, praticar com temas sorteados, aprender a construir uma redação do zero com uma tutora por chat, e acompanhar sua evolução ao longo do tempo. Pode rodar só na sua máquina ou ser publicado online para acessar de qualquer lugar, com login por conta.

A correção é feita chamando o **Claude Code CLI**, autenticado com um token de longa duração gerado a partir da sua assinatura Claude (Pro/Max) — não usa a API paga por token. O acesso ao site exige login; criar conta exige um código de convite definido por você.

## Pré-requisitos

1. **Node.js 18 ou mais recente** — [nodejs.org](https://nodejs.org)
2. **Uma assinatura Claude Pro, Max, Team ou Enterprise** com o Claude Code já autenticado na sua máquina (`claude --version` funcionando no terminal).
3. **Um banco Postgres gratuito** — ex.: [neon.tech](https://neon.tech) ou [supabase.com](https://supabase.com). É onde contas e histórico ficam salvos de verdade (veja por quê logo abaixo).

## Variáveis de ambiente

| Variável | Obrigatória | Para quê |
|---|---|---|
| `CLAUDE_CODE_OAUTH_TOKEN` | Sim | Token de longa duração (gerado com `claude setup-token`) que autentica o Claude Code com sua assinatura, sem precisar de login interativo no servidor. |
| `DATABASE_URL` | Sim | String de conexão do banco Postgres (contas + histórico). Sem ela, nada é salvo de forma permanente. |
| `REGISTRATION_CODE` | Sim (para permitir cadastro) | Código de convite que quem for criar conta precisa digitar. Escolha algo só seu e compartilhe apenas com quem deve ter acesso. |
| `SESSION_SECRET` | Recomendada | Chave usada para assinar o cookie de sessão. Se não definida, uma é gerada aleatoriamente a cada reinício do servidor — nesse caso, todo mundo é deslogado sempre que o servidor reinicia. Use uma string longa e aleatória. |
| `ANTHROPIC_MODEL` | Não | Modelo usado nas correções (aceita alias como `sonnet`/`opus` ou o nome completo, ex.: `claude-sonnet-5`). Padrão: `sonnet`. |
| `GEMINI_API_KEY` | Não | Chave da API do Gemini (Google AI Studio). Quando definida, o retorno de cada parágrafo (`/api/tutor`) e o aprendizado guiado (`/api/exercicio`) usam o Gemini: respondem mais rápido e não gastam a assinatura. Sem ela, essas rotas usam o Claude Code. A correção da redação completa continua sempre no Claude. |
| `GEMINI_MODEL` | Não | Modelo do Gemini. Padrão: `gemini-3.5-flash`. Se o nome não existir para a chave, o erro lista os modelos disponíveis. |
| `PORT` | Não | Porta do servidor. Padrão: `4321`. A maioria das hospedagens define isso automaticamente. |

### Por que precisa de um banco de dados

Hospedagens gratuitas/simples (como o plano free da Render) **não garantem disco permanente** — o servidor pode reiniciar (por inatividade ou a cada novo deploy) e perder qualquer arquivo salvo localmente. Por isso contas e histórico ficam num banco Postgres externo, que sobrevive independente do servidor reiniciar.

### Conseguindo o `DATABASE_URL`

1. Crie uma conta gratuita em [neon.tech](https://neon.tech) (ou [supabase.com](https://supabase.com)) e um novo projeto/banco.
2. Copie a "Connection string" (formato `postgres://usuario:senha@host/banco?sslmode=require`).
3. Use esse valor como variável `DATABASE_URL` (local ou na hospedagem). O app cria as tabelas automaticamente na primeira vez que roda — não precisa rodar SQL manualmente.

Trate essa string como uma senha: nunca a compartilhe (ela contém a senha do banco embutida).

### Gerando o `CLAUDE_CODE_OAUTH_TOKEN`

No seu terminal, onde o `claude` já está instalado e logado com sua assinatura:

```
claude setup-token
```

Isso imprime um token válido por 1 ano. Copie e use como valor da variável `CLAUDE_CODE_OAUTH_TOKEN` (local ou na hospedagem). Guarde-o como um segredo — quem tiver esse token tem acesso à sua assinatura. Quando expirar (ou se vazar), gere um novo com o mesmo comando e atualize a variável.

> **Nota sobre uso**: esse mecanismo é documentado pela Anthropic para pipelines de CI e scripts automatizados vinculados à sua própria assinatura. Um site pessoal hospedado continuamente é um uso um pouco diferente disso — funciona tecnicamente, mas vale revisar os termos de uso da Claude se tiver dúvida sobre esse enquadramento, especialmente se algum dia esse site deixar de ser só para uso pessoal.

## Rodando localmente

Na pasta do projeto:

```
npm install
```

Defina as variáveis de ambiente (Windows/PowerShell):

```
$env:CLAUDE_CODE_OAUTH_TOKEN="o-token-gerado-acima"
$env:DATABASE_URL="a-connection-string-do-seu-banco"
$env:REGISTRATION_CODE="escolha-um-codigo"
$env:SESSION_SECRET="uma-string-aleatoria-longa"
npm start
```

macOS/Linux:

```
export CLAUDE_CODE_OAUTH_TOKEN="o-token-gerado-acima"
export DATABASE_URL="a-connection-string-do-seu-banco"
export REGISTRATION_CODE="escolha-um-codigo"
export SESSION_SECRET="uma-string-aleatoria-longa"
npm start
```

Depois abra `http://localhost:4321`, clique em "Criar conta" e use o código de convite que você definiu.

## Publicando online

O app é um servidor Node.js comum (Express) e roda em qualquer hospedagem que suporte Node — Render, Railway, Fly.io, um VPS, etc. Passos gerais:

1. Suba o projeto para um repositório Git (sem incluir a pasta `node_modules` nem `data/` — já cobertos pelo `.gitignore`).
2. Na hospedagem, aponte o comando de build para `npm install` e o comando de start para `npm start` (ou `node server.js`) — o `npm install` já instala o Claude Code CLI junto, como dependência do projeto.
3. Configure as variáveis de ambiente da tabela acima no painel da hospedagem (nunca coloque o token direto no código).
4. A hospedagem normalmente expõe a própria porta via a variável `PORT`, que o app já respeita.

**Sobre custo:** como a correção usa sua assinatura Claude (via `CLAUDE_CODE_OAUTH_TOKEN`) em vez da API paga por token, não há cobrança adicional por correção — o custo já está incluído na sua assinatura.

**Sobre os dados:** com login habilitado, o histórico de cada pessoa (aba "Dashboard") é privado — cada usuário só vê suas próprias redações corrigidas.

## Como usar

**Aba "Corrigir"** — cole o tema (opcional) e o texto da redação. A IA aplica o método de correção completo: nota por competência em cards (clique para expandir a justificativa), o próprio texto da redação com trechos grifados por competência/erro (passe o mouse para ver o que cada grifo significa), análise por parágrafo e um veredito final.

**Aba "Praticar"** — sorteia um tema com textos motivadores; escreva e envie para correção quando terminar.

**Aba "Aprender"** — constrói a redação com você, parágrafo por parágrafo (introdução, D1, D2, conclusão), com a professora Jana dando feedback pelo chat a cada etapa antes de liberar a próxima.

**Aba "Dashboard"** — total de redações corrigidas, nota média, melhor nota, gráfico de evolução e a tabela completa do seu histórico (com a origem — Corrigir/Praticar/Aprender — de cada uma).

## Acesso pelo app de celular (Roteiro ENEM 30)

O app Android Roteiro ENEM 30 usa este servidor para corrigir as redações completas. Ele não usa o cookie
do site: entra em `POST /api/app/login` com o mesmo usuário e senha, recebe um token e manda
`Authorization: Bearer <token>` nas chamadas a `/api/correct`. As correções feitas pelo app aparecem no
mesmo histórico do site.

- Os tokens ficam na tabela `app_tokens` (só o hash), criada automaticamente.
- `POST /api/app/logout` invalida o token.
- Só as origens do app (`https://localhost`, `capacitor://localhost`) recebem liberação de CORS.

## Treinos com IA (tutor e aprendizado guiado)

- `POST /api/tutor` — retorno da professora sobre um parágrafo (`tema`, `etapaLabel`, `dica`, `texto`, `etapasAnteriores`). Responde `mensagem`, `pontosFortes`, `pontosMelhorar` e `coerente`.
- `POST /api/exercicio` — monta um exercício de lacunas (`parte`: `introducao`, `desenvolvimento1`, `desenvolvimento2` ou `conclusao`; `tema` opcional).
- `POST /api/exercicio/analisar` — recebe `exercicio` e `respostas` (`{ "1": "...", "2": "..." }`) e devolve o parágrafo preenchido e a análise trecho a trecho, com repertório, desvios de português, competências e reescrita.

Os prompts vêm do app de desktop (`guiado.js`). Trechos e desvios citados pela IA que não existem no texto do aluno são descartados.

## Personalizando o método de correção

O método completo (matriz oficial do ENEM, vocabulário da Jana Rabelo, casos de calibração e método de planejamento) está nos arquivos dentro de `skill/`. Edite esses Markdown diretamente para ajustar critérios ou registrar mudanças de edições futuras do ENEM — o app sempre lê o conteúdo mais recente antes de cada correção.

## Onde ficam os dados

Contas (com senha sempre em hash — nunca em texto puro) e histórico de correções ficam no banco Postgres apontado por `DATABASE_URL`, não em arquivos locais — por isso sobrevivem a reinícios e redeploys do servidor.

## Solução de problemas

- **"O Claude Code não está configurado neste servidor"**: defina `CLAUDE_CODE_OAUTH_TOKEN` no ambiente onde o app roda (gere com `claude setup-token`) e reinicie o processo.
- **Comando "claude" não encontrado**: confirme que `npm install` rodou sem erros — o Claude Code CLI é instalado como dependência do projeto (`@anthropic-ai/claude-code`).
- **"DATABASE_URL não configurada neste servidor"**: defina essa variável com a connection string do seu banco Postgres (veja a seção acima).
- **Continuo sendo deslogado / minha conta some**: confirme que `DATABASE_URL` e `SESSION_SECRET` estão definidas na hospedagem — sem elas, nada persiste entre reinícios do servidor.
- **Não consigo criar conta / "Registro desabilitado"**: `REGISTRATION_CODE` não foi definida no servidor.
- **A correção demora muito ou expira**: o timeout padrão é de 6 minutos; textos muito longos podem demorar até 1-2 minutos. Tente novamente se expirar.
- **Erro mencionando CLAUDE_CODE_OAUTH_TOKEN inválido**: o token pode ter expirado (validade de 1 ano) ou sido revogado — gere um novo com `claude setup-token`.
- **Porta ocupada**: rode com `PORT=outraporta npm start`.
