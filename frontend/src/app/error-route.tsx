import { Warning } from '@phosphor-icons/react';

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Card,
  CardContent,
} from '@/shared/ui';

export function ErrorRoute() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center justify-center p-6">
      <Card className="w-full">
        <CardContent className="flex flex-col gap-4 p-6">
          <Alert variant="destructive">
            <div className="flex items-start gap-2">
              <Warning aria-hidden="true" className="mt-0.5 size-5" />
              <div>
                <AlertTitle>Ocorreu um erro inesperado na tela</AlertTitle>
                <AlertDescription>
                  Não foi possível renderizar esta seção. Recarregue a página
                  para tentar novamente.
                </AlertDescription>
              </div>
            </div>
          </Alert>
          <Button
            variant="primary"
            onClick={() => {
              window.location.assign('/');
            }}
          >
            Voltar ao início
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}

