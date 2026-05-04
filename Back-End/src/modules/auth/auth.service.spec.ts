import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserEntity } from '../users/entities/user.entity';
import { TeamInvitationEntity } from '../team-members/entities/team-invitation.entity';
import { TeamMemberEntity } from '../team-members/entities/team-member.entity';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const mockRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockRepo,
        },
        {
          provide: getRepositoryToken(TeamInvitationEntity),
          useValue: mockRepo,
        },
        {
          provide: getRepositoryToken(TeamMemberEntity),
          useValue: mockRepo,
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('mockToken'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('devrait être défini', () => {
    expect(service).toBeDefined();
  });
});
