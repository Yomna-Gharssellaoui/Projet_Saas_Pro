import { Test, TestingModule } from '@nestjs/testing';
import { ExpensesService } from './expenses.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ExpenseEntity } from './entities/expense.entity';
import { BusinessEntity } from '../businesses/entities/business.entity';

describe('ExpensesService', () => {
  let service: ExpensesService;

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
        ExpensesService,
        {
          provide: getRepositoryToken(ExpenseEntity),
          useValue: mockRepo,
        },
        {
          provide: getRepositoryToken(BusinessEntity),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<ExpensesService>(ExpensesService);
  });

  it('devrait être défini', () => {
    expect(service).toBeDefined();
  });
});
