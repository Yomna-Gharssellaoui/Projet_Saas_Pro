import { Test, TestingModule } from '@nestjs/testing';
import { InvoiceChatbotService } from './invoice-chatbot.service';

// Mock de la fonction fetch globale
global.fetch = jest.fn();

describe('InvoiceChatbotService', () => {
  let service: InvoiceChatbotService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InvoiceChatbotService],
    }).compile();

    service = module.get<InvoiceChatbotService>(InvoiceChatbotService);
  });

  afterEach(() => {
    jest.clearAllMocks(); // Réinitialiser le mock après chaque test
  });

  it('devrait être défini', () => {
    expect(service).toBeDefined();
  });

  it('devrait retourner la réponse du chatbot en cas de succès', async () => {
    // 1. Définir le comportement attendu du mock (Succès)
    const mockResponse = { text: 'Voici votre facture', type: 'text', table: null };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue(mockResponse),
    });

    // 2. Appeler la méthode
    const result = await service.chat('Bonjour');

    // 3. Vérifier les résultats
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8011/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Bonjour' }),
    });
    expect(result).toEqual(mockResponse);
  });

  it('devrait retourner un message d\'erreur si le serveur ne répond pas', async () => {
    // 1. Définir le comportement attendu (Erreur HTTP)
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    });

    // 2. Appeler la méthode
    const result = await service.chat('Bonjour');

    // 3. Vérifier les résultats
    expect(result).toEqual({
      text: '⚠️ Unable to connect to the Invoice AI. Please try again later.',
      type: 'error',
      table: null,
    });
  });

  it('devrait retourner un message d\'erreur en cas d\'exception réseau', async () => {
    // 1. Définir le comportement attendu (Erreur réseau)
    (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

    // 2. Appeler la méthode
    const result = await service.chat('Bonjour');

    // 3. Vérifier les résultats
    expect(result).toEqual({
      text: '⚠️ Unable to connect to the Invoice AI. Please try again later.',
      type: 'error',
      table: null,
    });
  });
});
