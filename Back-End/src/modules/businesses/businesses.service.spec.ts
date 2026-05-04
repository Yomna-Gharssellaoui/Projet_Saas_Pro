import { Test, TestingModule } from '@nestjs/testing';
import { BusinessesService } from './businesses.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BusinessEntity } from './entities/business.entity';
import { UserEntity } from '../users/entities/user.entity';
import { TeamMemberEntity } from '../team-members/entities/team-member.entity';

describe('BusinessesService', () => {
  let service: BusinessesService;

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
        BusinessesService,
        {
          provide: getRepositoryToken(BusinessEntity),
          useValue: mockRepo,
        },
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockRepo,
        },
        {
          provide: getRepositoryToken(TeamMemberEntity),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<BusinessesService>(BusinessesService);
  });

  it('devrait être défini', () => {
    expect(service).toBeDefined();
  });
});
