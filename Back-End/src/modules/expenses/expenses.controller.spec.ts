import { Test, TestingModule } from '@nestjs/testing';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { BusinessAccessGuard } from '../../common/guards/business-access.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

describe('ExpensesController', () => {
  let controller: ExpensesController;

  beforeEach(async () => {
    const mockService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExpensesController],
      providers: [
        {
          provide: ExpensesService,
          useValue: mockService,
        },
      ],
    })
    .overrideGuard(BusinessAccessGuard)
    .useValue({ canActivate: () => true })
    .overrideGuard(JwtAuthGuard)
    .useValue({ canActivate: () => true })
    .compile();

    controller = module.get<ExpensesController>(ExpensesController);
  });

  it('devrait être défini', () => {
    expect(controller).toBeDefined();
  });
});
