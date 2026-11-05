# Definition of Done — Frontend React (SPA)

Uma task está **concluída** quando todos os critérios obrigatórios forem atendidos.

## Obrigatórios

### Qualidade estática
- [ ] `npm run lint` sem erro e sem warning novo (inclui hooks, React Compiler, `jsx-a11y` e fronteiras por `no-restricted-imports`)
- [ ] `npm run typecheck` (`tsc --noEmit`) sem erro
- [ ] `npm run build` sem erro; chunk inicial ≤ 500 kB (gzip ≤ 170 kB) — `build.chunkSizeWarningLimit` não é elevado para esconder estouro
- [ ] `npx prettier --check .` sem diferença
- [ ] `npx knip` sem código/dependência morta introduzida
- [ ] Sem `any`, sem `forwardRef` novo, sem `@ts-ignore`/`eslint-disable` sem justificativa, sem `console.*`
- [ ] SonarQube: Quality Gate verde — zero issue Blocker/Critical/Major e zero Bug/Vulnerabilidade Minor, cobertura ≥ 75% e duplicação ≤ 3% ([`../../_shared/sonar-quality-gate.md`](../../_shared/sonar-quality-gate.md); regras em [`../_shared/sonar-frontend.md`](../_shared/sonar-frontend.md))

### Testes
- [ ] `npm test` verde
- [ ] Componente, hook ou função de `api/` novo com teste ao lado
- [ ] Schema Zod novo com teste de aceitação e de rejeição
- [ ] Função de `api/` nova com teste de 2xx, payload inválido e Problem Details (MSW)
- [ ] Fluxo crítico alterado com e2e Playwright verde

### Contrato e dados
- [ ] Backend acessado só por `features/*/api` → `lib/http` → `/api/*` do BFF
- [ ] Erro HTTP tratado como Problem Details ([`_shared/api-standards.md`](../../_shared/api-standards.md))
- [ ] Estado de servidor (inclusive a sessão) no React Query, não no Zustand
- [ ] Paths por constantes, sem string solta

### Segurança
- [ ] Contrato BFF respeitado ([`../_shared/spa-bff.md`](../_shared/spa-bff.md)): nenhum token ou lib OIDC no browser
- [ ] Permissão nova ou renomeada: constante igual ao EPA em `docs/iep/`, com teste de literais; consulta que a exige só dispara com ela
- [ ] Sistema novo e toda permissão usada pela SPA incluída, retirada ou renomeada: EPA e matriz em `docs/iep/` (neste repositório ou citados do repositório da API) atualizados e entregues no formato da tela da IEP, com a tarefa de cadastro manual no plano e executor humano identificado (modelos em `docs/guidelines/_templates/epa.md` e `matriz-permissoes-rotas.md`; [`_shared/identity-rhsso.md`](../../_shared/identity-rhsso.md) §11)
- [ ] `dangerouslySetInnerHTML` só via `SafeHtml`; links externos com `rel="noopener noreferrer"`
- [ ] Nada sensível em log; nenhum segredo em `VITE_*`
- [ ] `npm audit` sem CVE Critical/High pendente ([`_shared/vulnerable-and-proprietary-libs.md`](../../_shared/vulnerable-and-proprietary-libs.md))
- [ ] Versões dentro da janela de [`../_shared/version-policy.md`](../_shared/version-policy.md)

### Documentação no Backstage
- [ ] `catalog-info.yaml`, `mkdocs.yml` e `docs/` existentes e atualizados no mesmo PR de qualquer mudança de configuração, perfil de acesso ou fluxo; sem OpenAPI, pois o front só consome ([`_shared/backstage-docs.md`](../../_shared/backstage-docs.md))

### Acessibilidade e design
- [ ] Alvo de [`../_shared/design-principles.md`](../_shared/design-principles.md) atendido; axe sem violação nova (e addon-a11y, se o sistema mantém Storybook)
- [ ] Só tokens do design system ([`design-system.md`](design-system.md)); sem valor avulso
- [ ] Se o sistema mantém catálogo de componentes (Storybook): story criada/atualizada para componente novo ou alterado, nos dois temas (configuração de referência em [`design-system.md`](design-system.md))

### UX de erro e carregamento
- [ ] Estados de carregando, vazio e erro tratados; `errorElement` na rota
- [ ] Ação irreversível com confirmação explícita; operação assíncrona (`202`) acompanhada por consulta periódica só enquanto em andamento, com `Idempotency-Key` por intenção e `409` "já em andamento" tratado

### Esteira
- [ ] Passos mínimos da esteira de frontend cumpridos, conforme a lista em
      [`_shared/operations-and-readiness.md`](../../_shared/operations-and-readiness.md) §2.1
- [ ] Task que muda valor pedido a outra equipe (cliente do BFF e URIs exatas no RHBK, audience mappers, host da `Route`, requisito de plataforma, imagem de build): `docs/pedidos/pedidos-cadastro-manual.md` atualizado no mesmo PR, com passo a passo, valor exato, como confirmar, risco se errar e status, sem segredo (modelo em `docs/guidelines/_templates/pedidos-cadastro-manual.md`; [`_shared/operations-and-readiness.md`](../../_shared/operations-and-readiness.md) §4.1)
- [ ] Variável nova do BFF no `configuration/configmap/<app>.yml` ou no `configuration/secret/<app>.yml` (só desenvolvimento, chave sem ponto), com hml e prod configurados fora do repositório; chave nova de `config.json` no valor da variável que o BFF serve, nunca como arquivo ou volume ([`_shared/operations-and-readiness.md`](../../_shared/operations-and-readiness.md) §2.2)

## Recomendados

- [ ] Prefetch (`queryClient.prefetchQuery`) nas transições mais frequentes
- [ ] README do sistema atualizado se houve rota, chave de `config.json` ou mudança de execução

## Checklist de code review

- [ ] Nenhum `useEffect` derivando estado ou buscando dado
- [ ] Memoização manual só com motivo comentado
- [ ] Componente de apresentação sem React Query/Zustand; feature sem import de outra feature
- [ ] Query keys pela fábrica da feature; mutation com invalidação explícita
- [ ] Formulário com `react-hook-form` + `zodResolver`; schema no lugar certo
- [ ] `key` real em listas
