import { Module } from '@nestjs/common';
import { InvoiceChatbotController } from './invoice-chatbot.controller';
import { InvoiceChatbotService } from './invoice-chatbot.service';

@Module({
  controllers: [InvoiceChatbotController],
  providers: [InvoiceChatbotService],
})
export class InvoiceChatbotModule {}
