import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

/**
 * Módulo de infraestrutura. Não importa `PrismaModule` porque ele já é
 * `@Global()` e exporta o `PrismaService` para toda a aplicação.
 */
@Module({
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}