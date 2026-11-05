# Política de Versões — Frontend (transversal)

> Qual versão de runtime e framework uma app de frontend pode usar, e quando migrar.
> Agnóstico de framework; cada coleção (`frontend/<stack>/stack.md`) fixa a versão concreta
> dentro desta janela. Política de CVE e aprovação de dependência:
> [`_shared/vulnerable-and-proprietary-libs.md`](../../_shared/vulnerable-and-proprietary-libs.md).

## 1. Regra das duas linhas

1. Só são aceitas as **duas linhas suportadas mais recentes** de cada runtime/framework.
   "Linha suportada" = LTS para quem publica LTS (Node.js, Angular); major com correção de
   segurança para quem não publica (React).
2. **App nova nasce na linha recomendada** (a mais recente). A linha anterior é aceita
   apenas para app existente, e só até o EOL dela.
3. Linha fora da janela é dívida bloqueante: o sistema abre a migração no ciclo em que a
   linha sai da janela e conclui antes do EOL.
4. Versão sempre fixada: `package.json` com versão **exata** (sem `^` nem `~`),
   `package-lock.json` commitado, `.nvmrc` com a versão principal em dígitos (`24`) e `engines`.
   Proibido `latest`, `*` ou faixa. A versão exata não é opcional porque **nenhuma esteira usa o
   lockfile**: o `Jenkinsfile-Build-httpd` roda `npm install --save --save-exact` (ignora o lock e
   reescreve o `package.json`), e o `Jenkinsfile-Build-nodejs` apaga o `package-lock.json` antes do
   build da imagem (`architecture-principles.md` §10). Só o `package.json` exato mantém a árvore
   direta igual entre o CI do repositório e a imagem.
5. Instalação reprodutível com **`npm ci`** no CI do repositório e na máquina do desenvolvedor
   (`npm install` só para incluir ou atualizar dependência). Pedido à plataforma: `npm ci` nas
   esteiras.
6. Ferramenta de build/teste/lint segue a linha mais recente **compatível por
   `peerDependencies`** com o framework fixado. Incompatibilidade de peer é motivo
   válido para ficar na major anterior — registrado na `stack.md` da coleção.

## 2. Matriz vigente

> Fonte: endoflife.date e registro npm, conferidos em **2026-10-02**. Revisar a cada
> gatilho da seção 3.

| Item | Recomendada | Aceita | EOL da aceita | Observação |
|---|---|---|---|---|
| Node.js | 24.x (LTS ativa) | 22.x (LTS manutenção) | 2027-04-30 | Node 26 entra em LTS em 2026-10-28 |
| Angular | 22.x | 21.x (LTS) | 2027-06-30 | Angular 20 sai de suporte em 2026-11-28 |
| React | 19.x | 18.3.x | sem data publicada — React 18 não recebe mais features | 18.x só em app existente em migração |
| TypeScript | 6.0.x | 5.9.x (só com Angular 21) | segue o framework | Teto atual do ecossistema: Angular 22 e typescript-eslint 8 exigem `< 6.1` |

TypeScript não tem LTS: a versão é a mais recente aceita pelo framework e pelo
`typescript-eslint`. TypeScript 7 (compilador nativo) **não** é adotado enquanto Angular e
`typescript-eslint` não o aceitarem em `peerDependencies`.

## 3. Gatilhos de revisão

| Data / evento | Efeito na matriz |
|---|---|
| 2026-10-28 — Node 26 LTS | Recomendada passa a 26.x; aceita passa a 24.x; 22.x sai da janela |
| 2026-11-28 — EOL Angular 20 | Nenhum app em Angular ≤ 20 em produção |
| Lançamento do Angular 23 (ciclo semestral, ~nov/2026) | Recomendada passa a 23.x; aceita passa a 22.x; 21.x sai da janela |
| Lançamento do React 20 | Recomendada passa a 20.x; aceita passa a 19.x; 18.x sai da janela |
| Angular e `typescript-eslint` aceitarem TS 7 | Reavaliar a linha de TypeScript |

Quem altera a matriz atualiza também a tabela "Runtime e linguagem" de cada
`frontend/<stack>/stack.md`.

## 4. Procedimento de upgrade

1. Uma major por vez — nunca pular linha (Angular 20 → 22 passa por 21).
2. Angular: `ng update @angular/core@<major> @angular/cli@<major>` seguido das schematics de
   migração; conferir o guia em `angular.dev/update-guide`.
3. React: codemods oficiais (`npx codemod react/<major>/...`) + atualização de
   `@types/react`; libs do ecossistema (router, query, testing-library) antes do React.
4. Node: atualizar `.nvmrc`, `engines`, a imagem base do container (e a imagem de build, se for
   outra) e o runner do pipeline no mesmo PR. `.nvmrc` e a imagem indicam a **mesma versão
   principal**; `engines` pode ser faixa, desde que contenha essa versão. A esteira confere a
   coerência dos três (§2.1 de [`operations-and-readiness.md`](../../_shared/operations-and-readiness.md))
   e falha se divergirem.
5. Gate de pronto: build, lint, suíte completa e e2e verdes; `npm audit` sem Critical/High.

## Checklist

- [ ] Runtime e framework dentro da janela da seção 2; app nova na linha recomendada
- [ ] Versões exatas no `package.json` (sem `^`/`~`); `npm ci` no CI e local; `package-lock.json` commitado; `.nvmrc`, `engines` e imagem (base e de build) com a mesma versão principal, conferido pela esteira
- [ ] Ferramenta mantida em major anterior tem o motivo (peer) registrado na `stack.md`
- [ ] Linha que sai da janela tem migração aberta antes do EOL
- [ ] Upgrade feito uma major por vez, com schematics/codemods oficiais
