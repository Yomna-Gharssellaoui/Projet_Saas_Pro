import { Test, TestingModule } from '@nestjs/testing';
import { InvoicesService } from './invoices.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { InvoiceEntity } from './entities/invoice.entity';
import { InvoiceItemEntity } from './entities/invoice-item.entity';
import { BusinessEntity } from '../businesses/entities/business.entity';
import { ClientEntity } from '../clients/entities/client.entity';

describe('InvoicesService', () => {
  let service: InvoicesService;

  beforeEach(async () => {
    const mockRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicesService,
        {
          provide: getRepositoryToken(InvoiceEntity),
          useValue: mockRepo,
        },
        {
          provide: getRepositoryToken(InvoiceItemEntity),
          useValue: mockRepo,
        },
        {
          provide: getRepositoryToken(BusinessEntity),
          useValue: mockRepo,
        },
        {
          provide: getRepositoryToken(ClientEntity),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<InvoicesService>(InvoicesService);
  });

  it('devrait être défini', () => {
    expect(service).toBeDefined();
  });
});
