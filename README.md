# Redação ENEM — Método Jana Rabelo

Aplicativo web para corrigir redações no estilo ENEM usando o método de correção da professora Jana Rabelo, praticar com temas sorteados, aprender a construir uma redação do zero com uma tutora por chat, e acompanhar sua evolução ao longo do tempo. Pode rodar só na sua máquina ou ser publicado online para acessar de qualquer lugar, com login por conta.

A correção é feita chamando o **Claude Code CLI**, autenticado com um token de longa duração gerado a partir da sua assinatura Claude (Pro/Max) — não usa a API paga por token. O acesso ao site exige login; criar conta exige um código de convite definido por você.

## Pré-requisitos

1. **Node.js 18 ou mais recente** — [nodejs.org](https://nodejs.org)
2. **Uma assinatura Claude Pro, Max, Team ou Enterprise** com o Claude Code já autenticado na sua máquina (`claude --version` funcionando no terminal).

## Variáveis de ambiente

| Variável | Obrigatória | Para quê |
|---|---|---|
| `CLAUDE_CODE_OAUTH_TOKEN` | Sim | Token de longa duração (gerado com `claude setup-token`) que autentica o Claude Code com sua assinatura, sem precisar de login interativo no servidor. |
| `REGISTRATION_CODE` | Sim (para permitir cadastro) | Código de convite que quem for criar conta precisa digitar. Escolha algo só seu e compartilhe apenas com quem deve ter acesso. |
| `SESSION_SECRET` | Recomendada | Chave usada para assinar o cookie de sessão. Se não definida, uma é gerada aleatoriamente a cada reinício do servidor — nesse caso, todo mundo é deslogado sempre que o servidor reinicia. Use uma string longa e aleatória. |
| `ANTHROPIC_MODEL` | Não | Modelo usado nas correções (aceita alias como `sonnet`/`opus` ou o nome completo, ex.: `claude-sonnet-5`). Padrão: `sonnet`. |
| `PORT` | Não | Porta do servidor. Padrão: `4321`. A maioria das hospedagens define isso automaticamente. |

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
$env:REGISTRATION_CODE="escolha-um-codigo"
$env:SESSION_SECRET="uma-string-aleatoria-longa"
npm start
```

macOS/Linux:

```
export CLAUDE_CODE_OAUTH_TOKEN="o-token-gerado-acima"
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

## Personalizando o método de correção

O método completo (matriz oficial do ENEM, vocabulário da Jana Rabelo, casos de calibração e método de planejamento) está nos arquivos dentro de `skill/`. Edite esses Markdown diretamente para ajustar critérios ou registrar mudanças de edições futuras do ENEM — o app sempre lê o conteúdo mais recente antes de cada correção.

## Onde ficam os dados

`data/users.json` (contas, com senha sempre em hash — nunca em texto puro) e `data/corrections.json` (histórico de correções, cada uma vinculada ao usuário que a gerou). São arquivos locais no servidor onde o app roda; a maioria das hospedagens gratuitas/simples **não garante que esses arquivos persistam** entre deploys — para persistência real em produção, considere migrar para um banco de dados.

## Solução de problemas

- **"O Claude Code não está configurado neste servidor"**: defina `CLAUDE_CODE_OAUTH_TOKEN` no ambiente onde o app roda (gere com `claude setup-token`) e reinicie o processo.
- **Comando "claude" não encontrado**: confirme que `npm install` rodou sem erros — o Claude Code CLI é instalado como dependência do projeto (`@anthropic-ai/claude-code`).
- **Não consigo criar conta / "Registro desabilitado"**: `REGISTRATION_CODE` não foi definida no servidor.
- **Fui deslogado sozinho**: se `SESSION_SECRET` não estiver definida, o servidor gera uma nova a cada reinício, o que invalida todos os logins — defina essa variável para evitar isso.
- **A correção demora muito ou expira**: o timeout padrão é de 6 minutos; textos muito longos podem demorar até 1-2 minutos. Tente novamente se expirar.
- **Erro mencionando CLAUDE_CODE_OAUTH_TOKEN inválido**: o token pode ter expirado (validade de 1 ano) ou sido revogado — gere um novo com `claude setup-token`.
- **Porta ocupada**: rode com `PORT=outraporta npm start`.
