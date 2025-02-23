import {
  Injectable,
  LoggerService,
  OnModuleInit,
  Inject,
} from '@nestjs/common';
import {
  Contract,
  Wallet,
  JsonRpcProvider,
  InterfaceAbi,
  ContractTransactionResponse,
  BaseContract,
} from 'ethers';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import * as dotenv from 'dotenv';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { TRANSACTION_QUEUE_NAME } from 'src/constants/queue';

dotenv.config();

interface BridgeContract extends BaseContract {
  releaseTokens: (
    recipient: string,
    amount: bigint,
  ) => Promise<ContractTransactionResponse>;
}

@Injectable()
export class BlockchainListenerService implements OnModuleInit {
  private ethereumProvider: JsonRpcProvider;
  private bscProvider: JsonRpcProvider;
  private ethereumBridge!: BaseContract;
  private bscBridge!: BaseContract;
  private wallet: Wallet;

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: LoggerService,
    @InjectQueue(TRANSACTION_QUEUE_NAME)
    private readonly transactionQueue: Queue,
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

    const bridgeAbi: InterfaceAbi = [
      'event Locked(address indexed sender, uint256 amount, string targetChain, address recipient)',
      'function releaseTokens(address recipient, uint256 amount) external',
    ];

    const ethereumBridgeAddress: string | undefined =
      process.env.ETHEREUM_BRIDGE_ADDRESS;
    const bscBridgeAddress: string | undefined = process.env.BSC_BRIDGE_ADDRESS;

    if (!ethereumBridgeAddress || !bscBridgeAddress) {
      throw new Error('Missing bridge contract addresses.');
    }

    this.ethereumBridge = new Contract(
      ethereumBridgeAddress,
      bridgeAbi,
      this.wallet,
    );
    this.bscBridge = new Contract(bscBridgeAddress, bridgeAbi, this.wallet);
  }

  onModuleInit(): void {
    this.logger.log('Listening for blockchain events...');

    this.ethereumBridge.on(
      'Locked',
      (
        sender: string,
        amount: bigint,
        targetChain: string,
        recipient: string,
      ) => {
        this.logger.log(
          `Ethereum → BSC: ${amount.toString()} tokens locked by ${sender}`,
        );
        if (targetChain === 'BSC') {
          void this.releaseTokensOnBSC(recipient, amount).catch((error) => {
            this.logger.error('Error in releaseTokensOnBSC:', error);
          });
        }
      },
    );

    this.bscBridge.on(
      'Locked',
      (
        sender: string,
        amount: bigint,
        targetChain: string,
        recipient: string,
      ) => {
        this.logger.log(
          `BSC → Ethereum: ${amount.toString()} tokens locked by ${sender}`,
        );
        if (targetChain === 'Ethereum') {
          void this.releaseTokensOnEthereum(recipient, amount).catch(
            (error) => {
              this.logger.error('Error in releaseTokensOnEthereum:', error);
            },
          );
        }
      },
    );
  }

  public async releaseTokensOnBSC(
    recipient: string,
    amount: bigint,
  ): Promise<void> {
    try {
      const signer: Wallet = this.wallet.connect(this.bscProvider);
      const contract = this.bscBridge.connect(
        signer,
      ) as unknown as BridgeContract;

      const tx: ContractTransactionResponse = await contract.releaseTokens(
        recipient,
        amount,
      );
      await tx.wait();

      this.logger.log(
        `Released ${amount.toString()} tokens to ${recipient} on BSC`,
      );
    } catch (error: unknown) {
      const errorMessage = this.getErrorMessage(error);
      this.logger.error(`Transaction failed. Retrying: ${errorMessage}`);

      await this.transactionQueue.add(
        'retry-transaction',
        { recipient, amount, chain: 'BSC' },
        { attempts: 5, backoff: 10000 },
      );
    }
  }

  public async releaseTokensOnEthereum(
    recipient: string,
    amount: bigint,
  ): Promise<void> {
    try {
      const signer: Wallet = this.wallet.connect(this.bscProvider);
      const contract = this.ethereumBridge.connect(
        signer,
      ) as unknown as BridgeContract;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
      const tx: ContractTransactionResponse = await contract.releaseTokens(
        recipient,
        amount,
      );

      await tx.wait();
      this.logger.log(
        `Released ${amount.toString()} tokens to ${recipient} on Ethereum`,
      );
    } catch (error: unknown) {
      const errorMessage = this.getErrorMessage(error);
      this.logger.error(`Transaction failed. Retrying: ${errorMessage}`);

      await this.transactionQueue.add(
        'retry-transaction',
        { recipient, amount, chain: 'Ethereum' },
        { attempts: 5, backoff: 10000 },
      );
    }
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    if (error && typeof error === 'object' && 'message' in error) {
      return (
        (error as { message?: string }).message || 'An unknown error occurred'
      );
    }
    return 'An unknown error occurred';
  }
}
