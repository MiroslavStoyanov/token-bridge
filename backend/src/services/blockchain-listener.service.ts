import {
  Injectable,
  LoggerService,
  OnModuleInit,
  Inject,
} from '@nestjs/common';
import { Wallet, JsonRpcProvider } from 'ethers';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import * as dotenv from 'dotenv';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import {
  TRANSACTIN_QUEUE_RETRY_PROCESS_NAME,
  TRANSACTION_QUEUE_NAME,
} from 'src/constants/queue';
import {
  TransactionEntity,
  TransactionStatus,
} from 'src/entities/transaction.entity';
import { TransactionService } from './transaction.service';

dotenv.config();

@Injectable()
export class BlockchainListenerService implements OnModuleInit {
  private ethereumProvider: JsonRpcProvider;
  private bscProvider: JsonRpcProvider;
  private wallet: Wallet;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: LoggerService,
    @InjectQueue(TRANSACTION_QUEUE_NAME)
    private readonly transactionQueue: Queue,
    private readonly transactionService: TransactionService,
  ) {
    const ethereumRpcUrl: string | undefined = process.env.SEPOLIA_RPC_URL;
    const bscRpcUrl: string | undefined = process.env.BSC_TESTNET_RPC_URL;
    const privateKey: string | undefined = process.env.PRIVATE_KEY;

    if (!ethereumRpcUrl || !bscRpcUrl || !privateKey) {
      throw new Error('Missing required environment variables.');
    }

    this.ethereumProvider = new JsonRpcProvider(ethereumRpcUrl);
    this.bscProvider = new JsonRpcProvider(bscRpcUrl);
    this.wallet = new Wallet(privateKey, this.ethereumProvider);
  }

  async onModuleInit(): Promise<void> {
    this.logger.log('Listening for blockchain events...');

    await this.ethereumProvider.on(
      'Locked',
      (
        sender: string,
        amount: bigint,
        targetChain: string,
        recipient: string,
      ) => {
        if (targetChain === 'BSC') {
          this.handleTransaction('BSC', recipient, amount);
        }
      },
    );

    await this.bscProvider.on(
      'Locked',
      (
        sender: string,
        amount: bigint,
        targetChain: string,
        recipient: string,
      ) => {
        if (targetChain === 'Ethereum') {
          this.handleTransaction('Ethereum', recipient, amount);
        }
      },
    );
  }

  private async handleTransaction(
    chain: 'BSC' | 'Ethereum',
    recipient: string,
    amount: bigint,
  ) {
    let transaction: TransactionEntity;

    try {
      transaction = await this.transactionService.createTransaction({
        recipient,
        amount,
        sourceChain: chain,
        status: TransactionStatus.PENDING,
        attempts: 0,
      });

      const txHash =
        await this.transactionService.executeTransaction(transaction);

      await this.transactionService.update(transaction.id, {
        status: TransactionStatus.SUCCESS,
        txHash,
      });

      this.logger.log(`Transaction successful: ${txHash}`);
    } catch (error) {
      this.logger.error(`Transaction failed, retrying: ${error.message}`);

      const tx = await this.transactionService.findById(transaction.id);

      if (!tx) {
        return;
      }

      const newAttempts = tx.attempts + 1;
      await this.transactionService.update(tx.id, {
        status: TransactionStatus.FAILED,
        attempts: newAttempts,
      });

      if (newAttempts < 5) {
        await this.transactionQueue.add(TRANSACTIN_QUEUE_RETRY_PROCESS_NAME, {
          transactionId: tx.id,
        });
      }
    }
  }
}
