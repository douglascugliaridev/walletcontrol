import { Logger } from '@nestjs/common';
import { HealthService } from './health.service';

function makeService(queryRaw: jest.Mock) {
  return new HealthService({ $queryRaw: queryRaw } as never);
}

describe('HealthService.isDatabaseReachable', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('devolve true quando o SELECT 1 responde', async () => {
    const service = makeService(jest.fn().mockResolvedValue([{ '1': 1 }]));

    await expect(service.isDatabaseReachable()).resolves.toBe(true);
  });

  it('devolve false quando a query falha, sem relançar o erro', async () => {
    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    const service = makeService(
      jest.fn().mockRejectedValue(new Error("Can't reach database server at localhost:5433")),
    );

    await expect(service.isDatabaseReachable()).resolves.toBe(false);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('localhost:5433'));
  });

  it('devolve false quando a query estoura o timeout de 3s', async () => {
    jest.useFakeTimers();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    // Query que nunca resolve: simula banco travado segurando a conexão.
    const never = new Promise<never>(() => undefined);
    const service = makeService(jest.fn().mockReturnValue(never));

    const pending = service.isDatabaseReachable();
    await jest.advanceTimersByTimeAsync(3000);

    await expect(pending).resolves.toBe(false);
  });

  it('não deixa timer aberto quando a query responde antes do timeout', async () => {
    jest.useFakeTimers();
    const service = makeService(jest.fn().mockResolvedValue([{ '1': 1 }]));

    await expect(service.isDatabaseReachable()).resolves.toBe(true);
    // `clearTimeout` no `.finally` evita open handle no Jest e event loop
    // vivo em serverless.
    expect(jest.getTimerCount()).toBe(0);
  });

  it('traduz erro não-Error para string no log', async () => {
    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    const service = makeService(jest.fn().mockRejectedValue('P2024 pool esgotado'));

    await expect(service.isDatabaseReachable()).resolves.toBe(false);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('P2024 pool esgotado'));
  });
});