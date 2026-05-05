import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { RegistrationRequestsService } from './registration-requests.service';
import { RegistrationRequestEntity } from './entities/registration-request.entity';
import { UserEntity } from '../users/entities/user.entity';
import { BusinessEntity } from '../businesses/entities/business.entity';
import { TeamMemberEntity } from '../team-members/entities/team-member.entity';
import { MailService } from '../mail/mail.service';

describe('RegistrationRequestsService', () => {
  let service: RegistrationRequestsService;
  let mockRepo: any;

  const mockRegistrationRequest: any = {
    id: 'req-1',
    ownerEmail: 'test@example.com',
    ownerName: 'Test User',
    companyName: 'Test Business',
    companyCategory: 'saas',
    phone: '12345678',
    country: 'Tunisia',
    status: 'pending',
    submittedAt: new Date(),
    reviewedAt: null,
    reviewedBy: null,
    rejectionReason: null,
  };

  const validCreateDto = {
    ownerEmail: 'newuser@example.com',
    ownerName: 'New User',
    companyName: 'New Business',
    companyCategory: 'saas',
    companyPhone: '87654321',
    companyAddress: 'Tunis',
    paymentMethod: 'cash',
  };

  beforeEach(async () => {
    mockRepo = {
      create:  jest.fn().mockReturnValue(mockRegistrationRequest),
      save:    jest.fn().mockResolvedValue(mockRegistrationRequest),
      find:    jest.fn().mockResolvedValue([mockRegistrationRequest]),
      findOne: jest.fn().mockResolvedValue(null),
      delete:  jest.fn().mockResolvedValue({ affected: 1 }),
    };

    const mockDataSource = {
      transaction: jest.fn().mockImplementation((cb) => cb({
        getRepository: jest.fn().mockReturnValue(mockRepo),
        save: jest.fn(),
      })),
    };

    const mockUsersRepo       = { findOne: jest.fn().mockResolvedValue(null), save: jest.fn() };
    const mockBusinessRepo    = { findOne: jest.fn().mockResolvedValue(null), save: jest.fn(), create: jest.fn() };
    const mockTeamMembersRepo = { findOne: jest.fn().mockResolvedValue(null), save: jest.fn(), create: jest.fn() };
    const mockMailService     = { sendMail: jest.fn().mockResolvedValue(true), sendInviteEmail: jest.fn().mockResolvedValue(true) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegistrationRequestsService,
        { provide: DataSource,                                     useValue: mockDataSource      },
        { provide: getRepositoryToken(RegistrationRequestEntity), useValue: mockRepo            },
        { provide: getRepositoryToken(UserEntity),                useValue: mockUsersRepo       },
        { provide: getRepositoryToken(BusinessEntity),            useValue: mockBusinessRepo    },
        { provide: getRepositoryToken(TeamMemberEntity),          useValue: mockTeamMembersRepo },
        { provide: MailService,                                   useValue: mockMailService     },
      ],
    }).compile();

    service = module.get<RegistrationRequestsService>(RegistrationRequestsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a registration request successfully', async () => {
      const result = await service.create(validCreateDto as any);
      expect(mockRepo.create).toHaveBeenCalled();
      expect(mockRepo.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should normalize email to lowercase', async () => {
      const dto = { ...validCreateDto, ownerEmail: '  TEST@EXAMPLE.COM  ' };
      await service.create(dto as any);
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ ownerEmail: 'test@example.com' })
      );
    });

    it('should trim whitespace from fields', async () => {
      const dto = { ...validCreateDto, ownerName: '  User Name  ', companyName: '  Business Name  ' };
      await service.create(dto as any);
      expect(mockRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ ownerName: 'User Name', companyName: 'Business Name' })
      );
    });
  });

  describe('findOne', () => {
    it('should return a single registration request', async () => {
      mockRepo.findOne.mockResolvedValue(mockRegistrationRequest);
      const result = await service.findOne('req-1');
      expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { id: 'req-1' } });
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when not found', async () => {
      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('list', () => {
    it('should return all registration requests', async () => {
      const result = await service.list({} as any);
      expect(mockRepo.find).toHaveBeenCalled();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return empty array when no requests found', async () => {
      mockRepo.find.mockResolvedValue([]);
      const result = await service.list({} as any);
      expect(result).toEqual([]);
    });
  });

  describe('approve', () => {
    it('should throw NotFoundException when request not found', async () => {
      await expect(
        service.approve('999', { role: 'platform_admin' } as any, {} as any)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('reject', () => {
    it('should throw NotFoundException when request not found', async () => {
      await expect(
        service.reject('999', { role: 'platform_admin' } as any, {} as any)
      ).rejects.toThrow(NotFoundException);
    });
  });
});
