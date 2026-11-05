# SPA com BFF — Contrato de Segurança (transversal)

> Como uma SPA (Angular, React) se autentica e fala com APIs. Agnóstico de framework; a
> implementação no cliente fica em `frontend/<stack>/security.md`. Identidade, validação de
> token e transcode: [`_shared/api-security.md`](../../_shared/api-security.md). Contrato
> HTTP e Problem Details: [`_shared/api-standards.md`](../../_shared/api-standards.md).
> O `frontend/nextjs` cumpre este contrato com route handlers próprios (ver a coleção, quando
> publicada). O BFF pode ser Java (Spring Cloud Gateway) ou Node standalone; o que vale para o
> segundo, por não haver framework que entregue o fluxo pronto, está na seção 7.

## 1. Regra

**O browser nunca vê token OAuth.** Toda SPA é servida atrás de um BFF (Backend for
Frontend) que é o único cliente OIDC da aplicação no RH-SSO. A SPA conhece apenas um cookie
de sessão opaco.

Proibido na SPA:

- Biblioteca OIDC no browser (`keycloak-js`, `angular-auth-oidc-client`, `oidc-client-ts`,
  `@auth0/*`, `msal-browser`).
- Access/refresh/ID token em `localStorage`, `sessionStorage`, IndexedDB, cookie legível
  por JS ou memória.
- Chamada direta do browser ao API Gateway ou a qualquer API de negócio.

## 2. Topologia

```text
browser ──(mesma origem)──► BFF ──(Bearer, token exchange)──► API Gateway ──► APIs
            /             → assets estáticos da SPA
            /api/*        → proxy autenticado
            /auth/*       → login, callback, logout, sessão
            /config.json  → configuração de runtime
```

- SPA e BFF na **mesma origem** — sem CORS, sem cookie de terceiro.
- O BFF é um serviço de backend na mesma origem da SPA e **pode ser**:
  - **Java**: segue a coleção de backend declarada no `guidelines.yaml` do sistema (em
    `backend/java`, Spring Cloud Gateway com `TokenRelay` + Spring Security OAuth2 Client;
    versões na seção "Exceção: BFF de SPA em Java" de `backend/java/stack.md`); ou
  - **Node standalone**: serviço próprio que serve a SPA e cumpre este contrato à mão, com o
    contrato mínimo da seção 7.
- Os dois cumprem as seções 1, 3, 4, 5 e 6 do mesmo jeito; o sistema registra em ADR qual
  adota.

### 2.1 Publicação na esteira

Tipos de aplicação da esteira: `_shared/architecture-principles.md`, "Tipos de aplicação da esteira".

- **MUST:** SPA autenticada é publicada **junto com o BFF**, numa única aplicação que serve os
  estáticos da SPA e as rotas `/api/*`, `/auth/*` e `/config.json` na mesma origem:
  - BFF Node: aplicação **`APP_TYPE=nodejs`** (`Jenkinsfile-Build-nodejs`), que serve o diretório de
    saída da SPA (Vite ou Angular) gerado no mesmo `npm run build`, declarado num único lugar;
  - Next.js: a própria aplicação é o BFF, também `APP_TYPE=nodejs`;
  - BFF Java: aplicação Java da coleção de backend, que serve os estáticos.
- **MUST NOT:** publicar SPA autenticada como `react`, `angular`, `web-pkg` ou `httpd`. Esses tipos
  geram só arquivos estáticos numa imagem Apache httpd, onde o BFF não executa e não há cliente
  OIDC: servem apenas a **site estático sem autenticação** (seção 8).
- **MUST NOT:** cliente OIDC público (login no navegador) como contorno da esteira
  ([`identity-rhsso.md`](../../_shared/identity-rhsso.md) §3). Sistema cujo cadastro na esteira é
  `react`/`angular` e que tem SPA autenticada pede a troca do tipo para `nodejs` no documento de
  pedidos de cadastro manual ([`operations-and-readiness.md`](../../_shared/operations-and-readiness.md)
  §4.1, categoria "Esteira").

## 3. Responsabilidades do BFF

