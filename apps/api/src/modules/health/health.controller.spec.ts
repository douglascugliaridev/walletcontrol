import type { Response } from 'express';
import { HealthController } from './health.controller';
import type { HealthService } from './health.service';

function makeResponse() {
  return { status: jest.fn().mockReturnThis() } as unknown as Response & {
    status: jest.Mock;
  };
}

function makeController(databaseUp: boolean) {
  const healthService = {
    isDatabaseReachable: jest.fn().mockResolvedValue(databaseUp),
  };
  return {
    controller: new HealthController(healthService as unknown as HealthService),
    healthService,
  };
}

describe('HealthController.check', () => {
  it('devolve 200 e database up quando o banco responde', async () => {
    const { controller } = makeController(true);
    const response = makeResponse();

    const body = await controller.check(response);

    expect(response.status).toHaveBeenCalledWith(200);
    expect(body).toEqual({ status: 'ok', database: 'up' });
  });

  it('devolve 503 e database down quando o banco cai', async () => {
    const { controller } = makeController(false);
    const response = makeResponse();

    const body = await controller.check(response);

    expect(response.status).toHaveBeenCalledWith(503);
    expect(body).toEqual({ status: 'degraded', database: 'down' });
  });

  it('consulta o service exatamente uma vez por request', async () => {
    const { controller, healthService } = makeController(true);

    await controller.check(makeResponse());

    expect(healthService.isDatabaseReachable).toHaveBeenCalledTimes(1);
  });
});