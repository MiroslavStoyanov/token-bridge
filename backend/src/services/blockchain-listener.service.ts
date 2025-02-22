import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  Contract,
  Wallet,
  JsonRpcProvider,
  InterfaceAbi,
  ContractTransactionResponse,
  BaseContract,
} from 'ethers';
import * as dotenv from 'dotenv';

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

  constructor() {
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
    console.log('Listening for blockchain events...');

    this.ethereumBridge.on(
      'Locked',
      (
        sender: string,
        amount: bigint,
        targetChain: string,
        recipient: string,
      ) => {
        console.log(
          `Ethereum → BSC: ${amount.toString()} tokens locked by ${sender}`,
        );
        if (targetChain === 'BSC') {
          void this.releaseTokensOnBSC(recipient, amount).catch((error) => {
            console.error('Error in releaseTokensOnBSC:', error);
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
        console.log(
          `BSC → Ethereum: ${amount.toString()} tokens locked by ${sender}`,
        );
        if (targetChain === 'Ethereum') {
          void this.releaseTokensOnEthereum(recipient, amount).catch(
            (error) => {
              console.error('Error in releaseTokensOnEthereum:', error);
            },
          );
        }
      },
    );
  }

  private async releaseTokensOnBSC(
    recipient: string,
    amount: bigint,
  ): Promise<void> {
    try {
      const signer: Wallet = this.wallet.connect(this.bscProvider);
      const contract = this.bscBridge.connect(
        signer,
      ) as unknown as BridgeContract;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const tx: ContractTransactionResponse = await contract.releaseTokens(
        recipient,
        amount,
      );
      await tx.wait();

      console.log(
        `Released ${amount.toString()} tokens to ${recipient} on BSC`,
      );
    } catch (error: unknown) {
      console.error(
        'Error releasing tokens on BSC:',
        this.getErrorMessage(error),
      );
    }
  }

  private async releaseTokensOnEthereum(
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
      console.log(
        `Released ${amount.toString()} tokens to ${recipient} on Ethereum`,
      );
    } catch (error: unknown) {
      console.error(
        'Error releasing tokens on Ethereum:',
        this.getErrorMessage(error),
      );
    }
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return 'An unknown error occurred';
  }
}
