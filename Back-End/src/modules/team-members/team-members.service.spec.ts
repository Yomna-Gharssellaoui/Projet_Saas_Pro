import { Test, TestingModule } from '@nestjs/testing';
import { TeamMembersService } from './team-members.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TeamMemberEntity } from './entities/team-member.entity';
import { TeamInvitationEntity } from './entities/team-invitation.entity';
import { BusinessEntity } from '../businesses/entities/business.entity';
import { UserEntity } from '../users/entities/user.entity';
import { MailService } from '../mail/mail.service';

describe('TeamMembersService', () => {
  let service: TeamMembersService;

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
        TeamMembersService,
        {
          provide: getRepositoryToken(TeamMemberEntity),
          useValue: mockRepo,
        },
        {
          provide: getRepositoryToken(TeamInvitationEntity),
          useValue: mockRepo,
        },
        {
          provide: getRepositoryToken(BusinessEntity),
          useValue: mockRepo,
        },
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockRepo,
        },
        {
          provide: MailService,
          useValue: {
            sendInvitationEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TeamMembersService>(TeamMembersService);
  });

  it('devrait être défini', () => {
    expect(service).toBeDefined();
  });
});
