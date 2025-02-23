import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { BlockchainListenerService } from '../services/blockchain-listener.service';
import { TRANSACTION_QUEUE_NAME } from 'src/constants/queue';

@Injectable()
@Processor(TRANSACTION_QUEUE_NAME)
export class TransactionQueueProcessor {
  private readonly logger = new Logger(TransactionQueueProcessor.name);

  constructor(private readonly blockchainService: BlockchainListenerService) {}

  @Process('retry-transaction')
  async handleFailedTransaction(
    job: Job<{ recipient: string; amount: bigint; chain: string }>,
  ) {
    const { recipient, amount, chain } = job.data;
    this.logger.log(
      `Retrying transaction for ${recipient} on ${chain} - Attempt ${job.attemptsMade}`,
    );

    try {
      if (chain === 'BSC') {
        await this.blockchainService.releaseTokensOnBSC(recipient, amount);
      } else if (chain === 'Ethereum') {
        await this.blockchainService.releaseTokensOnEthereum(recipient, amount);
      }

      this.logger.log(
        `Successfully retried transaction for ${recipient} on ${chain}`,
      );
    } catch (error) {
      this.logger.error(
        `Retry failed for ${recipient} on ${chain}: ${error.message}`,
      );
      throw error; // Keeps retrying until max attempts are reached
    }
  }
}
