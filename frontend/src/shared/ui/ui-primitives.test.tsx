import { describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
} from '@/shared/ui';
import { expectNoA11yViolations } from '@/test/a11y';

describe('Primitivos do Design System (shared/ui)', () => {
  it('renderiza Button nas variantes, bloqueia clique em loading e suporta asChild', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();

    const { container, rerender } = render(
      <Button variant="primary" size="md" onClick={onClick}>
        Calcular
      </Button>,
    );

    const btn = screen.getByRole('button', { name: 'Calcular' });
    await user.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
    await expectNoA11yViolations(container);

    rerender(
      <Button
        variant="secondary"
        size="sm"
        isLoading
        loadingLabel="Processando"
        onClick={onClick}
      >
        Calcular
      </Button>,
    );

    const loadingBtn = screen.getByRole('button', { name: 'Processando' });
    expect(loadingBtn).toHaveAttribute('aria-busy', 'true');
    expect(loadingBtn).toHaveAttribute('aria-disabled', 'true');
    await user.click(loadingBtn);
    expect(onClick).toHaveBeenCalledTimes(1);

    rerender(
      <Button
        variant="ghost"
        size="sm"
        iconOnly
        isLoading
        aria-label="Ação carregando"
      >
        <span>+</span>
      </Button>,
    );
    expect(
      screen.getByRole('button', { name: 'Ação carregando' }),
    ).toBeInTheDocument();

    rerender(
      <Button asChild variant="destructive" disabled onClick={onClick}>
        <a href="/teste">Link Desabilitado</a>
      </Button>,
    );
    const linkEl = screen.getByRole('link', { name: 'Link Desabilitado' });
    expect(linkEl).toHaveAttribute('aria-disabled', 'true');
    await user.click(linkEl);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renderiza Input com label, elementos laterais, mensagem de erro e alternância de senha', async () => {
    const user = userEvent.setup();
    const onChangeValue = jest.fn();

    const { container, rerender } = render(
      <Input
        label="Equação"
        placeholder="Digite aqui"
        leftElement={<span>f(x)</span>}
        rightElement={<span>= 0</span>}
        errorMessage="Equação obrigatória"
        onChangeValue={onChangeValue}
      />,
    );

    const input = screen.getByLabelText('Equação');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Equação obrigatória')).toBeInTheDocument();
    await user.type(input, 'x^2');
    expect(onChangeValue).toHaveBeenCalledWith('x^2');
    await expectNoA11yViolations(container);

    rerender(
      <Input
        label="Senha"
        type="password"
        showPasswordEye
        defaultValue="segredo"
      />,
    );

    const pwdInput = screen.getByLabelText('Senha');
    expect(pwdInput).toHaveAttribute('type', 'password');

    const toggleBtn = screen.getByRole('button', { name: 'Mostrar senha' });
    await user.click(toggleBtn);
    expect(pwdInput).toHaveAttribute('type', 'text');
    expect(
      screen.getByRole('button', { name: 'Ocultar senha' }),
    ).toBeInTheDocument();
  });

  it('renderiza Card, Alert, Badge e Dialog sem violações de acessibilidade', async () => {
    const user = userEvent.setup();

    const { container } = render(
      <div>
        <Card>
          <CardHeader>
            <CardTitle>Título do Card</CardTitle>
            <CardDescription>Descrição do Card</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="default">Padrão</Badge>
            <Badge variant="outline">Contorno</Badge>
            <Badge variant="destructive">Erro</Badge>
          </CardContent>
          <CardFooter>Rodapé</CardFooter>
        </Card>

        <Alert variant="destructive">
          <AlertTitle>Falha</AlertTitle>
          <AlertDescription>Detalhe da falha</AlertDescription>
        </Alert>

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="secondary">Abrir Modal</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Título do Modal</DialogTitle>
              <DialogDescription>Texto explicativo do modal</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="primary">Confirmar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>,
    );

    expect(screen.getByText('Título do Card')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Falha');
    await expectNoA11yViolations(container);

    await user.click(screen.getByRole('button', { name: 'Abrir Modal' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Título do Modal')).toBeInTheDocument();
  });
});

