import { DynamicModule, Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { BlockchainListenerService } from './services/blockchain-listener.service';
import { BullModule } from '@nestjs/bull';
import { TransactionQueueProcessor } from './queue/transaction-queue.processor';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionEntity } from './entities/transaction.entity';
import { TransactionService } from './services/transaction.service';
import { TransactionController } from './controllers/transaction.controller';
import { TRANSACTION_QUEUE_NAME } from './constants/queue';
import * as dotenv from 'dotenv';

dotenv.config();

@Module({
  imports: [
    // Logging module
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.colorize(),
            winston.format.printf(({ level, message, timestamp }) => {
              return `[${timestamp as string}] ${level}: ${message as string}`;
            }),
          ),
        }),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      ],
    }),

    // Database connection
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT) || 5432,
      username: process.env.DB_USER ?? 'postgres',
      password: process.env.DB_PASSWORD ?? 'password',
      database: process.env.DB_NAME ?? 'token_bridge',
      entities: [TransactionEntity],
      synchronize: true, // Auto-sync entities (disable in production)
    }) as DynamicModule,

    // Register entity for repositories
    TypeOrmModule.forFeature([TransactionEntity]),

    // Bull Queue for retry mechanism
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST ?? '127.0.0.1',
        port: Number(process.env.REDIS_PORT) || 6379,
      },
    }),
    BullModule.registerQueue({
      name: TRANSACTION_QUEUE_NAME,
    }),
  ],
  controllers: [TransactionController],
  providers: [
    BlockchainListenerService,
    TransactionQueueProcessor,
    TransactionService,
  ],
  exports: [WinstonModule, BullModule, TransactionService],
})
export class AppModule {}
