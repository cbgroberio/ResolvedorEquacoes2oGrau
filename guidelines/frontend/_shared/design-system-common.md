# Design System — Comum às stacks de frontend (Banestes)

> Materializa [`design-principles.md`](design-principles.md). Vale para toda coleção de
> frontend com UI (`nextjs`, `react`, `angular`): mesma linguagem visual, mesmos tokens, mesma
> API de primitivos. O que depende de framework — como o token vira classe, de onde vem a
> fonte, como o primitivo é montado — fica em `frontend/<stack>/design-system.md`.
> **Valores:** [`design-tokens.json`](design-tokens.json) (fonte única; este documento descreve
> os papéis, o JSON traz os números).
> Extraído por engenharia reversa de `transacional-ibanking-web` em 2026-09-01; regenerar
> quando o theme do repo do design system mudar.

## Mecânica de composição

- Comportamento vem de primitivo headless (Radix no React e no Next.js, CDK no Angular).
  Aparência vem de classes utilitárias Tailwind organizadas com `class-variance-authority`
  (CVA). Mesclagem: `cn()` = `clsx` + `tailwind-merge`.
- Toda API pública aceita classe componível (`className` no React, `class` no Angular);
  subpartes aceitam `containerClass`/`inputClass`/`contentClass`.
- Nomes de componentes, variantes e tamanhos são **iguais** entre stacks. Divergência de API
  entre coleções é defeito.
- Componente novo = primitivo headless + CVA + `cn()` + classe componível.

## Tokens

### Cor semântica (CSS custom properties, `:root` e `.dark`)

Papéis: `background`/`foreground`, `primary` (+`hover`/`active`/`foreground`), `secondary`
(+`hover`/`active`/`foreground`/`border`), `ghost-foreground` (+`hover`/`active`),
`destructive` (+`hover`/`active`/`foreground`/`border`), `ring`/`ring-destructive`.
Ação primária = `#004b8d` (azul institucional). Todos com par claro/escuro.
Consumir como `bg-primary`, `text-secondary-foreground`, `ring-ring` — **nunca hex cru**.

**Pendente de design:** tokens semânticos `success`, `warning`, `info` e `muted` (texto
secundário) ainda não existem. Até o design defini-los, `Alert`/`Badge` e o texto secundário
usam combinações dos tokens acima.

### Cor de marca (rampas — insumo, não uso direto)

`brand.blueDark` (base `500 = #004B8D`), `brand.ocean` (base `500 = #007CC3`),
`grayDark` (`50 = #F5F5F6` … `950 = #0C111D`, base do tema dark). 11 tons cada.

### Tipografia

Inter Variable, família `Inter`, fallback `ui-sans-serif, system-ui, sans-serif`, classe
`font-sans`. `html { font-size: 16px }`. O arquivo da fonte e o `@font-face` (ou o
equivalente do framework) são da coleção.
Pesos restritos: `font-regular` 400 · `font-medium` 500 · `font-semibold` 600.
Escala fechada (8 degraus, px / line-height): `xs` 12/18 · `sm` 14/20 · `base` 16/24 ·
`lg` 18/28 · `xl` 20/30 · `2xl` 24/32 · `3xl` 30/38 · `4xl` 36/44.

### Espaçamento, raio, elevação

- Espaçamento: escala default do Tailwind (`p-4`, `gap-5`…) mais a escala nomeada, com base
  `--space-base` = 16px: `sm` 6 · `md` 8 · `lg` 12 · `2xl` 20 · `3xl` 24 · `4xl` 32 ·
  `5xl` 40 · `6xl` 44 · `7xl` 64 · `8xl` 80 (px). Container de página: `p-4xl`.
  Como expor a escala nomeada ao Tailwind depende da versão: Tailwind 4 **não** aceita
  `--spacing-*` (ver [`tailwind-4-tokens.md`](tailwind-4-tokens.md)). `--spacing` é o
  multiplicador do Tailwind 4 e não é o token de base.
- Raio: base `--radius: 16px`. `sm` 2 · `md` 6 · `lg` 8 · `xl` 12 · `full`; `2xl` 16 é o
  default do Tailwind. Botão = `rounded-lg`; Card/Badge/Alert = `rounded-xl`.
- Elevação: sem tokens custom. Sombra mínima em inputs e alerts, nenhuma no Card, `shadow-xl`
  no popover do DatePicker. Padronizar em tokens se a profundidade crescer.

### Breakpoints e responsividade

Default do Tailwind (`sm` 640 · `md` 768 · `lg` 1024 · `xl` 1280 · `2xl` 1536), sem override.
**Desktop-first:** base para `≥ xl`, `max-xl:`/`max-lg:` adaptam para baixo.
Página padrão: coluna dupla em `xl` (`xl:w-[55%]` / `xl:w-[45%]`), empilhada abaixo.

