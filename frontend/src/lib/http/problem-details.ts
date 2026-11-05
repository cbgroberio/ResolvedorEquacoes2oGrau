export type FieldValidationError = {
  readonly field: string;
  readonly message: string;
  readonly code?: string | undefined;
};

export type ProblemDetails = {
  readonly type: string;
  readonly title: string;
  readonly status: number;
  readonly detail: string;
  readonly traceId: string;
  readonly codigoRegra?: string | undefined;
  readonly dadosApoio?: Readonly<Record<string, unknown>> | undefined;
  readonly errors?: readonly FieldValidationError[] | undefined;
};

const RULE_MESSAGE_CATALOG: Readonly<Record<string, string>> = {
  EMPTY_EQUATION: 'Por favor, digite uma equação do 2º grau válida.',
  NOT_QUADRATIC_EQUATION:
    "O coeficiente 'a' é igual a zero (a = 0). Informe uma equação do 2º grau com termo x².",
  UNSUPPORTED_DEGREE:
    'A equação possui potência de x diferente de 1 ou 2. Apenas equações do 2º grau são suportadas.',
  INVALID_SYNTAX:
    'Não foi possível interpretar a equação digitada. Use o formato ax² + bx + c = 0.',
  INVALID_NUMBER:
    'Coeficiente numérico inválido encontrado na equação. Use números inteiros ou decimais.',
};

const CATEGORY_MESSAGE_CATALOG: Readonly<Record<string, string>> = {
  'urn:equacoes:erro:validacao':
    'Não foi possível validar a equação informada. Verifique a expressão digitada.',
  'urn:equacoes:erro:regra-negocio':
    'A equação informada não atende às regras de uma equação do 2º grau.',
  'urn:equacoes:erro:indisponivel':
    'Não foi possível comunicar com o servidor de cálculo no momento.',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readStringField(
  source: Record<string, unknown>,
  key: string,
  fallback: string,
): string {
  const val = source[key];
  if (typeof val === 'string' && val.trim().length > 0) {
    return val;
  }
  return fallback;
}

function readOptionalString(
  source: Record<string, unknown>,
  key: string,
): string | undefined {
  const val = source[key];
  if (typeof val === 'string' && val.trim().length > 0) {
    return val;
  }
  return undefined;
}

export function toProblemDetails(
  payload: unknown,
  status = 400,
): ProblemDetails {
  if (!isRecord(payload)) {
    return {
      type: 'urn:equacoes:erro:indisponivel',
      title: 'Erro de comunicação',
      status,
      detail: 'Não foi possível comunicar com o servidor de cálculo.',
      traceId: 'local-fallback',
    };
  }

  const rawDetail = readStringField(
    payload,
    'detail',
    readStringField(payload, 'message', 'Equação inválida.'),
  );
  const rawCode = readOptionalString(payload, 'codigoRegra') ?? readOptionalString(payload, 'code');
  const rawDetails = readOptionalString(payload, 'details');

  let dadosApoio: Readonly<Record<string, unknown>> | undefined;
  if (isRecord(payload['dadosApoio'])) {
    dadosApoio = payload['dadosApoio'];
  } else if (rawDetails) {
    dadosApoio = { details: rawDetails };
  }

  let finalStatus = status;
  if (typeof payload['status'] === 'number') {
    finalStatus = payload['status'];
  }

  return {
    type: readStringField(payload, 'type', 'urn:equacoes:erro:validacao'),
    title: readStringField(payload, 'title', 'Erro ao processar equação'),
    status: finalStatus,
    detail: rawDetail,
    traceId: readStringField(payload, 'traceId', 'trace-equacoes'),
    codigoRegra: rawCode,
    dadosApoio,
  };
}

export function resolveProblemMessage(problem: ProblemDetails): {
  readonly message: string;
  readonly details: string;
} {
  let message = problem.detail;

  if (problem.codigoRegra && RULE_MESSAGE_CATALOG[problem.codigoRegra]) {
    const catalogMsg = RULE_MESSAGE_CATALOG[problem.codigoRegra];
    if (catalogMsg) {
      message = catalogMsg;
    }
  } else if (CATEGORY_MESSAGE_CATALOG[problem.type]) {
    const categoryMsg = CATEGORY_MESSAGE_CATALOG[problem.type];
    if (categoryMsg && !problem.detail) {
      message = categoryMsg;
    }
  }

  let details = '';
  const hint = problem.dadosApoio?.['details'];
  if (typeof hint === 'string') {
    details = hint;
  }

  return { message, details };
}
