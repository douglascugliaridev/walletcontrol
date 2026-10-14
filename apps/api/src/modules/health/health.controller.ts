import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import type { Response } from 'express';
import { Public } from '../../common/auth/decorators/public.decorator';
import { HealthService } from './health.service';

/** Contrato do `/health`: limpo, sem detalhe de driver e sem stack trace. */
export interface HealthStatus {
  status: 'ok' | 'degraded';
  database: 'up' | 'down';
}

/**
 * Rota pública de infraestrutura — é o único ponto que faz `SELECT 1` real,
 * então precisa responder justamente quando o restante da API está exigindo
 * token. O `@Public()` abre a exceção no guard global de autenticação.
 */
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Public()
  @Get()
  async check(@Res({ passthrough: true }) response: Response): Promise<HealthStatus> {
    const databaseUp = await this.healthService.isDatabaseReachable();

    // `passthrough: true` é obrigatório: sem ele o Nest assume que a
    // resposta foi assumida por aqui e não escreve o body — além do status
    // default de `@Get()` ser 200, o 503 seria perdido de qualquer forma.
    response.status(
      databaseUp ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE,
    );

    return {
      status: databaseUp ? 'ok' : 'degraded',
      database: databaseUp ? 'up' : 'down',
    };
  }
}