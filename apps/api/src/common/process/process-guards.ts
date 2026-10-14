import { Logger } from '@nestjs/common';

const logger = new Logger('Process');

/**
 * Erros que escapam de qualquer `try/catch` — não são exceções Nest, são
 * falhas do runtime.
 *
 * Sem estes handlers, o Node mata o processo: desde o Node 15 o padrão de
 * `unhandledRejection` é `throw`, não `warn`. Uma promise esquecida em
 * qualquer lugar da API derrubaria o servidor inteiro, sem rastro além do
 * stderr cru. Logar e seguir é preferível a uma instância morta sem
 * diagnóstico — e é o comportamento esperado em serverless, onde o
 * orquestrador já reinicia a função se ela realmente falhar.
 *
 * Relevante para o `HealthService`: o `Promise.race` do timeout de 3s NÃO
 * cancela o `SELECT 1`, que pode rejeitar depois — fora de qualquer `await`
 * alcançável pelo `try/catch` de `isDatabaseReachable`.
 */
export function registerProcessGuards(): void {
  process.on('unhandledRejection', (reason) => {
    logger.error(
      `Promise rejeitada sem tratamento: ${
        reason instanceof Error ? (reason.stack ?? reason.message) : String(reason)
      }`,
    );
  });

  process.on('uncaughtException', (error) => {
    logger.error(`Exceção não capturada: ${error.stack ?? error.message}`);
  });
}