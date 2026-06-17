import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@marketup/database';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private keepAliveInterval: NodeJS.Timeout | null = null;

  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Successfully connected to the database.');
    this.startKeepalive();
  }

  private startKeepalive() {
    this.keepAliveInterval = setInterval(async () => {
      try {
        await this.$queryRaw`SELECT 1`;
      } catch (error) {
        this.logger.warn('Database keepalive ping failed. Attempting to reconnect...', error);
        try {
          await this.$connect();
          this.logger.log('Database connection re-established successfully.');
        } catch (reconnectError) {
          this.logger.error('Failed to re-establish database connection.', reconnectError);
        }
      }
    }, 4 * 60 * 1000);

    // Unref the timer so it doesn't block the process from exiting cleanly (e.g. during testing or shutdown)
    this.keepAliveInterval.unref?.();
  }

  async onModuleDestroy() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
    await this.$disconnect();
    this.logger.log('Database disconnected successfully.');
  }
}
