# Segurança — Frontend Next.js (BFF)

> Complementa [`_shared/api-security.md`](../../_shared/api-security.md). A app é um BFF:
> os route handlers em `src/app/api/*` são a superfície de exposição.

## 1. Fronteira cliente / servidor

- Segredos (`SECRET_KEY`, `API_USER_KEY`, chaves privadas, `jose`, cripto) **só** em Server
  Component / route handler / `proxy.ts`. Nunca em `'use client'`.
- Único env que chega ao browser: `NEXT_PUBLIC_*`. Revisar cada novo `NEXT_PUBLIC_*` — não
  expor nada que não possa ser público. Ele é gravado no build (que na esteira roda sem o
  `ConfigMap`), então só leva valor **igual em todo ambiente**; valor por ambiente vai do servidor ao
  cliente em execução ([`stack.md`](stack.md), Infra).
- Leitura e validação de env centralizada em `src/config/envs.ts`; falhar no boot se faltar
  variável obrigatória.
- `.env*` fora do git (`.env.example` é o contrato). Segredos reais vêm do `Secret` do OpenShift
  (`configuration/secret/<app>.yml` em desenvolvimento; o do ambiente em homologação e produção),
  nunca do `ConfigMap` nem da imagem.

## 2. Route handlers (BFF)

- Toda chamada ao `API_GATEWAY_URL` passa pelo cliente em `src/lib/axios` — nunca `fetch`
  cru espalhado, nunca o browser falando direto com o gateway.
- Handler valida input com Zod antes de repassar; valida/repassa credencial de sessão;
  molda a resposta (sem vazar campos internos do upstream).
- Erro do upstream é normalizado (`src/errors/parser.ts`) para status semântico + corpo
  modelado (RFC 7807 — ver [`_shared/api-standards.md`](../../_shared/api-standards.md)).
  Nunca repassar stack, mensagem crua ou status opaco do gateway.
- Autenticação ao gateway conforme `_shared/api-security.md` (token da sessão; sem repassar
  cegamente token de terceiro).
- `DEBUG_API_REQUESTS_HABILITADO` só liga log verboso fora de produção; esse log nunca
  contém corpo com dado sensível.

## 3. Sessão

- Dados de sessão criptografados com `SECRET_KEY` (`src/utils/auth`, `src/utils/crypto`).
- JWT lido/validado com `jose` no servidor: assinatura, `exp`, emissor esperado.
- Cookies de sessão: `httpOnly`, `secure`, `sameSite` restritivo. Cada cookie cabe em 4096 bytes
  contando nome, valor e atributos (o navegador descarta o excedente sem erro); teste com token do
  tamanho real ([`identity-rhsso.md`](../../_shared/identity-rhsso.md) §5).
- Logout destrói a sessão local **e** a do RH-SSO (`end_session_endpoint` com `id_token_hint` e
  `post_logout_redirect_uri` registrada), e a página de dado de negócio sai com `Cache-Control: no-store`.
- O redirect do `proxy.ts` para o login e qualquer URL absoluto devolvido ao navegador ou ao RH-SSO
  usam a **origem pública** lida em `config/envs.ts`, nunca a URL interna da requisição
  (`request.url`/`nextUrl`), que no OpenShift traz o endereço de bind
  ([`identity-rhsso.md`](../../_shared/identity-rhsso.md) §4).
- Flags de bypass (`BYPASS_*`) são **apenas** para dev/lab; garantir que resolvem `false` em
  produção e revisar qualquer uso novo. A trava tem **teste** que prove que a identidade simulada não
  liga com a configuração de produção ([`identity-rhsso.md`](../../_shared/identity-rhsso.md) §7).

## 4. Controle de acesso a funcionalidades

- `src/lib/feature-access` decide exibição/uso de feature (pilotos, perfis). A checagem de
  UI **não** é controle de segurança — o route handler e o gateway continuam responsáveis
  pela autorização real.
- `NEXT_PUBLIC_BYPASS_CONTROLE_ACESSO_HABILITADO` só em ambiente controlado. `NEXT_PUBLIC_*` é
  embutido **no build**: o artefato de produção nunca é construído com o bypass ligado.

## 5. Cabeçalhos e CSP

Cabeçalhos fixos em `next.config.mjs` — ao mexer, preservar:

- `X-Frame-Options: SAMEORIGIN` (anti-clickjacking, junto do `frame-ancestors 'none'` da CSP)
- `Strict-Transport-Security` com `preload`
- `X-Content-Type-Options: nosniff`, `Referrer-Policy: same-origin`, `X-XSS-Protection: 0`
- `poweredByHeader: false`; `productionBrowserSourceMaps: false` (anti reverse engineering);
  `devIndicators: false` (o indicador do `next dev` usa estilo inline, que a CSP bloqueia).

### 5.1 CSP com nonce

Mesmo contrato das coleções React e Angular ([`../_shared/spa-bff.md`](../_shared/spa-bff.md) §5):
sem `'unsafe-inline'`, nonce novo a cada resposta. No App Router **sempre há script inline** (o
payload do React Server Components), então toda página leva nonce:

- O `proxy.ts` gera o nonce (aleatório, base64, um por resposta), monta a CSP e a grava **na
  requisição** (`NextResponse.next({ request: { headers } })`, cabeçalho `Content-Security-Policy`)
  **e na resposta**. O Next lê o nonce do cabeçalho da requisição e o aplica aos próprios scripts;
  só na resposta, os scripts saem sem nonce, o navegador os bloqueia e **a página não hidrata**
  (renderiza o HTML, mas nenhum clique funciona) — defeito que não aparece em teste de componente
  nem no `next dev` sem CSP.
- CSP de referência das páginas: `default-src 'self'`; `script-src 'self' 'nonce-<n>'
  'strict-dynamic'`; `style-src 'self' 'nonce-<n>'`; `img-src 'self' data:`; `font-src 'self'`;
  `object-src 'none'`; `base-uri 'self'`; `form-action 'self'`; `frame-ancestors 'none'`;
  `connect-src 'self'`. `'unsafe-eval'` só com `NODE_ENV=development` (o recarregamento do
  `next dev` o usa), nunca no build de produção. Nova origem entra explicitamente e justificada.
- **Toda página passa pelo `proxy.ts`**, inclusive as públicas (ex.: `acesso-negado`): o `matcher`
  exclui só o que não é página (`_next/static`, `_next/image`, `favicon.ico`, `health`, `api/auth`).
- Página com nonce é **renderizada a cada requisição**: o layout raiz chama `await connection()`
  (ou lê `headers()`). Página pré-renderizada no build não recebe o nonce da requisição e não
  hidrata.
- Rotas sem página (route handlers, `health`) recebem, pelo `next.config.mjs`, uma CSP fixa sem
  script: `default-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'`.
- Estilo inline injetado por biblioteca (ex.: `<style>` da `sonner`, `style` do anunciador de rota
  do Next) fica bloqueado; carregar o CSS da lib pelo arquivo (`sonner/dist/styles.css`) e nunca
  liberar `'unsafe-inline'` por isso.
- Teste: a função que monta a CSP tem teste unitário (nonce presente, sem `'unsafe-inline'`, sem
  `'unsafe-eval'` fora de dev), e o e2e ([`testing.md`](testing.md) §7) prova que a página hidrata
  com a CSP ligada (uma interação que só funciona com JS).

## 6. Entrada e saída de conteúdo

- HTML dinâmico sanitizado com `dompurify` antes de render; nunca `dangerouslySetInnerHTML`
  sem sanitizar.
- Máscaras (`imask`) não substituem validação — validar sempre com Zod.
- Links externos: `rel="noopener noreferrer"` (ver [`../_shared/sonar-frontend.md`](../_shared/sonar-frontend.md)).
- Nunca montar URL do gateway por concatenação de input do usuário — usar `src/routes/gateway-routes.ts`.

## 7. Dependências

O OWASP Dependency-Check da esteira analisa a árvore inteira, `devDependencies` incluídas, e só
reporta (não bloqueia). Antes do PR: `npm audit` **sem** `--omit=dev` e relatório do último build
sem Critical/High que tenha correção; toda vulnerabilidade com correção disponível é corrigida,
pela dependência direta ou por `overrides` no `package.json`
([`_shared/vulnerable-and-proprietary-libs.md`](../../_shared/vulnerable-and-proprietary-libs.md) §1).
`package-lock.json` commitado.

## Checklist

- [ ] Nenhum segredo fora de Server/handler; todo novo `NEXT_PUBLIC_*` revisado
- [ ] Env só via `config/envs.ts`; secret via `Secret` (`configuration/secret/<app>.yml` em dev), não imagem/`ConfigMap`
- [ ] Gateway só pelos route handlers via `src/lib/axios`; input validado com Zod
- [ ] Erro do upstream normalizado; sem vazar stack/campo interno
- [ ] Sem laço de login: `401` da API ou falha da troca com sessão válida → uma renovação e, persistindo, `403` `acesso-nao-aceito` (nunca redirect ao login); cliente ignora `401` na janela pós-login; motivo da recusa no log ([`../_shared/spa-bff.md`](../_shared/spa-bff.md) §3 e §7)
- [ ] Sessão criptografada; JWT validado com `jose`; cookie `httpOnly`/`secure`/`sameSite`
- [ ] Flags `BYPASS_*` = `false` em produção, com teste da trava; bypass `NEXT_PUBLIC_*` nunca no build de produção
- [ ] Cookie de sessão ≤ 4096 B (teste com token real); logout com `id_token_hint`; `no-store` pós-logout
- [ ] Headers do `next.config.mjs` preservados; nova origem na CSP justificada
- [ ] CSP com nonce por resposta gravada pelo `proxy.ts` na requisição e na resposta; sem `'unsafe-inline'`; `'unsafe-eval'` só em dev; toda página pelo `proxy.ts` e renderizada por requisição; e2e prova a hidratação
- [ ] HTML dinâmico via `dompurify`; sem `dangerouslySetInnerHTML` cru
- [ ] `npm audit` (sem `--omit=dev`) e Dependency-Check sem vulnerabilidade com correção pendente; lockfile commitado