| Responsabilidade | Requisito |
|---|---|
| Login | Authorization Code + PKCE (método **S256**) como **client confidencial** no realm do RH-SSO; cadastro, claims e origem pública em [`identity-rhsso.md`](../../_shared/identity-rhsso.md) |
| Sessão | Tokens guardados no servidor, nunca no cookie. Com mais de uma réplica, armazenamento compartilhado (Redis). **Sessão em memória é exceção registrada**, válida só com **réplica única** e estratégia de implantação `Recreate` (sem sobrepor versões), com condição de saída: `SessionStore` de Redis. A interface do `SessionStore` cobre `get`, `set`, `delete` e também `read` (lê sem registrar atividade), `touch` (registra atividade) e `patch` (mescla sobre a versão mais recente, para a renovação do token não ser sobrescrita por um registro de atividade) |
| Permissões | Vêm da API, **única fonte**: ela lê os trancodes do token que recebe e os devolve em `GET /sessao` (`permissoes[]`); o BFF a consulta com o token transcodificado no login e a cada renovação do token, com timeout próprio. Falha ou timeout da API **não derruba o login**: a sessão segue sem permissões, com aviso, e `/auth/session` tenta de novo. O token de login é fonte **só de identidade** e o BFF não lê papéis dele (seção 6) |
| Cookie | `__Host-` prefixado, `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/`, sem `Domain` |
| Renovação | Refresh token usado só pelo BFF; expiração da sessão alinhada ao SSO session idle do realm; renovação proativa e serializada entre requisições concorrentes e entre réplicas (`identity-rhsso.md` §3) |
| Logout | Encerra a sessão local **e** chama o end-session endpoint do RH-SSO (RP-initiated logout) com `id_token_hint`, voltando para uma `post_logout_redirect_uri` registrada |
| Proxy `/api/*` | Anexa `Authorization: Bearer`; faz transcode quando a audience difere, conforme `_shared/api-security.md` §2 |
| CSRF | Toda requisição mutável (`POST/PUT/PATCH/DELETE`) exige header `X-XSRF-TOKEN` igual ao cookie `XSRF-TOKEN` (double-submit) **e** `Origin` da própria app |
| Erro | Devolve Problem Details; nunca repassa stack, corpo cru ou token do upstream |
| 401 | **Só** sessão do BFF inexistente/expirada → `401` com Problem Details; a SPA navega para `/auth/login` (página inteira) e o retorno do login carrega `?sessao=expirada`, com o aviso "Sessão expirada, entre novamente" mostrado pelo shell a partir do catálogo de mensagens da SPA (nunca texto do servidor). As rotas de saúde ficam fora dessa regra: respondem sem sessão e sem redirecionamento ([`operations-and-readiness.md`](../../_shared/operations-and-readiness.md) §1) |
| Recusa da API | Com sessão válida no BFF, `401` da API ou falha da troca de token **não** vira `401` para a SPA (voltaria ao login, o SSO autenticaria na hora e a API recusaria de novo: laço que já derrubou pod por memória). O BFF renova o token **uma vez** e repete; persistindo, responde `403` de categoria `acesso-nao-aceito` ([`api-standards.md`](../../_shared/api-standards.md) §3) e registra o motivo (seção 7). A SPA mostra o aviso do catálogo e não navega para o login |
| Anti-laço na SPA | Defesa em profundidade: o shell guarda o horário do último login concluído (em memória ou `sessionStorage`, **nunca** token) e trata `401` recebido dentro de uma janela curta depois dele (padrão 2 min, configurável) como "o servidor não aceitou o acesso": aviso, sem nova navegação para `/auth/login`. Fora da janela, o `401` volta a significar sessão expirada |
| Headers | Serve CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `frame-ancestors` (seção 5) |

## 4. Configuração de runtime

- **Build once, deploy many:** o mesmo artefato da SPA roda em todos os ambientes.
- Valores por ambiente vêm de `GET /config.json`, carregado antes do bootstrap da SPA. O BFF o
  serve a partir de **uma variável** do `ConfigMap` (ex.: `SPA_CONFIG_JSON`, texto JSON de um
  objeto; ausente ou vazia vale `{}`), porque o pipeline entrega o `ConfigMap` por `envFrom`: o
  `config.json` não vai como chave-arquivo, volume nem segundo `ConfigMap`
  ([`operations-and-readiness.md`](../../_shared/operations-and-readiness.md) §2.2). Valor inválido
  é configuração inválida e é detectado na subida.
