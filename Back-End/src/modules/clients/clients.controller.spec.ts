import { Test, TestingModule } from '@nestjs/testing';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { BusinessAccessGuard } from '../../common/guards/business-access.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

describe('ClientsController', () => {
  let controller: ClientsController;

  beforeEach(async () => {
    const mockService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientsController],
      providers: [
        {
          provide: ClientsService,
          useValue: mockService,
        },
      ],
    })
    .overrideGuard(BusinessAccessGuard)
    .useValue({ canActivate: () => true })
    .overrideGuard(JwtAuthGuard)
    .useValue({ canActivate: () => true })
    .compile();

    controller = module.get<ClientsController>(ClientsController);
  });

  it('devrait être défini', () => {
    expect(controller).toBeDefined();
  });
});
