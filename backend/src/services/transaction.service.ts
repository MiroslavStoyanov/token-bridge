import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  BaseContract,
  Contract,
  ContractTransactionResponse,
  JsonRpcProvider,
  Wallet,
} from 'ethers';
import { TransactionEntity } from 'src/entities/transaction.entity';
import { DataSource, MoreThan, Repository } from 'typeorm';

interface BridgeContract extends BaseContract {
  releaseTokens: (
    recipient: string,
    amount: bigint,
  ) => Promise<ContractTransactionResponse>;
}

@Injectable()
export class TransactionService {
  private ethereumProvider: JsonRpcProvider;
  private bscProvider: JsonRpcProvider;
  private ethereumBridge: Contract;
  private bscBridge: Contract;
  private wallet: Wallet;

  constructor(
    @InjectRepository(TransactionEntity)
    private readonly transactionRepository: Repository<TransactionEntity>,
    private readonly dataSource: DataSource,
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

    const bridgeAbi = [
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

  async createTransaction(
    data: Partial<TransactionEntity>,
  ): Promise<TransactionEntity> {
    const tx = this.transactionRepository.create(data);
    return this.transactionRepository.save(tx);
  }

  async findById(id: number): Promise<TransactionEntity | undefined> {
    return this.transactionRepository.findOne({ where: { id } });
  }

  async findAll(): Promise<TransactionEntity[]> {
    return this.transactionRepository.find();
  }

  async findRetried(): Promise<TransactionEntity[]> {
    return this.transactionRepository.find({
      where: { attempts: MoreThan(1) },
    });
  }

  async update(id: number, fields: Partial<TransactionEntity>): Promise<void> {
    await this.transactionRepository.update(id, fields);
  }

  async executeTransaction(tx: TransactionEntity): Promise<string> {
    let contract: BridgeContract;
    let provider: JsonRpcProvider;

    if (tx.sourceChain === 'BSC') {
      provider = this.bscProvider;
      contract = this.bscBridge.connect(
        this.wallet.connect(provider),
      ) as unknown as BridgeContract;
    } else if (tx.sourceChain === 'Ethereum') {
      provider = this.ethereumProvider;
      contract = this.ethereumBridge.connect(
        this.wallet.connect(provider),
      ) as unknown as BridgeContract;
    } else {
      throw new Error(`Unknown chain type: ${tx.sourceChain}`);
    }

    const txResponse: ContractTransactionResponse =
      await contract.releaseTokens(tx.recipient, tx.amount);

    await txResponse.wait();
    return txResponse.hash;
  }
}
