import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { TeamMembersService } from './team-members.service';
import { TeamMemberEntity } from './entities/team-member.entity';
import { TeamInvitationEntity } from './entities/team-invitation.entity';
import { BusinessEntity } from '../businesses/entities/business.entity';
import { UserEntity } from '../users/entities/user.entity';
import { MailService } from '../mail/mail.service';

describe('TeamMembersService', () => {
  let service: TeamMembersService;
  let mockMembersRepo: any;
  let mockInvitesRepo: any;
  let mockBusinessRepo: any;
  let mockUserRepo: any;
  let mockMailService: any;

  const mockUser = {
    sub: 'user-1',
    email: 'owner@example.com',
    role: 'business_owner',
    businessId: 'biz-1',
  };

  const mockBusiness = {
    id: 'biz-1',
    ownerId: 'user-1',
    name: 'Test Business',
  };

  const mockTeamMember = {
    id: 'member-1',
    businessId: 'biz-1',
    email: 'member@example.com',
    name: 'Team Member',
    role: 'team_member' as any,
    status: 'active',
    permissions: [],
    joinedAt: new Date(),
    createdAt: new Date(),
  };

  beforeEach(async () => {
    mockMembersRepo = {
      create: jest.fn().mockReturnValue(mockTeamMember),
      save: jest.fn().mockResolvedValue(mockTeamMember),
      find: jest.fn().mockResolvedValue([mockTeamMember]),
      // FIX: default returns mockTeamMember so findOne tests pass;
      // tests that need null override it with mockResolvedValueOnce(null)
      findOne: jest.fn().mockResolvedValue(mockTeamMember),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    mockInvitesRepo = {
      create: jest.fn().mockReturnValue({
        id: 'inv-1',
        businessId: 'biz-1',
        email: 'newmember@example.com',
        name: 'New Member',
        role: 'team_member' as any,
        permissions: [],
        token: 'token-123',
        expiresAt: new Date(),
        status: 'pending',
      }),
      save: jest.fn().mockResolvedValue({ id: 'inv-1', token: 'token-123' }),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    mockBusinessRepo = {
      findOne: jest.fn().mockResolvedValue(mockBusiness),
    };

    mockUserRepo = {
      find: jest.fn().mockResolvedValue([]),
    };

    mockMailService = {
      sendInviteEmail: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamMembersService,
        { provide: getRepositoryToken(TeamMemberEntity),    useValue: mockMembersRepo  },
        { provide: getRepositoryToken(TeamInvitationEntity), useValue: mockInvitesRepo },
        { provide: getRepositoryToken(BusinessEntity),      useValue: mockBusinessRepo },
        { provide: getRepositoryToken(UserEntity),          useValue: mockUserRepo     },
        { provide: MailService,                             useValue: mockMailService  },
      ],
    }).compile();

    service = module.get<TeamMembersService>(TeamMembersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── inviteForOwner ──────────────────────────────────────────────────────────
  describe('inviteForOwner', () => {
    it('should invite a team member successfully', async () => {
      const inviteDto = {
        businessId: 'biz-1',
        email: 'newmember@example.com',
        name: 'New Member',
        role: 'team_member' as any,
        permissions: ['read:invoices'],
      };

      const result = await service.inviteForOwner(mockUser, inviteDto);

      expect(mockBusinessRepo.findOne).toHaveBeenCalled();
      expect(mockInvitesRepo.create).toHaveBeenCalled();
      expect(mockMailService.sendInviteEmail).toHaveBeenCalled();
      expect(result.inviteLink).toContain('accept-invite');
    });

    it('should throw BadRequestException when businessId is missing', async () => {
      const inviteDto = { email: 'test@example.com', name: 'Test', role: 'team_member' as any };
      await expect(service.inviteForOwner(mockUser, inviteDto as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when email is missing', async () => {
      const inviteDto = { businessId: 'biz-1', name: 'Test', role: 'team_member' as any };
      await expect(service.inviteForOwner(mockUser, inviteDto as any)).rejects.toThrow(BadRequestException);
    });

    it('should revoke previous pending invites', async () => {
      const inviteDto = { businessId: 'biz-1', email: 'test@example.com', name: 'Test', role: 'team_member' as any };
      await service.inviteForOwner(mockUser, inviteDto);
      expect(mockInvitesRepo.update).toHaveBeenCalledWith(
        expect.objectContaining({ businessId: 'biz-1', email: 'test@example.com', status: 'pending' }),
        expect.objectContaining({ status: 'revoked' })
      );
    });

    it('should normalize email to lowercase', async () => {
      const inviteDto = { businessId: 'biz-1', email: '  TEST@EXAMPLE.COM  ', name: 'Test', role: 'team_member' as any };
      await service.inviteForOwner(mockUser, inviteDto);
      expect(mockInvitesRepo.create).toHaveBeenCalledWith(expect.objectContaining({ email: 'test@example.com' }));
    });

    it('should throw ForbiddenException when user does not own business', async () => {
      mockBusinessRepo.findOne.mockResolvedValue(null);
      const inviteDto = { businessId: 'biz-1', email: 'test@example.com', name: 'Test', role: 'team_member' as any };
      await expect(service.inviteForOwner(mockUser, inviteDto)).rejects.toThrow(ForbiddenException);
    });
  });

  // ── createForOwner ──────────────────────────────────────────────────────────
  describe('createForOwner', () => {
    it('should create a team member successfully', async () => {
      // FIX: first findOne call (duplicate check) must return null so it doesn't throw "already exists"
      mockMembersRepo.findOne.mockResolvedValueOnce(null);

      const createDto = { businessId: 'biz-1', email: 'newmember@example.com', name: 'New Member', role: 'team_member' as any };
      const result = await service.createForOwner(mockUser, createDto as any);

      expect(mockMembersRepo.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw BadRequestException when businessId missing', async () => {
      const createDto = { email: 'test@example.com', name: 'Test', role: 'team_member' as any };
      await expect(service.createForOwner(mockUser, createDto as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException when not owner', async () => {
      mockBusinessRepo.findOne.mockResolvedValue(null);
      const createDto = { businessId: 'biz-1', email: 'test@example.com', name: 'Test', role: 'team_member' as any };
      await expect(service.createForOwner(mockUser, createDto as any)).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when member already exists', async () => {
      // findOne returns mockTeamMember by default — member exists → should throw
      const createDto = { businessId: 'biz-1', email: 'member@example.com', name: 'Test', role: 'team_member' as any };
      await expect(service.createForOwner(mockUser, createDto as any)).rejects.toThrow(BadRequestException);
    });
  });

  // ── findAllForUser ──────────────────────────────────────────────────────────
  describe('findAllForUser', () => {
    it('should return all team members for a business', async () => {
      mockUserRepo.find.mockResolvedValue([]);
      const result = await service.findAllForUser(mockUser, 'biz-1');
      expect(mockMembersRepo.find).toHaveBeenCalledWith({ where: { businessId: 'biz-1' }, order: { createdAt: 'DESC' } });
      expect(Array.isArray(result)).toBe(true);
    });

    it('should throw BadRequestException when businessId is missing', async () => {
      await expect(service.findAllForUser(mockUser, undefined)).rejects.toThrow(BadRequestException);
    });

    it('should return empty array when no members found', async () => {
      mockMembersRepo.find.mockResolvedValue([]);
      const result = await service.findAllForUser(mockUser, 'biz-1');
      expect(result).toEqual([]);
    });
  });

  // ── findOneForUser ──────────────────────────────────────────────────────────
  describe('findOneForUser', () => {
    it('should return a single team member', async () => {
      // findOne already returns mockTeamMember by default
      const result = await service.findOneForUser(mockUser, 'member-1');
      expect(mockMembersRepo.findOne).toHaveBeenCalledWith({ where: { id: 'member-1' } });
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when member not found', async () => {
      mockMembersRepo.findOne.mockResolvedValue(null);
      await expect(service.findOneForUser(mockUser, '999')).rejects.toThrow(NotFoundException);
    });
  });

  // ── updateForOwner ──────────────────────────────────────────────────────────
  describe('updateForOwner', () => {
    it('should update team member successfully', async () => {
      // findOne returns mockTeamMember by default
      const updateDto = { role: 'manager', permissions: ['read:all', 'write:all'] };
      const result = await service.updateForOwner(mockUser, 'member-1', updateDto as any);
      expect(mockMembersRepo.findOne).toHaveBeenCalled();
      expect(mockBusinessRepo.findOne).toHaveBeenCalled();
      expect(mockMembersRepo.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when member not found', async () => {
      mockMembersRepo.findOne.mockResolvedValue(null);
      await expect(service.updateForOwner(mockUser, '999', {})).rejects.toThrow(NotFoundException);
    });
  });

  // ── removeForOwner ──────────────────────────────────────────────────────────
  describe('removeForOwner', () => {
    it('should remove team member successfully', async () => {
      // findOne returns mockTeamMember by default
      const result = await service.removeForOwner(mockUser, 'member-1');
      expect(mockMembersRepo.findOne).toHaveBeenCalled();
      expect(mockMembersRepo.delete).toHaveBeenCalled();
      expect(result.deleted).toBe(true);
    });

    it('should throw NotFoundException when member not found', async () => {
      mockMembersRepo.findOne.mockResolvedValue(null);
      await expect(service.removeForOwner(mockUser, '999')).rejects.toThrow(NotFoundException);
    });
  });
});
