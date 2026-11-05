# Tokens no Tailwind 4 (React e Angular)

> Como os valores de [`design-tokens.json`](design-tokens.json) viram classes no Tailwind 4,
> que é configurado em CSS (`@theme`) e não em `tailwind.config.ts`. Vale para as coleções em
> Tailwind 4 (`frontend/react`, `frontend/angular`); o Next.js está em Tailwind 3.4 e usa
> `tailwind.config.ts`. Papéis dos tokens: [`design-system-common.md`](design-system-common.md).

## Onde cada token entra

| Token | Onde | Resultado |
|---|---|---|
| Cor semântica | `:root` e `.dark` (valores) + `@theme inline` (`--color-primary: var(--primary)`) | `bg-primary`, `ring-ring` |
| Tamanho de fonte | `@theme inline`: `--text-sm` **e** `--text-sm--line-height` | `text-sm` com altura de linha própria |
| Fonte | `@theme inline`: `--font-sans` | `font-sans` |
| Raio | `@theme inline`: `--radius-sm`…`--radius-xl` | `rounded-lg` |
| Espaçamento nomeado | `:root` (`--space-*`) + `@utility` por propriedade — **fora** do `@theme` | `p-4xl`, `gap-3xl` |
| Variante `dark:` | `@custom-variant dark (&:where(.dark, .dark *));` | `dark:` segue a classe `.dark` |

Usar `@theme inline` (e não `@theme`) quando o valor referencia outra variável (`var(--primary)`):
sem `inline`, o tema não acompanha a troca de `.dark`.

## Tamanho de fonte: `--text-*--line-height`

O `fontSize: [tamanho, altura]` do Tailwind 3 não existe. Cada degrau são duas variáveis:

```css
@theme inline {
  --text-sm: 0.875rem;
  --text-sm--line-height: 1.25rem;
  /* … xs, base, lg, xl, 2xl, 3xl, 4xl, conforme design-tokens.json */
}
```

## Espaçamento nomeado: não use `--spacing-*`

A escala nomeada (`sm`, `md`, `lg`, `2xl` a `8xl`) **não** vai em `@theme` como `--spacing-*`.
No Tailwind 4, `max-w`, `w`, `min-w` e `basis` resolvem a variável na ordem `--max-width`,
`--spacing`, `--container`. Com `--spacing-lg` definida, `max-w-lg` deixa de ser o contêiner
`--container-lg` (32rem) e vira 0,75rem; `max-w-3xl` vira 1,5rem e `max-w-5xl` 2,5rem. Os
nomes `sm`, `md`, `lg`, `2xl`…`7xl` colidem com os contêineres (`8xl` não colide). O
defeito só aparece no navegador: conteúdo e diálogos com largura quase zero.

Também **não redefina `--spacing`**: é o multiplicador da escala numérica (`p-4` = 4 ×
`--spacing`, 0,25rem por padrão). O token de base da escala nomeada chama `--space-base`.

Alternativa: a escala vive em `:root` com prefixo `--space-*` (nome sem uso pelo Tailwind) e
cada propriedade usada ganha um `@utility`:

```css
:root {
  --space-base: 1rem;
  --space-lg: calc(var(--space-base) - 4px);
  --space-4xl: calc(var(--space-base) + 16px);
  /* … demais degraus, conforme design-tokens.json */
}

@utility p-4xl { padding: var(--space-4xl); }
@utility px-lg { padding-inline: var(--space-lg); }
@utility gap-lg { gap: var(--space-lg); }
```

- Declarar só o que o sistema usa (`p-*`, `px/py-*`, `m-*`, `gap-*`…); variantes
  (`xl:p-4xl`, `hover:`) funcionam sobre `@utility`.
- Para muitas combinações, gerar o bloco a partir de `design-tokens.json` em vez de mantê-lo
  à mão.
- Classe inexistente não falha o build: `p-4xl` sem `@utility` simplesmente não gera CSS.
- O Sonar acusa `@theme`, `@utility` e `@custom-variant` como at-rule desconhecida (S4662, `MAJOR`):
  falso positivo sistêmico, tratado como em [`sonar-css.md`](sonar-css.md); a diretiva não é trocada
  nem suprimida.

### Teste de regressão

Num teste em navegador real (Playwright ou Storybook test runner; o jsdom não calcula CSS do
Tailwind), renderizar `<div class="max-w-lg p-4xl">` e conferir os valores computados:

```ts
const box = page.locator('[data-testid="medida"]');
await expect(box).toHaveCSS('max-width', '512px'); // 32rem; 12px = escala nomeada quebrada
await expect(box).toHaveCSS('padding-top', '32px'); // p-4xl existe
```

## Checklist

- [ ] Escala nomeada em `:root` (`--space-*`) + `@utility`; nenhum `--spacing-*` no `@theme`; `--spacing` intocada
- [ ] `max-w-lg` computa 32rem e `p-4xl` existe (teste em navegador real)
- [ ] `@custom-variant dark (&:where(.dark, .dark *));` declarado
- [ ] Tamanhos de fonte com `--text-*` e `--text-*--line-height`
- [ ] `@theme inline` para todo token que referencia outra variável
