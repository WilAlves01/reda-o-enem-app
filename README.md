# Redação ENEM — Método Jana Rabelo

Aplicativo web para corrigir redações no estilo ENEM usando o método de correção da professora Jana Rabelo, praticar com temas sorteados, aprender a construir uma redação do zero com uma tutora por chat, e acompanhar sua evolução ao longo do tempo. Pode rodar só na sua máquina ou ser publicado online para várias pessoas usarem, com login por conta.

A correção é feita chamando a **API da Anthropic** (não depende mais de ter o Claude Code instalado). O acesso ao site exige login; criar conta exige um código de convite definido por você.

## Pré-requisitos

1. **Node.js 18 ou mais recente** — [nodejs.org](https://nodejs.org)
2. **Uma chave de API da Anthropic** — crie em [console.anthropic.com](https://console.anthropic.com). O uso da API é cobrado por token (separado de uma eventual assinatura do Claude.ai/Claude Code) — veja os preços em [platform.claude.com/docs/en/pricing](https://platform.claude.com/docs/en/pricing).

## Variáveis de ambiente

| Variável | Obrigatória | Para quê |
|---|---|---|
| `ANTHROPIC_API_KEY` | Sim | Autentica as chamadas de correção na API da Anthropic. |
| `REGISTRATION_CODE` | Sim (para permitir cadastro) | Código de convite que quem for criar conta precisa digitar. Escolha algo só seu e compartilhe apenas com quem deve ter acesso. |
| `SESSION_SECRET` | Recomendada | Chave usada para assinar o cookie de sessão. Se não definida, uma é gerada aleatoriamente a cada reinício do servidor — nesse caso, todo mundo é deslogado sempre que o servidor reinicia. Use uma string longa e aleatória. |
| `ANTHROPIC_MODEL` | Não | Modelo usado nas correções. Padrão: `claude-opus-5` (melhor qualidade, mais caro). Para reduzir custo, pode trocar por `claude-sonnet-5`. |
| `PORT` | Não | Porta do servidor. Padrão: `4321`. A maioria das hospedagens define isso automaticamente. |

## Rodando localmente

Na pasta do projeto:

```
npm install
```

Defina as variáveis de ambiente (Windows/PowerShell):

```
$env:ANTHROPIC_API_KEY="sua-chave-aqui"
$env:REGISTRATION_CODE="escolha-um-codigo"
$env:SESSION_SECRET="uma-string-aleatoria-longa"
npm start
```

macOS/Linux:

```
export ANTHROPIC_API_KEY="sua-chave-aqui"
export REGISTRATION_CODE="escolha-um-codigo"
export SESSION_SECRET="uma-string-aleatoria-longa"
npm start
```

Depois abra `http://localhost:4321`, clique em "Criar conta" e use o código de convite que você definiu.

## Publicando online

O app é um servidor Node.js comum (Express) e roda em qualquer hospedagem que suporte Node — Render, Railway, Fly.io, um VPS, etc. Passos gerais:

1. Suba o projeto para um repositório Git (sem incluir a pasta `node_modules` nem `data/`).
2. Na hospedagem, aponte o comando de build para `npm install` e o comando de start para `npm start` (ou `node server.js`).
3. Configure as variáveis de ambiente da tabela acima no painel da hospedagem (nunca coloque a chave de API direto no código).
4. A hospedagem normalmente expõe a própria porta via a variável `PORT`, que o app já respeita.

**Sobre custo e abuso:** qualquer pessoa com uma conta pode gerar chamadas à API (que custam dinheiro). O código de convite (`REGISTRATION_CODE`) é a única barreira contra cadastros não autorizados — mantenha-o em segredo e troque-o se ele vazar. Não há limite de uso por usuário nesta versão.

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

- **"A chave de API da Anthropic não está configurada neste servidor"**: defina `ANTHROPIC_API_KEY` no ambiente onde o `node server.js` roda e reinicie o processo.
- **Não consigo criar conta / "Registro desabilitado"**: `REGISTRATION_CODE` não foi definida no servidor.
- **Fui deslogado sozinho**: se `SESSION_SECRET` não estiver definida, o servidor gera uma nova a cada reinício, o que invalida todos os logins — defina essa variável para evitar isso.
- **A correção demora muito ou dá erro de limite**: textos longos podem levar até 1-2 minutos. Erros de limite de uso (HTTP 429) da API da Anthropic aparecem com uma mensagem clara — espere um pouco e tente de novo.
- **Porta ocupada**: rode com `PORT=outraporta npm start`.
