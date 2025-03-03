import { Controller, Get, Param } from '@nestjs/common';
import { TransactionEntity } from 'src/entities/transaction.entity';
import { TransactionService } from 'src/services/transaction.service';

@Controller('transactions')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Get()
  async getAllTransactions(): Promise<TransactionEntity[]> {
    return this.transactionService.findAll();
  }

  @Get('retried')
  async getRetriedTransactions(): Promise<TransactionEntity[]> {
    return this.transactionService.findRetried();
  }

  @Get(':id')
  async getTransactionById(
    @Param('id') id: string,
  ): Promise<TransactionEntity> {
    const txId = parseInt(id, 10);
    return this.transactionService.findById(txId);
  }
}
