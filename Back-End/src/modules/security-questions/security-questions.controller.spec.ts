import { Test, TestingModule } from '@nestjs/testing';
import { SecurityQuestionsController } from './security-questions.controller';
import { SecurityQuestionsService } from './security-questions.service';

describe('SecurityQuestionsController', () => {
  let controller: SecurityQuestionsController;

  beforeEach(async () => {
    const mockService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SecurityQuestionsController],
      providers: [
        {
          provide: SecurityQuestionsService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<SecurityQuestionsController>(SecurityQuestionsController);
  });

  it('devrait être défini', () => {
    expect(controller).toBeDefined();
  });
});
