import { Test, TestingModule } from '@nestjs/testing';
import { BusinessesController } from './businesses.controller';
import { BusinessesService } from './businesses.service';
import { BusinessAccessGuard } from '../../common/guards/business-access.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

describe('BusinessesController', () => {
  let controller: BusinessesController;

  beforeEach(async () => {
    const mockService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [BusinessesController],
      providers: [
        {
          provide: BusinessesService,
          useValue: mockService,
        },
      ],
    })
    .overrideGuard(BusinessAccessGuard)
    .useValue({ canActivate: () => true })
    .overrideGuard(JwtAuthGuard)
    .useValue({ canActivate: () => true })
    .compile();

    controller = module.get<BusinessesController>(BusinessesController);
  });

  it('devrait être défini', () => {
    expect(controller).toBeDefined();
  });
});
