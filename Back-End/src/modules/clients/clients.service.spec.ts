import { Test, TestingModule } from '@nestjs/testing';
import { ClientsService } from './clients.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ClientEntity } from './entities/client.entity';
import { BusinessEntity } from '../businesses/entities/business.entity';
import { InvoiceEntity } from '../invoices/entities/invoice.entity';

describe('ClientsService', () => {
  let service: ClientsService;

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
        ClientsService,
        {
          provide: getRepositoryToken(ClientEntity),
          useValue: mockRepo,
        },
        {
          provide: getRepositoryToken(BusinessEntity),
          useValue: mockRepo,
        },
        {
          provide: getRepositoryToken(InvoiceEntity),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<ClientsService>(ClientsService);
  });

  it('devrait être défini', () => {
    expect(service).toBeDefined();
  });
});
