import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { InvoiceChatbotService } from './invoice-chatbot.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('invoice-chatbot')
export class InvoiceChatbotController {
  constructor(private readonly chatbotService: InvoiceChatbotService) {}

  @Get('ping')
  ping() {
    return { status: 'ok' };
  }

  @UseGuards(JwtAuthGuard)
  @Post('chat')
  async chat(@Body() body: { message: string }) {
    return this.chatbotService.chat(body.message);
  }
}
