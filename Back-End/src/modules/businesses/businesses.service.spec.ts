import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { BusinessesService } from './businesses.service';
import { BusinessEntity } from './entities/business.entity';
import { TeamMemberEntity } from '../team-members/entities/team-member.entity';
import { UserEntity } from '../users/entities/user.entity';

describe('BusinessesService', () => {
  let service: BusinessesService;
  let mockBusinessRepo: any;
  let mockTeamMembersRepo: any;
  let mockUsersRepo: any;

  const mockBusiness: any = {
    id: 'biz-1',
    ownerId: 'user-1',
    name: 'Test Business',
    type: 'saas',
    address: '123 Street',
    city: 'Tunis',
    country: 'Tunisia',
    taxId: 'TAX123',
    phone: '12345678',
    email: 'business@example.com',
    website: 'https://example.com',
    currency: 'TND',
    fiscalYearStart: 'january',
    industry: 'tech',
    logoUrl: 'https://example.com/logo.png',
    taxRate: 19,
    isProfileComplete: true,
    status: 'active',
    plan: 'pro',
  };

  const mockOwner: any = {
    id: 'user-1',
    name: 'Owner Name',
    email: 'owner@example.com',
    username: 'owner',
    fullName: 'Owner Full Name',
  };

  beforeEach(async () => {
    mockBusinessRepo = {
      create: jest.fn().mockReturnValue(mockBusiness),
      save: jest.fn().mockResolvedValue(mockBusiness),
      find: jest.fn().mockResolvedValue([mockBusiness]),
      findOne: jest.fn().mockResolvedValue(mockBusiness),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
      remove: jest.fn().mockResolvedValue(mockBusiness),
      clear: jest.fn().mockResolvedValue(undefined),
    };

    mockTeamMembersRepo = {
      findOne: jest.fn().mockResolvedValue(null),
    };

    mockUsersRepo = {
      find: jest.fn().mockResolvedValue([mockOwner]),
      findOne: jest.fn().mockResolvedValue(mockOwner),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BusinessesService,
        {
          provide: getRepositoryToken(BusinessEntity),
          useValue: mockBusinessRepo,
        },
        {
          provide: getRepositoryToken(TeamMemberEntity),
          useValue: mockTeamMembersRepo,
        },
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUsersRepo,
        },
      ],
    }).compile();

    service = module.get<BusinessesService>(BusinessesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all businesses', async () => {
      const result = await service.findAll();

      expect(mockBusinessRepo.find).toHaveBeenCalled();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should include owner information', async () => {
      const result = await service.findAll();

      expect(result[0]).toHaveProperty('ownerName');
    });

    it('should handle businesses without owners', async () => {
      const businessWithoutOwner = { ...mockBusiness, ownerId: null };
      mockBusinessRepo.find.mockResolvedValue([businessWithoutOwner]);
      mockUsersRepo.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result[0].ownerName).toBeDefined();
    });
  });

  describe('getByIdForUser', () => {
    it('should return business for platform admin', async () => {
      const adminUser = { role: 'platform_admin', id: 'admin-1' };

      const result = await service.getByIdForUser(adminUser, 'biz-1');

      expect(mockBusinessRepo.findOne).toHaveBeenCalledWith({ where: { id: 'biz-1' } });
      expect(result).toBeDefined();
    });

    it('should return business for owner', async () => {
      const ownerUser = { role: 'business_owner', id: 'user-1', email: 'owner@example.com' };

      const result = await service.getByIdForUser(ownerUser, 'biz-1');

      expect(result).toBeDefined();
    });

    it('should return business for team member', async () => {
      const memberUser = { role: 'team_member', id: 'member-1', email: 'member@example.com' };
      mockTeamMembersRepo.findOne.mockResolvedValue({ id: 'member-1' });

      const result = await service.getByIdForUser(memberUser, 'biz-1');

      expect(result).toBeDefined();
    });

    it('should throw ForbiddenException for non-owner business owner', async () => {
      mockBusinessRepo.findOne.mockResolvedValue({
        ...mockBusiness,
        ownerId: 'other-user',
      });

      const ownerUser = { role: 'business_owner', id: 'user-1', email: 'owner@example.com' };

      await expect(service.getByIdForUser(ownerUser, 'biz-1')).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should throw ForbiddenException for non-member team user', async () => {
      mockTeamMembersRepo.findOne.mockResolvedValue(null);
      const memberUser = { role: 'team_member', id: 'member-1', email: 'member@example.com' };

      await expect(service.getByIdForUser(memberUser, 'biz-1')).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should throw NotFoundException when business not found', async () => {
      mockBusinessRepo.findOne.mockResolvedValue(null);

      await expect(service.getByIdForUser({}, 'biz-1')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('getById', () => {
    it('should return a business by id', async () => {
      const result = await service.getById('biz-1');

      expect(mockBusinessRepo.findOne).toHaveBeenCalledWith({ where: { id: 'biz-1' } });
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when business not found', async () => {
      mockBusinessRepo.findOne.mockResolvedValue(null);

      await expect(service.getById('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findOne', () => {
    it('should return a business', async () => {
      const result = await service.findOne('biz-1');

      expect(mockBusinessRepo.findOne).toHaveBeenCalledWith({ where: { id: 'biz-1' } });
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when not found', async () => {
      mockBusinessRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create a business', async () => {
      const createDto = { name: 'New Business', type: 'saas' };

      const result = await service.create(createDto as any);

      expect(mockBusinessRepo.create).toHaveBeenCalled();
      expect(mockBusinessRepo.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });

  describe('update', () => {
    it('should update a business', async () => {
      const updateDto = { name: 'Updated Business' };

      const result = await service.update('biz-1', updateDto as any);

      expect(mockBusinessRepo.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when not found', async () => {
      mockBusinessRepo.findOne.mockResolvedValue(null);

      await expect(service.update('999', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a business', async () => {
      const result = await service.remove('biz-1');

      expect(mockBusinessRepo.delete).toHaveBeenCalledWith({ id: 'biz-1' });
      expect(result.deleted).toBe(true);
    });

    it('should throw NotFoundException when not found', async () => {
      mockBusinessRepo.delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('listByOwner', () => {
    it('should return businesses for an owner', async () => {
      const result = await service.listByOwner('user-1');

      expect(mockBusinessRepo.find).toHaveBeenCalledWith({
        where: { ownerId: 'user-1' },
        order: { createdAt: 'DESC' },
      });
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('findOneForOwner', () => {
    it('should return business for owner', async () => {
      const result = await service.findOneForOwner('user-1', 'biz-1');

      expect(mockBusinessRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'biz-1', ownerId: 'user-1' },
      });
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when not found', async () => {
      mockBusinessRepo.findOne.mockResolvedValue(null);

      await expect(service.findOneForOwner('user-1', '999')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('createForOwner', () => {
    it('should create a business for owner', async () => {
      const createDto = { name: 'Owner Business', type: 'saas' };

      mockBusinessRepo.create.mockReturnValue({
        ...mockBusiness,
        ownerId: 'user-1',
        isProfileComplete: false,
      });

      const result = await service.createForOwner('user-1', createDto as any);

      expect(mockBusinessRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerId: 'user-1',
        })
      );
      expect(result).toBeDefined();
    });
  });

  describe('updateForOwner', () => {
    it('should update business for owner', async () => {
      const updateDto = { name: 'Updated Owner Business' };

      const result = await service.updateForOwner('user-1', 'biz-1', updateDto as any);

      expect(mockBusinessRepo.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException for non-existent business', async () => {
      mockBusinessRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateForOwner('user-1', '999', {})
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeForOwner', () => {
    it('should remove business for owner', async () => {
      mockBusinessRepo.findOne.mockResolvedValue(mockBusiness);

      const result = await service.removeForOwner('user-1', 'biz-1');

      expect(mockBusinessRepo.remove).toHaveBeenCalled();
      expect(result.ok).toBe(true);
    });

    it('should throw NotFoundException for non-existent business', async () => {
      mockBusinessRepo.findOne.mockResolvedValue(null);

      await expect(service.removeForOwner('user-1', '999')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('completeProfile', () => {
    it('should complete business profile', async () => {
      const completeDto = {
        name: 'Complete Business',
        taxId: 'TAX999',
        address: '456 Avenue',
        city: 'Sfax',
        country: 'Tunisia',
        phone: '98765432',
        email: 'complete@example.com',
        website: 'https://complete.com',
        currency: 'TND',
        fiscalYearStart: 'january',
        industry: 'tech',
        taxRate: 19,
      };

      mockBusinessRepo.findOne.mockResolvedValue(mockBusiness);

      const result = await service.completeProfile('biz-1', 'user-1', completeDto);

      expect(mockBusinessRepo.save).toHaveBeenCalled();
      expect(result.isProfileComplete).toBe(true);
    });

    it('should throw ForbiddenException when not owner', async () => {
      mockBusinessRepo.findOne.mockResolvedValue(mockBusiness);

      await expect(
        service.completeProfile('biz-1', 'other-user', {})
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException for invalid taxRate', async () => {
      mockBusinessRepo.findOne.mockResolvedValue(mockBusiness);

      await expect(
        service.completeProfile('biz-1', 'user-1', { taxRate: 'invalid' })
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when business not found', async () => {
      mockBusinessRepo.findOne.mockResolvedValue(null);

      await expect(
        service.completeProfile('999', 'user-1', {})
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeAll', () => {
    it('should clear all businesses', async () => {
      const result = await service.removeAll();

      expect(mockBusinessRepo.clear).toHaveBeenCalled();
      expect(result.deletedAll).toBe(true);
    });
  });
});
