import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum TransactionStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

@Entity('transactions')
@Index(['status']) // Index on status for faster lookups of pending/failed transactions
@Index(['attempts']) // Index on attempts for efficient query of retried transactions
export class TransactionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'enum', enum: TransactionStatus })
  status: TransactionStatus;

  @Column({ default: 0 })
  attempts: number;

  @Column() // Chain from where the transaction originated
  sourceChain: string;

  @Column() // Chain to where the transaction is being sent
  targetChain: string;

  @Column({ nullable: false }) // Sender address
  sender: string;

  @Column({ nullable: false }) // Recipient address
  recipient: string;

  @Column({ type: 'bigint', nullable: false }) // Token amount
  amount: bigint;

  @Column({ nullable: true, length: 66 }) // Store transaction hash if available
  txHash?: string;

  @Column('json', { nullable: true }) // Additional payload (metadata, token details, etc.)
  payload: any;

  @Column({ nullable: true, type: 'text' }) // Error message in case of failure
  errorMessage?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
