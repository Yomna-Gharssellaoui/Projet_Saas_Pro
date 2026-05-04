import { Test, TestingModule } from '@nestjs/testing';
import { TeamMembersController } from './team-members.controller';
import { TeamMembersService } from './team-members.service';

describe('TeamMembersController', () => {
  let controller: TeamMembersController;

  beforeEach(async () => {
    const mockService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TeamMembersController],
      providers: [
        {
          provide: TeamMembersService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<TeamMembersController>(TeamMembersController);
  });

  it('devrait être défini', () => {
    expect(controller).toBeDefined();
  });
});