- `config.json` contém só dado público (flags, IDs de observabilidade, textos). Segredo
  nunca entra no bundle nem no `config.json`.
- Variável de build (`import.meta.env.*`, `environment.ts`) só para o que é igual em todo
  ambiente.

## 5. Cabeçalhos e CSP

Servidos pelo BFF (ou ingress) para o `index.html` e assets:

- `Content-Security-Policy`: `default-src 'self'`; `script-src 'self'` e `style-src 'self'`;
  `object-src 'none'`; `base-uri 'self'`; `form-action 'self'`; `frame-ancestors 'none'`;
  `connect-src 'self'` + origens de observabilidade explicitamente listadas.
- **Nonce só quando houver script ou estilo inline** (`'nonce-<valor>'` novo a cada resposta, em
  `script-src` e/ou `style-src`). Sem inline, `'self'` basta e o nonce não é gerado. Nunca
  `'unsafe-inline'`.
- `require-trusted-types-for 'script'` quando o framework suportar Trusted Types.
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`.
- `X-Content-Type-Options: nosniff`, `Referrer-Policy: same-origin`.
- `index.html` com `Cache-Control: no-store`; assets com hash no nome com cache longo e
  `immutable`.
- Sem source maps públicos em produção.

## 6. Autorização na SPA

Guard de rota, item de menu escondido e botão desabilitado são **UX**, não controle de
acesso. A autorização real acontece na API, que lê as permissões do token
([`_shared/identity-rhsso.md`](../../_shared/identity-rhsso.md) §1 e §10). A SPA obtém as
permissões por `GET /auth/session` (dados públicos do usuário, nunca o token).

As permissões são externas ao sistema (trancodes por tela ou função, cadastrados na IEP): nem a
SPA nem o BFF mantêm lista de perfis. O BFF busca as permissões no endpoint da API (`GET /sessao`)
com o token transcodificado, no login e a cada renovação do token, e as expõe em `/auth/session`;
a SPA usa os mesmos literais do EPA só para menu e guarda de rota. O token vale só como
identidade (`sub`, matrícula, nome); a API continua decidindo a autorização de cada chamada.
O cadastro dessas permissões na IEP é manual: o EPA e a matriz em `docs/iep/` são entregáveis do
sistema ([`identity-rhsso.md`](../../_shared/identity-rhsso.md) §11), e o cadastro do cliente do BFF
no realm (URIs exatas, audience mappers) sai no documento de pedidos de cadastro manual
([`operations-and-readiness.md`](../../_shared/operations-and-readiness.md) §4.1).
Falha da API não derruba o login: a sessão sem permissões carrega um aviso, o shell o mostra pelo
catálogo de mensagens e a próxima chamada a `/auth/session` tenta de novo.

- **Consulta que exige permissão só dispara com a permissão.** Query de tela, de cabeçalho ou de
  seletor que a API negaria fica desligada enquanto a sessão não tem a permissão: sem isso, o
  `403` de uma consulta global volta em laço a cada renderização ou navegação.
- **Usuário sem nenhuma permissão** não é erro: o login conclui, `/auth/session` traz
  `permissoes: []` e a SPA abre só a tela inicial, com o aviso do catálogo de mensagens, sem disparar
  consulta que exige permissão. A API responde `200` em `GET /sessao` e `403` nas rotas protegidas
  ([`identity-rhsso.md`](../../_shared/identity-rhsso.md) §1).
- **Partida a frio.** Logo depois de a API (ou o provedor de identidade) subir, a primeira consulta
  de permissões pode estourar o timeout: a sessão entra sem permissões, com o aviso, e a próxima
  chamada a `/auth/session` acerta. O shell não trata esse caso como "sem acesso" definitivo.

## 7. BFF que não é Spring Cloud Gateway: contrato mínimo

O Spring Cloud Gateway com Spring Security OAuth2 Client entrega boa parte disto pronto. O BFF
Node standalone (ou outro que implemente o fluxo à mão) cumpre, além das seções 1 a 6:

**Login e estado pré-login**

- Authorization Code com PKCE S256, mais `state` e `nonce` gerados por `SecureRandom`
  de fonte criptográfica (`crypto.randomBytes`) a cada login.
- O estado pré-login (PKCE verifier, `state`, `nonce` e o destino de retorno) fica **ou** num
  cookie selado `__Host-oidc` (assinatura HMAC com o segredo de sessão, `HttpOnly`, `Secure`,
  `SameSite=Lax`, vida curta, ≤ 600 s, apagado no callback) **ou** no servidor. `Lax` é
  necessário porque o callback chega por navegação vinda do RH-SSO; o cookie de sessão continua
  `Strict`. O destino de retorno é só caminho relativo da própria aplicação.
- **Sessão nova a cada login** (id novo; nunca reaproveitar o id anterior): previne fixação de
  sessão.

**Validação de token** (sem biblioteca de OIDC, `node:crypto` basta)

- `id_token` (com conferência do `nonce`) e `access_token` validados por JWKS do `jwks_uri` da
  descoberta: algoritmo `RS256` ou `ES256` (nunca `none` nem simétrico), `iss`, `aud`, `exp`,
  `nbf` e `iat`, com tolerância de relógio de **60 s**. O `sub` precisa ser **igual** nos dois.
- Claims obrigatórias: `sub`, `preferred_username`, `name` e `exp`. Ausente alguma, o login é
  recusado com `403` e Problem Details, sem criar sessão (`identity-rhsso.md` §2).

**Rotas e proxy**

- `/auth/*` e `/api/*` desconhecidos respondem `404` (Problem Details) e **nunca caem na SPA**
  (o fallback para `index.html` vale só para rota de navegação da SPA).
- `/api/<recurso>` é reescrito para o prefixo versionado da API (`<base>/v1/<recurso>`, com
  `<base>` sem `/v1` na configuração). O `Location` devolvido pela API volta ao navegador no
  espaço `/api`, sob a origem pública.
- **Transcode** RFC 8693 (`_shared/api-security.md` §2): em produção, a **subida falha** se
  faltarem as variáveis do audience da API e as credenciais (id e segredo) do cliente de
  troca, listando só os **nomes**. Fora de produção (desenvolvimento e teste) podem ser
  opcionais. Sem isso o BFF repassaria o token de login e toda chamada voltaria `401`. A API lê
  as permissões do token trocado, que só traz as client roles do cliente da audiência
  (`identity-rhsso.md` §10): se elas estiverem em outro cliente, a troca pede as duas audiências.
- **Consulta de permissões** (`GET /sessao`): timeout próprio e curto, menor que o do proxy
  `/api/*` (o login não espera o timeout de operação longa), e o comportamento de partida a frio da
  seção 6.
- Erro do upstream: o BFF devolve Problem Details. Se a API já segue o contrato de erro oficial
  ([`api-standards.md`](../../_shared/api-standards.md)), repassa os campos conhecidos; se segue
  outro, traduz por **uma tabela única** para o contrato da SPA. Nunca repassa stack, corpo cru
  nem texto técnico do upstream. **Exceção:** o `401` da API nunca é repassado (seção 3, "Recusa da
  API").
- **Motivo da recusa no log:** falha da troca de token (status e `error` devolvidos pelo RH-SSO) e
  `401`/`403` recebidos da API são registrados em `WARN` com `correlationId`, rota e motivo, sem token
  nem dado pessoal ([`api-security.md`](../../_shared/api-security.md) §1).

**Artefato e execução**

- **Artefato único** que usa só módulos `node:*` (sem dependência de execução):
  `npm run build` gera e `npm start` executa. A validação da configuração acontece na subida,
  não na importação do módulo durante o build.
- Escuta em `0.0.0.0` na **porta explícita** (padrão documentado num único lugar; ver
  [`operations-and-readiness.md`](../../_shared/operations-and-readiness.md) §1).
- `/healthz` (liveness) e `/readyz` (readiness), públicas, sem sessão e sem redirecionamento,
  conforme `operations-and-readiness.md` §1.
**Esteira (`APP_TYPE=nodejs`)**

O BFF e a SPA que ele serve são uma aplicação `nodejs` (§2.1): `Jenkinsfile-Build-nodejs` +
`openshiftBuildImage` (`case "nodejs"`), build S2I binário do diretório `src/` na imagem
`nodejs:<versão>` ([`architecture-principles.md`](../../_shared/architecture-principles.md) §10).

- **Build dentro da imagem** *(a confirmar no primeiro deploy de teste)*: o S2I instala as
  dependências, roda `npm run build`, remove as `devDependencies` (`npm prune`) e sobe com
  `npm start`. Daí:
  - `build` gera tudo (a SPA e o BFF) e `start` sobe só o servidor;
  - o que o `start` usa em execução fica em `dependencies`; o que só o build usa (Vite, Angular CLI,
    TypeScript, Tailwind e as libs da SPA, que vão no bundle) fica em `devDependencies`. O BFF de
    módulos `node:*` termina com `dependencies` vazio.
- **Sem lockfile na imagem:** o Exportar remove `node_modules` e `package-lock.json` antes de
  empacotar, e o S2I reinstala a partir do `package.json`. **Toda** dependência leva versão exata
  (sem `^`/`~`). O `npm-shrinkwrap.json`, que o Exportar não apaga e o `npm install` respeita, é
  opção a validar com a plataforma, não padrão.
- **Configuração não existe no build:** o build do S2I recebe só as variáveis de npm do BuildConfig,
  sem o `ConfigMap`. Nada que muda por ambiente entra no bundle (§4).
- **`.nvmrc`** com a versão principal em dígitos (`24`): a esteira lê só os dois primeiros
  caracteres, e `v24` cai na imagem de Node 18 sem erro.
- **Testes:** o estágio "Run Unit Tests" só roda com **`RUN_UNIT_TESTS=true`** no cadastro (pedido à
  esteira no documento de pedidos de cadastro manual); sem isso, a esteira segue sem testes. Com ele,
  falha se faltar o arquivo com o nome literal **`jest.config.js`** (não `.ts` nem `.mjs`) contendo
  `jest-junit`, o script exatamente `"test:coverage": "jest --coverage"`, `reports/junit.xml` ou
  `coverage/lcov.info`.
- **Lint e typecheck** não rodam nessa esteira: o repositório os executa em CI próprio ou hook
  obrigatório, com evidência no PR (`architecture-principles.md` §10).
- **Chamada à API:** pelo **Service interno** quando a API está no mesmo cluster; pela Route, a CA do
  roteador interno é pedida à plataforma e entra em `NODE_EXTRA_CA_CERTS` **em execução** (não só no
  build). Proibido `NODE_TLS_REJECT_UNAUTHORIZED=0`.

## 8. Site estático sem autenticação (tipos httpd)

Os tipos `react`, `angular`, `web-pkg` e `httpd` publicam só arquivos estáticos numa imagem Apache
httpd (S2I `httpd-24-ubi9`). Servem a site **sem login e sem chamada a API protegida**; se precisar de
qualquer um dos dois, a aplicação volta à §2.1.

- **Configuração do Apache versionada** em `httpd-cfg/*.conf` (o S2I a inclui; a esteira só
  acrescenta um `custom.conf` mínimo): `FallbackResource /index.html` para as rotas de navegação; os
  cabeçalhos da §5; `index.html` com `no-store` e assets com hash com cache longo e `immutable`; sem
  source map público.
- **Pastas montadas no docroot:** o `ConfigMap` e o `Secret` chegam como arquivos em
  `/opt/app-root/src/config/` e `/opt/app-root/src/secret/`, dentro do que o Apache serve. MUST
  negar acesso HTTP às duas (`Require all denied`) e testar que respondem `403`.
- **`config.json`:** sem processo da aplicação, é gerado por script em `httpd-pre-init/*.sh` a partir
  dos arquivos montados, antes de o Apache subir; configuração inválida faz o script falhar e o pod
  não sobe (falha rápida).
- **Sondas:** as do template (`GET /`); a verificação de configuração é a do `httpd-pre-init`
  (exceção de [`operations-and-readiness.md`](../../_shared/operations-and-readiness.md) §1).
- `*.conf` e `*.sh` com fim de linha LF ([`git-workflow.md`](../../_shared/git-workflow.md)).
- **Memória:** o template httpd limita o pod a 64 Mi, e o Apache com ModSecurity usa ~45 Mi em
  repouso (morto por `OOMKilled` sob rajada, medido em 2026-10). O limite maior é pedido à plataforma
  no documento de pedidos de cadastro manual, com valor dimensionado por teste de carga.

## Checklist

- [ ] Nenhuma lib OIDC nem token no browser; nenhum storage com credencial
- [ ] SPA e BFF na mesma origem; browser não fala com o gateway
- [ ] SPA autenticada publicada junto com o BFF como aplicação `nodejs` (ou Java); nunca como `react`/`angular`/`web-pkg`/`httpd`; sem cliente OIDC público
- [ ] Cookie `__Host-`, `HttpOnly`, `Secure`, `SameSite=Strict`
- [ ] Sessão em memória só como exceção registrada: réplica única, `Recreate` e condição de saída (`SessionStore` de Redis); com mais de uma réplica, armazenamento compartilhado
- [ ] Permissões vindas só da API (`GET /sessao`): consultadas no login e a cada renovação, com timeout próprio; falha ou partida a frio não derruba o login (sessão sem permissões, com aviso, nova tentativa em `/auth/session`); token só como identidade; nenhuma lista de perfis no BFF ou na SPA
- [ ] Consulta que exige permissão só dispara quando a sessão a tem (sem `403` em laço)
- [ ] EPA e matriz em `docs/iep/` e pedido do cliente do BFF no documento de pedidos de cadastro manual, entregues a quem cadastra à mão em sistema novo e a cada mudança de permissão, URI ou audience
- [ ] CSRF double-submit + checagem de `Origin` em toda mutação
- [ ] Logout encerra sessão local e no RH-SSO
- [ ] `401` (só sessão do BFF expirada) → navegação para `/auth/login` com retorno `?sessao=expirada` e aviso do catálogo de mensagens; erro em Problem Details
- [ ] Sem laço de login: `401` da API ou falha da troca com sessão válida → uma renovação e, persistindo, `403` `acesso-nao-aceito`; SPA ignora `401` na janela pós-login; teste e2e com a API recusando o token; motivo da recusa no log do BFF
- [ ] Usuário sem nenhuma permissão: login conclui, `/auth/session` com `permissoes: []`, só a tela inicial com aviso, nenhuma consulta que exige permissão
- [ ] `config.json` só com dado público, servido pelo BFF a partir de variável do `ConfigMap` (padrão `{}`), sem chave-arquivo nem volume; mesmo artefato em todos os ambientes
- [ ] CSP sem `unsafe-inline`: `script-src 'self'` e `style-src 'self'` quando não há inline, nonce só quando há; HSTS e demais headers servidos pelo BFF/ingress
- [ ] Guard/menu tratados como UX; autorização validada no BFF/API
- [ ] BFF Node (ou à mão): `state` e `nonce`; estado pré-login selado (`__Host-oidc`, HMAC, `Lax`, ≤ 600 s) ou no servidor; sessão nova a cada login
- [ ] BFF Node: `id_token` (com `nonce`) e `access_token` validados por JWKS (RS256/ES256, `iss`, `aud`, `exp`, `nbf`, `iat`, tolerância 60 s), `sub` igual nos dois; claim obrigatória ausente → `403`
- [ ] BFF Node: `/auth/*` e `/api/*` desconhecidos → `404`, nunca a SPA; `/api/<recurso>` → `<base>/v1/<recurso>` com `Location` devolvido em `/api`
- [ ] BFF Node: transcode com variáveis obrigatórias na subida em produção (falha só com nomes); erro do upstream traduzido ou repassado pelo contrato oficial, sem stack nem corpo cru
- [ ] BFF Node: artefato único só com módulos `node:*` (`npm run build` / `npm start`), escuta `0.0.0.0` na porta explícita, `/healthz` e `/readyz` públicas
- [ ] Esteira `nodejs`: `build` gera SPA e BFF, `start` sobe o servidor; execução só com `dependencies`; versões exatas; `.nvmrc` em dígitos; `RUN_UNIT_TESTS=true` pedido, `jest.config.js` com `jest-junit`; lint e typecheck no repositório; API pelo Service ou CA em `NODE_EXTRA_CA_CERTS` em execução
- [ ] Site estático (httpd): sem login nem API protegida; `httpd-cfg/*.conf` versionado; pastas montadas negadas (`403`); `config.json` pelo `httpd-pre-init`