### Movimento

Keyframes: `accordion-down/up`, `collapsible-down/up` (0.2s ease-out). `transition-colors` em
Button/Input; `duration-200` no chevron do Accordion. Loading: `animate-spin` no spinner do
Button; Lottie (`BanestesLottieAnimation`) para carga em tela/inline. O plugin que fornece
as animações de entrada/saída depende da versão do Tailwind (coleção).

## Dimensões de controle

| Elemento | Valor |
|---|---|
| Botão `md` (default) | altura 44 · pad-x 16 · texto `base` · ícone 24 · icon-only 48 |
| Botão `sm` | altura 36 · pad-x 12 · texto `sm` · ícone 20 · icon-only 36 |
| Input / Select trigger | altura 44 · pad-x 12 · texto `sm` · borda 1px `secondary-border` · raio `md` |
| Navbar fixa | altura 80 (`h-[5rem]`), `border-b`, `z-50` |
| Container de conteúdo | `pt-[5rem]` + `p-4xl` |
| Ícones | 16 / 18 / 20 / 24 |
| Alvo de toque | mín. 36px; ações primárias 44px |

## Iconografia

Principal: Phosphor (`size={n}` ou `size-*`, cor por `text-*`; pacote por framework na coleção).
Regra: ícone sem texto ⇒ botão `iconOnly` + `aria-label` (exigido pelo tipo onde a linguagem
permite; checado em dev onde não).

## Tema claro / escuro

Classe `.dark` na raiz; o tema claro é o default. O Storybook alterna a classe (`light` sem
classe / `dark`). Componente novo funciona nos dois **só com tokens semânticos** — sem hex, sem
`grayDark.*`/`brand.*` direto em superfície/texto.

## Acessibilidade

Alvo **WCAG 2.1 AA**. Garantido: `aria-label` obrigatório em botão icon-only; `aria-disabled`
e `aria-busy` em loading; `role="alert"` no `Alert`; foco visível (`ring-2` com
`ring-offset-2`); labels via `htmlFor`/`id`; teclado via primitivo headless.
A endereçar: promover o `addon-a11y` do Storybook de `todo` para `error`; auditar contraste.

## Primitivos — API comum

Mesma API em toda stack (a mecânica de cada uma está no `design-system.md` da coleção).

`Button` (`variant`: primary/secondary/ghost/destructive · `size`: md/sm · `iconOnly` exige
`aria-label` · `asChild` (React) ou seletor de atributo (Angular) · `isLoading` +
`loadingLabel`), `Input` (`label`, `error`, `errorMessage`, `leftElement`/`rightElement`,
`showPasswordEye`, `containerClass`/`inputClass`), `InputAddon`, `InputOTP`, `Label`, `Select`,
`Checkbox`, `Switch`, `Card`, `Alert` (default/destructive), `Badge`
(default/outline/destructive), `Accordion`, `Collapsible`, `Tabs`, `Dialog`, `Sheet`
(top/right/bottom/left), `Drawer`, `Popover`, `DropdownMenu`, `Command`, `Tooltip`, `Table`,
`Calendar` (locale ptBR), `Toaster`.

### Compostos — domínio bancário

`MaskInput` / `CpfCnpjMaskInput` / `DateInput`, `DatePicker`, `SelectInput`, `Combobox`,
`AsyncSelect` (query + loading/erro/vazio), `Stepper`, `Divider`, `LabelValue` (comprovantes),
`ErrorView` (+ retry), `BackNavigationBtn`, `LinkIconBtn` (cartão-atalho h72), `TooltipIcon`,
`ModuloSegurancaBadge`, `BanestesLogo`, `BanestesLottieAnimation`.

> Componentes locais de rota ficam no sistema, não no design system. Inventário de telas:
> artefato do sistema (`screen-inventory.md`).

## Checklist

- [ ] Superfície/texto só com token semântico (`bg-primary`, `text-*-foreground`) — sem hex, sem `brand.*`/`grayDark.*`
- [ ] Componente novo = primitivo headless + CVA + `cn()` + classe componível
- [ ] Variantes, tamanhos e nomes iguais aos das demais stacks
- [ ] Funciona em claro e escuro; story cobrindo variantes e os 2 temas
- [ ] Ícone sem texto ⇒ `iconOnly` + `aria-label`
- [ ] Alturas 44/36, raio `lg` (botão) / `xl` (card), foco `ring-2` + `ring-offset-2`
- [ ] Tipografia dentro da escala de 8 degraus e pesos 400/500/600
- [ ] Token novo adicionado como par claro/escuro em `design-tokens.json` e na configuração da stack antes do uso
