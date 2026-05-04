import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const mockUsersService = {
      create: jest.fn().mockResolvedValue({ id: 1, email: 'user@test.com' }),
      findAll: jest.fn().mockResolvedValue([{ id: 1, email: 'user@test.com' }]),
      findOne: jest.fn().mockResolvedValue({ id: 1, email: 'user@test.com' }),
      update: jest.fn().mockResolvedValue({ id: 1, email: 'user_updated@test.com' }),
      remove: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('devrait être défini', () => {
    expect(controller).toBeDefined();
  });
});
