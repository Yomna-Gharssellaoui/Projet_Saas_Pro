import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class InvoiceChatbotService {
  private readonly logger = new Logger(InvoiceChatbotService.name);
  private readonly CHATBOT_URL = process.env.INVOICE_CHATBOT_URL ?? 'http://localhost:8011';

  async chat(message: string): Promise<any> {
    try {
      const response = await fetch(`${this.CHATBOT_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error(`Chatbot responded with ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      this.logger.error('Failed to communicate with Invoice Chatbot', error);
      return {
        text: '⚠️ Unable to connect to the Invoice AI. Please try again later.',
        type: 'error',
        table: null,
      };
    }
  }
}
