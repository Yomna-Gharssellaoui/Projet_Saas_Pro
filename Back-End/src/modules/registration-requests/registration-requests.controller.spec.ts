import { Test, TestingModule } from '@nestjs/testing';
import { RegistrationRequestsController } from './registration-requests.controller';
import { RegistrationRequestsService } from './registration-requests.service';
import { PlatformAdminDbGuard } from '../../common/guards/platform-admin-db.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

describe('RegistrationRequestsController', () => {
  let controller: RegistrationRequestsController;

  beforeEach(async () => {
    const mockService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RegistrationRequestsController],
      providers: [
        {
          provide: RegistrationRequestsService,
          useValue: mockService,
        },
      ],
    })
    .overrideGuard(PlatformAdminDbGuard)
    .useValue({ canActivate: () => true })
    .overrideGuard(JwtAuthGuard)
    .useValue({ canActivate: () => true })
    .compile();

    controller = module.get<RegistrationRequestsController>(RegistrationRequestsController);
  });

  it('devrait être défini', () => {
    expect(controller).toBeDefined();
  });
});
