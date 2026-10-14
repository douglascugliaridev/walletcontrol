/**
 * Stub minimalista para isolar os testes unitários do framework NestJS.
 * Os use cases e hasher usam apenas o decorator `@Injectable()`, que nesta
 * implementação é um pass-through — os testes instanciam as classes direto.
 */
const noopDecorator = (target: unknown) => target;

export const Injectable = () => noopDecorator;
export const InjectableOf = noopDecorator;
export const Module = () => noopDecorator;
export const Global = () => noopDecorator;
export const Controller = () => noopDecorator;
export const ControllerOf = noopDecorator;
export const Get = () => noopDecorator;
export const Post = () => noopDecorator;
export const Put = () => noopDecorator;
export const Patch = () => noopDecorator;
export const Delete = () => noopDecorator;
export const Body = () => noopDecorator;
export const Param = () => noopDecorator;
export const Query = () => noopDecorator;
export const Headers = () => noopDecorator;
export const HttpCode = () => noopDecorator;
export const Res = () => noopDecorator;
export const SetMetadata = () => noopDecorator;
export const Inject = () => noopDecorator;
export const Optional = () => noopDecorator;

/** Logger no-op: os testes verificam chamadas via `jest.spyOn(Logger.prototype, ...)`. */
export class Logger {
  log(_message: unknown): void {
    void _message;
  }
  warn(_message: unknown): void {
    void _message;
  }
  error(_message: unknown): void {
    void _message;
  }
  debug(_message: unknown): void {
    void _message;
  }
  verbose(_message: unknown): void {
    void _message;
  }
}

export const HttpStatus = {
  OK: 200,
  SERVICE_UNAVAILABLE: 503,
} as const;

/** Pipes do Nest são configurados em `main.ts`; o stub só precisa ser construível. */
export class ValidationPipe {
  constructor(_options?: unknown) {
    void _options;
  }
}

/** Exceções do Nest usam `code`/`status`; aqui só o mensaje importa para o assert. */
export class NotFoundException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundException';
  }
}

export class BadRequestException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BadRequestException';
  }
}

export class UnauthorizedException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedException';
  }
}
