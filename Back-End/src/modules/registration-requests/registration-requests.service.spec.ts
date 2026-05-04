import { Test, TestingModule } from '@nestjs/testing';
import { RegistrationRequestsService } from './registration-requests.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { RegistrationRequestEntity } from './entities/registration-request.entity';
import { UserEntity } from '../users/entities/user.entity';
import { BusinessEntity } from '../businesses/entities/business.entity';
import { TeamMemberEntity } from '../team-members/entities/team-member.entity';
import { MailService } from '../mail/mail.service';
import { DataSource } from 'typeorm';

describe('RegistrationRequestsService', () => {
  let service: RegistrationRequestsService;

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
        RegistrationRequestsService,
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(RegistrationRequestEntity),
          useValue: mockRepo,
        },
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockRepo,
        },
        {
          provide: getRepositoryToken(BusinessEntity),
          useValue: mockRepo,
        },
        {
          provide: getRepositoryToken(TeamMemberEntity),
          useValue: mockRepo,
        },
        {
          provide: MailService,
          useValue: {
            sendOwnerApprovedEmail: jest.fn(),
            sendOwnerRejectedEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RegistrationRequestsService>(RegistrationRequestsService);
  });

  it('devrait être défini', () => {
    expect(service).toBeDefined();
  });
});
