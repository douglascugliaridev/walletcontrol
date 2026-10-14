import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

/** Timeout da verificação: abaixo do timeout do load balancer, para o probe não estourar. */
const VERIFICATION_TIMEOUT_MS = 3000;

/**
 * Verificação da dependência de banco.
 *
 * Devolve `boolean` e nunca relança. É isso que mantém detalhe do driver
 * (host, usuário, às vezes a URL) fora do payload HTTP — o erro fica
 * apenas no log do servidor.
 */
@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private readonly prisma: PrismaService) {}

  async isDatabaseReachable(): Promise<boolean> {
    try {
      await this.queryWithTimeout();
      return true;
    } catch (error) {
      this.logger.warn(
        `Banco indisponível: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  private queryWithTimeout(): Promise<unknown> {
    let timer: ReturnType<typeof setTimeout>;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(
        () => reject(new Error('timeout na verificação do banco')),
        VERIFICATION_TIMEOUT_MS,
      );
    });

    // `SELECT 1` valida conexão e autenticação sem depender de schema:
    // funciona antes de qualquer migration e não é afetado por RLS ou lock.
    // O `.finally` limpa o timer — sem ele o setTimeout fica como handle
    // aberto (open handle no teste, event loop vivo em serverless).
    return Promise.race([this.prisma.$queryRaw`SELECT 1`, timeout]).finally(() =>
      clearTimeout(timer),
    );
  }
}