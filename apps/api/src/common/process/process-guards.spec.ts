import { Logger } from '@nestjs/common';
import { registerProcessGuards } from './process-guards';

describe('registerProcessGuards', () => {
  let error: jest.SpyInstance;

  beforeEach(() => {
    error = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    registerProcessGuards();
  });

  afterEach(() => {
    process.removeAllListeners('unhandledRejection');
    process.removeAllListeners('uncaughtException');
    jest.restoreAllMocks();
  });

  it('registra handler de unhandledRejection e de uncaughtException', () => {
    expect(process.listenerCount('unhandledRejection')).toBeGreaterThanOrEqual(1);
    expect(process.listenerCount('uncaughtException')).toBeGreaterThanOrEqual(1);
  });

  it('loga e não propaga quando uma promise rejeita sem tratamento', () => {
    expect(() =>
      process.emit(
        'unhandledRejection',
        new Error('SELECT 1 rejeitou após o timeout'),
        Promise.resolve(),
      ),
    ).not.toThrow();
    expect(error).toHaveBeenCalledWith(
      expect.stringContaining('SELECT 1 rejeitou após o timeout'),
    );
  });

  it('cai no message quando o Error não tem stack', () => {
    const semStack = new Error('sem stack');
    semStack.stack = undefined;

    process.emit('unhandledRejection', semStack, Promise.resolve());

    expect(error).toHaveBeenCalledWith(expect.stringContaining('sem stack'));
  });

  it('serializa reason não-Error como string', () => {
    process.emit('unhandledRejection', 'P2024 pool esgotado', Promise.resolve());

    expect(error).toHaveBeenCalledWith(expect.stringContaining('P2024 pool esgotado'));
  });

  it('loga uncaughtException sem derrubar o processo', () => {
    expect(() => process.emit('uncaughtException', new Error('boom'))).not.toThrow();
    expect(error).toHaveBeenCalledWith(expect.stringContaining('boom'));
  });
});