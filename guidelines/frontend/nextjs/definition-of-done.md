# Definition of Done — Frontend Next.js

Uma task está **concluída** quando todos os critérios obrigatórios forem atendidos.

## Obrigatórios

### Qualidade estática (gate real do projeto)
- [ ] `npm run lint` sem erro (warnings de `exhaustive-deps` / import order resolvidos, não silenciados)
- [ ] `npm run typecheck` (`tsc --noEmit`) sem erro
- [ ] `npm run prettier` sem diferença
- [ ] `npm run knip` sem código/dependência morta introduzida
- [ ] Sem `any`, sem `@ts-ignore`/`eslint-disable` sem justificativa, sem `console.log`
- [ ] SonarQube: Quality Gate verde — zero issue Blocker/Critical/Major e zero Bug/Vulnerabilidade Minor, cobertura ≥ 75% e duplicação ≤ 3% ([`../../_shared/sonar-quality-gate.md`](../../_shared/sonar-quality-gate.md); regras em [`../_shared/sonar-frontend.md`](../_shared/sonar-frontend.md))

### Testes
- [ ] `npm test` verde
- [ ] Componente/hook/util novo com teste em `__tests__/` colocado
- [ ] Schema Zod novo com teste de aceitação e de rejeição
- [ ] Route handler novo com teste de 2xx, erro de validação e erro de upstream
- [ ] Fluxo crítico alterado com e2e Playwright verde contra o artefato, com `@axe-core/playwright` sem violação e evidência no PR ([`testing.md`](testing.md) §7)
- [ ] Teste da fronteira client/server verde ([`architecture.md`](architecture.md) §4.1)

### Contrato e dados
- [ ] Acesso a backend só via route handler `app/api/*` + `@tanstack/react-query` — nenhum componente falando com o gateway
- [ ] Route handler devolve status semântico + corpo modelado (ver [`_shared/api-standards.md`](../../_shared/api-standards.md)), sem vazar upstream
- [ ] Path/URL via `src/routes/`, sem string solta
- [ ] Estado de servidor no react-query, não duplicado no Redux

### Segurança
- [ ] Sistema novo e toda permissão usada pela aplicação incluída, retirada ou renomeada: EPA e matriz em `docs/iep/` (neste repositório ou citados do repositório da API) atualizados e entregues no formato da tela da IEP, com a tarefa de cadastro manual no plano e executor humano identificado (modelos em `docs/guidelines/_templates/epa.md` e `matriz-permissoes-rotas.md`; [`_shared/identity-rhsso.md`](../../_shared/identity-rhsso.md) §11)
- [ ] Nenhum segredo em `'use client'`; novo `NEXT_PUBLIC_*` revisado e justificado
- [ ] Env lido só em `config/envs.ts`
- [ ] Headers/CSP do `next.config.mjs` intactos; nova origem de script/connect na allowlist justificada
- [ ] Nada sensível em log (token, PEM, PIN block, CPF/CNPJ, payload de login)
- [ ] `health/` responde sem sessão e sem `3xx`; `PORT` e `HOSTNAME` definidos no `configuration/configmap/<app>.yml` ([`_shared/operations-and-readiness.md`](../../_shared/operations-and-readiness.md))
- [ ] Cookie de sessão ≤ 4096 B, com teste de token real ([`_shared/identity-rhsso.md`](../../_shared/identity-rhsso.md) §5)
- [ ] Nenhuma vulnerabilidade com correção disponível pendente: `npm audit` sem `--omit=dev` e relatório do Dependency-Check do último build da esteira (que não bloqueia) sem Critical/High corrigível ([`_shared/vulnerable-and-proprietary-libs.md`](../../_shared/vulnerable-and-proprietary-libs.md) §1)
- [ ] CSP com nonce por resposta, sem `'unsafe-inline'` ([`security.md`](security.md) §5.1)

### Acessibilidade e design
- [ ] Primitivos Radix para interação; `addon-a11y` sem violação nova no Storybook
- [ ] Cores/spacing/tipografia dos tokens do design system ([`design-system.md`](design-system.md) / [`design-tokens.json`](../_shared/design-tokens.json)), sem valores avulsos
- [ ] Story criada/atualizada para componente novo ou alterado

### Esteira
- [ ] Esteira com os passos mínimos de [`_shared/operations-and-readiness.md`](../../_shared/operations-and-readiness.md) §2.1, incluindo varredura de segredos em árvore e histórico e checagem do artefato (sem source map público nem segredo em `NEXT_PUBLIC_*`)
- [ ] Task que muda valor pedido a outra equipe (cliente e URIs exatas no RHBK, audience mappers, host da `Route`, requisito de plataforma, imagem de build): `docs/pedidos/pedidos-cadastro-manual.md` atualizado no mesmo PR, com passo a passo, valor exato, como confirmar, risco se errar e status, sem segredo (modelo em `docs/guidelines/_templates/pedidos-cadastro-manual.md`; [`_shared/operations-and-readiness.md`](../../_shared/operations-and-readiness.md) §4.1)
- [ ] Variável nova no `configuration/configmap/<app>.yml` ou no `configuration/secret/<app>.yml` (só desenvolvimento, chave sem ponto), com hml e prod configurados fora do repositório ([`_shared/operations-and-readiness.md`](../../_shared/operations-and-readiness.md) §2.2)
- [ ] `npm run build` (`next build`) e `npm start` (`next start`) funcionam só com `dependencies` instaladas e servem `/health`, CSS e JS; na primeira implantação (`APP_TYPE=nodejs`), `/health` responde `200` e um login completo conclui com a página carregando CSS e JS
- [ ] Nenhum valor por ambiente em `NEXT_PUBLIC_*`; todas as dependências com versão exata; `jest.config.js` com `jest-junit` e `RUN_UNIT_TESTS=true` pedido à esteira

### UX de erro e carregamento
- [ ] Estados de loading, vazio e erro tratados (skeleton/`react-error-boundary`/diálogo de erro)
- [ ] Ação irreversível com confirmação explícita; operação assíncrona (`202`) acompanhada por consulta periódica só enquanto em andamento, com `Idempotency-Key` por intenção e `409` "já em andamento" tratado

## Recomendados

- [ ] Cobertura dos fluxos críticos (login, PIX, pagamento, transferência)
- [ ] `README`/docs do sistema atualizados se houve nova rota, env ou mudança de execução
- [ ] Server Component por padrão; `'use client'` só nas folhas

## Checklist de code review

- [ ] `'use client'` no ponto certo (folha, não layout)
- [ ] Context value memoizado; sem componente aninhado instável
- [ ] `key` real em listas; sem index como key
- [ ] Erros via `src/errors/*`; `parser.ts` para erro do gateway
- [ ] Formulário com `react-hook-form` + `zodResolver`; schema no lugar certo (`_schemas/` ou `src/schemas/`)
- [ ] Imports ordenados; alias `@/`; sem import morto
- [ ] Sem lógica de negócio pesada em `page.tsx` — extraída para hook/handler/util
- [ ] Mudança em autenticação, sessão ou autorização com duas aprovações ([`_shared/git-workflow.md`](../../_shared/git-workflow.md))
- [ ] Defeito corrigido com o teste que reproduz a falha
