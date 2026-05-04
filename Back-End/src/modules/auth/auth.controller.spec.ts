import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigService } from '@nestjs/config';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  beforeEach(async () => {
    const mockAuthService = {
      login: jest.fn().mockResolvedValue({ access_token: 'mockToken' }),
      register: jest.fn().mockResolvedValue({ id: 1, email: 'test@test.com' }),
      registerPlatformAdmin: jest.fn().mockResolvedValue({ id: 2 }),
      verifyEmail: jest.fn().mockResolvedValue(true),
      resendVerificationEmail: jest.fn().mockResolvedValue(true),
      googleLogin: jest.fn().mockResolvedValue({ access_token: 'mockToken' }),
      githubLogin: jest.fn().mockResolvedValue({ access_token: 'mockToken' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'FRONTEND_URL') return 'http://localhost:5173';
              return null;
            }),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('devrait être défini', () => {
    expect(controller).toBeDefined();
  });

  it('login devrait retourner un token', async () => {
    const result = await controller.login({ email: 'test@test.com', password: 'password' });
    expect(result).toEqual({ access_token: 'mockToken' });
  });

  it('register devrait retourner un utilisateur', async () => {
    const result = await controller.register({ email: 'test@test.com', password: 'password', role: 'owner' } as any);
    expect(result).toEqual({ id: 1, email: 'test@test.com' });
  });
});
