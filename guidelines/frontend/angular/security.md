# Segurança — Frontend Angular

> Implementa no cliente o contrato [`../_shared/spa-bff.md`](../_shared/spa-bff.md).
> Identidade e autorização de API: [`_shared/api-security.md`](../../_shared/api-security.md).

## 1. Sessão e autenticação

- A app não é cliente OIDC: nem cliente público com PKCE no navegador, nem como contorno da esteira
  (a SPA é publicada junto com o BFF, [`../_shared/spa-bff.md`](../_shared/spa-bff.md) §2.1).
- A app não tem lib OIDC nem token. A sessão é estado de servidor: vem de `GET /auth/session`
  e vive num `httpResource`/`rxResource` de um serviço de raiz em `core/auth` (dados públicos
  do usuário e permissões) — não num SignalStore global nem em storage.
- Login e logout são navegação de página inteira para `/auth/login` e `/auth/logout`
  (`window.location.assign`), nunca chamada XHR.
- Interceptor funcional trata `401`: descarta a sessão em memória (recurso de `core/auth`) e
  navega para `/auth/login?returnUrl=<rota atual>`. `returnUrl` só aceita path relativo da
  própria app.
- Sessão expirada: o `returnUrl` carrega `?sessao=expirada` e o shell, ao ler o parâmetro após
  o retorno do login, mostra "Sessão expirada, entre novamente". O texto vem do catálogo de
  mensagens da SPA, nunca do servidor.
- Guards funcionais (`CanActivateFn`/`CanMatchFn`) leem o recurso de sessão para UX. A
  autorização real é do BFF/API.
- As permissões da sessão são os trancodes que a API devolve; menu, guards e o resto da SPA
  comparam com **constantes iguais aos literais do EPA**, num arquivo só de `core/auth`, com teste de
  literais. A SPA não mantém lista de perfis.
- Recurso que exige permissão só faz a requisição com ela: a função de requisição do
  `httpResource` devolve `undefined` (sem requisição) enquanto a sessão não tem a permissão,
  inclusive nos recursos globais do shell e dos seletores; sem isso o `403` volta em laço
  ([`../_shared/spa-bff.md`](../_shared/spa-bff.md) §6).

## 2. HTTP

- `provideHttpClient(withFetch(), withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' }), withInterceptors([...]))`.
- Toda URL é relativa (`/api/...`): o Angular só envia o header XSRF para URL relativa —
  URL absoluta quebra a proteção CSRF.
- Path de API montado com constantes e `HttpParams`; nunca concatenar input do usuário na URL.
- Resposta validada com Zod antes de entrar no store.

## 3. Conteúdo dinâmico

- Interpolação e property binding do Angular já sanitizam — usar sempre.
- `[innerHTML]` só com conteúdo que passou pelo sanitizador padrão do Angular.
- `DomSanitizer.bypassSecurityTrust*` proibido sem DR; cada ocorrência aprovada fica listada
  na DR com a origem do conteúdo.
- Sem `ElementRef.nativeElement.innerHTML`, `document.write` ou `eval`/`new Function`.
- Link externo: `target="_blank"` sempre com `rel="noopener noreferrer"`.

## 4. CSP e Trusted Types

- `index.html` gerado com nonce: `autoCsp` habilitado no `angular.json` para builds de
  produção, e `ngCspNonce` preenchido pelo BFF quando a página é servida com nonce dinâmico.
- Trusted Types exigido pela CSP (`require-trusted-types-for 'script'`), com a policy
  `angular` liberada em `trusted-types`.
- Sem script inline nem `style` inline fora do que o build gera com nonce.

## 5. Build e bundle

- `sourceMap: false` e `namedChunks: false` na configuração de produção.
- Nada de segredo em `environment*.ts`, `config.json` ou assets — o bundle é público.
- Dependência nova passa pela política de
  [`_shared/vulnerable-and-proprietary-libs.md`](../../_shared/vulnerable-and-proprietary-libs.md);
  `npm audit` no pipeline.

## Checklist

- [ ] Sem lib OIDC, sem token em storage; sessão só via `/auth/session`, como `httpResource`/`rxResource` em `core/auth` (não SignalStore)
- [ ] Interceptor 401 → `/auth/login` com `returnUrl` relativo validado e `?sessao=expirada`; aviso do catálogo de mensagens
- [ ] Anti-laço: `401` dentro da janela pós-login (padrão 2 min) e `403` `acesso-nao-aceito` mostram aviso sem navegar para o login ([`../_shared/spa-bff.md`](../_shared/spa-bff.md) §3); `permissoes: []` abre só a tela inicial
- [ ] Permissões comparadas com constantes iguais ao EPA, num arquivo só, com teste de literais; recurso que exige permissão sem requisição enquanto ela falta
- [ ] `withXsrfConfiguration` ativo; toda URL de API relativa
- [ ] Resposta HTTP validada com Zod; URL sem concatenação de input
- [ ] Nenhum `bypassSecurityTrust*` sem DR; sem `innerHTML` manual
- [ ] `autoCsp`/nonce e Trusted Types ativos em produção
- [ ] Sem source map em produção; nenhum segredo no bundle
- [ ] `npm audit` sem CVE Critical/High pendente
