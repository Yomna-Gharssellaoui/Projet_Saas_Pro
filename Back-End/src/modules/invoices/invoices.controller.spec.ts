import { Test, TestingModule } from '@nestjs/testing';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { InvoiceChatbotService } from '../invoice-chatbot/invoice-chatbot.service';
import { BusinessAccessGuard } from '../../common/guards/business-access.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';

describe('InvoicesController', () => {
  let controller: InvoicesController;

  beforeEach(async () => {
    const mockService = {
      create: jest.fn().mockResolvedValue({ id: 1, amount: 100 }),
      findAll: jest.fn().mockResolvedValue([{ id: 1, amount: 100 }]),
      findOne: jest.fn().mockResolvedValue({ id: 1, amount: 100 }),
      update: jest.fn().mockResolvedValue({ id: 1, amount: 150 }),
      remove: jest.fn().mockResolvedValue(true),
    };

    const mockChatbot = {
      chat: jest.fn().mockResolvedValue({ text: 'mocked response' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InvoicesController],
      providers: [
        {
          provide: InvoicesService,
          useValue: mockService,
        },
        {
          provide: InvoiceChatbotService,
          useValue: mockChatbot,
        },
      ],
    })
    .overrideGuard(BusinessAccessGuard)
    .useValue({ canActivate: () => true })
    .overrideGuard(JwtAuthGuard)
    .useValue({ canActivate: () => true })
    .overrideGuard(PermissionsGuard)
    .useValue({ canActivate: () => true })
    .compile();

    controller = module.get<InvoicesController>(InvoicesController);
  });

  it('devrait être défini', () => {
    expect(controller).toBeDefined();
  });
});
