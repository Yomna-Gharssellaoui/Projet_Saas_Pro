import { Test, TestingModule } from '@nestjs/testing';
import { InvoiceChatbotController } from './invoice-chatbot.controller';
import { InvoiceChatbotService } from './invoice-chatbot.service';

describe('InvoiceChatbotController', () => {
  let controller: InvoiceChatbotController;
  let service: InvoiceChatbotService;

  beforeEach(async () => {
    // 1. Créer un "Mock" (une fausse version) du service pour isoler le contrôleur
    const mockService = {
      chat: jest.fn().mockResolvedValue({ text: 'Réponse simulée', type: 'text', table: null }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvoiceChatbotController],
      providers: [
        {
          provide: InvoiceChatbotService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<InvoiceChatbotController>(InvoiceChatbotController);
    service = module.get<InvoiceChatbotService>(InvoiceChatbotService);
  });

  it('devrait être défini', () => {
    expect(controller).toBeDefined();
  });

  it('ping devrait retourner status ok', () => {
    expect(controller.ping()).toEqual({ status: 'ok' });
  });

  it('chat devrait appeler le service avec le bon message', async () => {
    const body = { message: 'Hello AI' };
    const result = await controller.chat(body);

    // Vérifier que la méthode chat du service a bien été appelée avec "Hello AI"
    expect(service.chat).toHaveBeenCalledWith('Hello AI');
    // Vérifier que le contrôleur retourne bien ce que le service a répondu
    expect(result).toEqual({ text: 'Réponse simulée', type: 'text', table: null });
  });
});
