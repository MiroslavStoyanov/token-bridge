import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import {
  TRANSACTIN_QUEUE_RETRY_PROCESS_NAME,
  TRANSACTION_QUEUE_NAME,
} from 'src/constants/queue';
import { TransactionService } from 'src/services/transaction.service';
import { TransactionStatus } from 'src/entities/transaction.entity';

@Injectable()
@Processor(TRANSACTION_QUEUE_NAME)
export class TransactionQueueProcessor {
  private readonly logger = new Logger(TransactionQueueProcessor.name);
  private readonly MAX_RETRIES = 5;

  constructor(private readonly transactionService: TransactionService) {}

  @Process(TRANSACTIN_QUEUE_RETRY_PROCESS_NAME)
  async handleFailedTransaction(job: Job<{ transactionId: number }>) {
    const { transactionId } = job.data;
    this.logger.log(`Processing retry for transaction ID: ${transactionId}`);

    const transaction = await this.transactionService.findById(transactionId);
    if (!transaction) {
      this.logger.error(
        `Transaction ID ${transactionId} not found. Skipping retry.`,
      );
      return;
    }

    if (transaction.attempts >= this.MAX_RETRIES) {
      this.logger.warn(
        `Transaction ID ${transactionId} reached max retries (${this.MAX_RETRIES}). Marking as permanently failed.`,
      );
      await this.transactionService.update(transactionId, {
        status: TransactionStatus.FAILED,
      });
      return;
    }

    const newAttempts = transaction.attempts + 1;
    await this.transactionService.update(transactionId, {
      attempts: newAttempts,
      status: TransactionStatus.PENDING,
    });

    try {
      const txHash =
        await this.transactionService.executeTransaction(transaction);

      await this.transactionService.update(transactionId, {
        status: TransactionStatus.SUCCESS,
        txHash,
      });

      this.logger.log(
        `Successfully retried transaction ID: ${transactionId}, TX Hash: ${txHash}`,
      );
    } catch (error) {
      this.logger.error(
        `Retry attempt ${newAttempts} failed for transaction ID ${transactionId}: ${error.message}`,
      );

      await this.transactionService.update(transactionId, {
        status: TransactionStatus.FAILED,
        errorMessage: error.message,
      });

      if (newAttempts < this.MAX_RETRIES) {
        await job.queue.add(
          'retry-transaction',
          { transactionId },
          { delay: 60000 },
        );
        this.logger.log(
          `Transaction ID ${transactionId} re-enqueued for another retry attempt (${newAttempts + 1}).`,
        );
      } else {
        this.logger.warn(
          `Transaction ID ${transactionId} has reached max retry limit and will not be retried.`,
        );
      }
    }
  }
}
