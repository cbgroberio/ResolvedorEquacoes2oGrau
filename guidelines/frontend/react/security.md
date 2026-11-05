# Segurança — Frontend React (SPA)

> Implementa no cliente o contrato [`../_shared/spa-bff.md`](../_shared/spa-bff.md).
> Identidade e autorização de API: [`_shared/api-security.md`](../../_shared/api-security.md).

## 1. Sessão e autenticação

- A app não é cliente OIDC: nem cliente público com PKCE no navegador, nem como contorno da esteira
  (a SPA é publicada junto com o BFF, [`../_shared/spa-bff.md`](../_shared/spa-bff.md) §2.1).
- A app não tem lib OIDC nem token. A sessão é estado de servidor: vem de `GET /auth/session`
  e vive numa query do React Query (`useSession`, em `lib/session/`) com dados públicos do
  usuário e permissões — nunca no Zustand nem em storage.
- Login e logout são navegação de página inteira para `/auth/login` e `/auth/logout`
  (`window.location.assign`), nunca chamada XHR.
- Login e logout invalidam a query da sessão. O interceptor do axios trata `401`: limpa o
  cache do React Query (inclusive a sessão) e navega para
  `/auth/login?returnUrl=<rota atual>`. `returnUrl` só aceita path relativo da própria app.
- Sessão expirada: o `returnUrl` carrega `?sessao=expirada` e o shell, ao ler o parâmetro após
  o retorno do login, mostra "Sessão expirada, entre novamente". O texto vem do catálogo de
  mensagens da SPA, nunca do servidor (nem do `detail` do Problem Details).
- Rota protegida (loader ou layout) lê `useSession` (ou `ensureQueryData`) para UX. A
  autorização real é do BFF/API.
- As permissões da sessão são os trancodes que a API devolve; menu, guarda de rota e o resto da
  SPA comparam com **constantes iguais aos literais do EPA**, num módulo só de `lib/session/`, com
  teste de literais. A SPA não mantém lista de perfis.
- Query que exige permissão leva `enabled` condicionado a ela (ex.:
  `enabled: temPermissao(sessao, PERMISSAO_X)`), inclusive as globais do shell e dos seletores:
  sem isso o `403` volta em laço ([`../_shared/spa-bff.md`](../_shared/spa-bff.md) §6).

## 2. HTTP

- Instância única em `lib/http`: `baseURL: '/api'`, `withCredentials: true`,
  `xsrfCookieName: 'XSRF-TOKEN'`, `xsrfHeaderName: 'X-XSRF-TOKEN'`.
- Toda URL é relativa à instância; URL absoluta é proibida.
- Path montado com constantes e `params` do axios; nunca concatenar input do usuário.
- Resposta validada com Zod antes de chegar ao componente.

## 3. Conteúdo dinâmico

- JSX já escapa interpolação — usar sempre.
- `dangerouslySetInnerHTML` só com saída de `DOMPurify.sanitize`, encapsulado em um único
  componente `SafeHtml` de `shared/ui`; uso direto em outro lugar é proibido.
- Sem `eval`, `new Function`, `document.write`; URL vinda de dado validada contra
  `javascript:` antes de ir para `href`.
- Link externo: `target="_blank"` sempre com `rel="noopener noreferrer"`.

## 4. CSP e Trusted Types

- Build sem script inline: `index.html` do Vite carrega só módulos com hash.
- CSP e nonce servidos pelo BFF/ingress ([`../_shared/spa-bff.md`](../_shared/spa-bff.md) §5).
- Trusted Types: `DOMPurify` configurado com `RETURN_TRUSTED_TYPE: true` e policy própria
  declarada na CSP.

## 5. Build e bundle

- `build.sourcemap: false` em produção.
- Só variável `VITE_*` chega ao bundle — e nenhuma pode conter segredo. Valor por
  ambiente vem do `config.json`.
- Dependência nova passa pela política de
  [`_shared/vulnerable-and-proprietary-libs.md`](../../_shared/vulnerable-and-proprietary-libs.md);
  `npm audit` no pipeline.

## Checklist

- [ ] Sem lib OIDC, sem token em storage; sessão só via `/auth/session`, como query do React Query (não Zustand)
- [ ] Interceptor 401 → `/auth/login` com `returnUrl` relativo validado e `?sessao=expirada`; aviso do catálogo de mensagens
- [ ] Anti-laço: `401` dentro da janela pós-login (padrão 2 min) e `403` `acesso-nao-aceito` mostram aviso sem navegar para o login ([`../_shared/spa-bff.md`](../_shared/spa-bff.md) §3); `permissoes: []` abre só a tela inicial
- [ ] Permissões comparadas com constantes iguais ao EPA, num módulo só, com teste de literais; query que exige permissão com `enabled` condicionado
- [ ] Axios com `withCredentials` e XSRF configurados; toda URL relativa
- [ ] Resposta HTTP validada com Zod; URL sem concatenação de input
- [ ] `dangerouslySetInnerHTML` só dentro de `SafeHtml` com DOMPurify
- [ ] Sem source map em produção; nenhum segredo em `VITE_*`
- [ ] `npm audit` sem CVE Critical/High pendente
