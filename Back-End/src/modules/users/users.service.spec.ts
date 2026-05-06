import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { BusinessEntity } from '../businesses/entities/business.entity';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  role: 'business_owner',
  passwordHash: 'hashed',
  createdAt: new Date('2024-01-01'),
  status: 'active',
};

const mockBusiness = {
  id: 'biz-1',
  name: 'Test Business',
  email: 'biz@example.com',
  ownerId: 'user-1',
  status: 'active',
  plan: 'starter',
  city: 'Tunis',
  country: 'Tunisia',
  subscriptionStartDate: new Date('2024-01-01'),
  subscriptionEndDate: new Date('2025-01-01'),
  createdAt: new Date('2024-01-01'),
};

describe('UsersService', () => {
  let service: UsersService;
  let userRepo: jest.Mocked<Repository<UserEntity>>;
  let businessRepo: jest.Mocked<Repository<BusinessEntity>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(BusinessEntity),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepo = module.get(getRepositoryToken(UserEntity));
    businessRepo = module.get(getRepositoryToken(BusinessEntity));
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create and return a user', async () => {
      const dto = { email: 'new@example.com', name: 'New User' };
      userRepo.create.mockReturnValue(mockUser as any);
      userRepo.save.mockResolvedValue(mockUser as any);
      const result = await service.create(dto as any);
      expect(userRepo.create).toHaveBeenCalledWith(dto);
      expect(result).toHaveProperty('email', mockUser.email);
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      userRepo.find.mockResolvedValue([mockUser] as any);
      const result = await service.findAll();
      expect(result).toHaveLength(1);
    });

    it('should return empty array when no users', async () => {
      userRepo.find.mockResolvedValue([]);
      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      userRepo.findOne.mockResolvedValue(mockUser as any);
      const result = await service.findOne('user-1');
      expect(result).toHaveProperty('email', mockUser.email);
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update and return the user', async () => {
      const dto = { name: 'Updated Name' };
      userRepo.findOne.mockResolvedValue({ ...mockUser } as any);
      userRepo.save.mockResolvedValue({ ...mockUser, ...dto } as any);
      const result = await service.update('user-1', dto as any);
      expect(result).toHaveProperty('name', 'Updated Name');
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.update('nonexistent', {} as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a user and return success', async () => {
      userRepo.delete.mockResolvedValue({ affected: 1 } as any);
      const result = await service.remove('user-1');
      expect(result).toEqual({ deleted: true, id: 'user-1' });
    });

    it('should throw NotFoundException if user not found', async () => {
      userRepo.delete.mockResolvedValue({ affected: 0 } as any);
      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email trimmed and lowercased', async () => {
      userRepo.findOne.mockResolvedValue(mockUser as any);
      const result = await service.findByEmail('  TEST@Example.COM  ');
      expect(userRepo.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(result).toEqual(mockUser);
    });

    it('should return null if no user found', async () => {
      userRepo.findOne.mockResolvedValue(null);
      const result = await service.findByEmail('notfound@example.com');
      expect(result).toBeNull();
    });
  });

  describe('updatePassword', () => {
    it('should hash the password and call update', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('newhashedpassword');
      await service.updatePassword('user-1', 'newpassword');
      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword', 10);
      expect(userRepo.update).toHaveBeenCalledWith('user-1', { passwordHash: 'newhashedpassword' });
    });
  });

  describe('listBusinessOwners', () => {
    it('should return list of business owners with businesses', async () => {
      userRepo.find.mockResolvedValue([mockUser] as any);
      businessRepo.find.mockResolvedValue([mockBusiness] as any);
      const result = await service.listBusinessOwners();
      expect(result).toHaveLength(1);
      expect(result[0].businessCount).toBe(1);
    });

    it('should return empty array when no owners', async () => {
      userRepo.find.mockResolvedValue([]);
      const result = await service.listBusinessOwners();
      expect(result).toEqual([]);
      expect(businessRepo.find).not.toHaveBeenCalled();
    });

    it('should return daysRemaining as null when no subscription end date', async () => {
      userRepo.find.mockResolvedValue([mockUser] as any);
      businessRepo.find.mockResolvedValue([{ ...mockBusiness, subscriptionEndDate: null }] as any);
      const result = await service.listBusinessOwners();
      expect(result[0].daysRemaining).toBeNull();
    });
  });

  describe('getBusinessOwnerDetails', () => {
    it('should return owner details with businesses', async () => {
      userRepo.findOne.mockResolvedValue(mockUser as any);
      businessRepo.find.mockResolvedValue([mockBusiness] as any);
      const result = await service.getBusinessOwnerDetails('user-1');
      expect(result).toHaveProperty('id', 'user-1');
      expect(result.businesses).toHaveLength(1);
    });

    it('should throw NotFoundException if owner not found', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.getBusinessOwnerDetails('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should handle owner with no businesses', async () => {
      userRepo.findOne.mockResolvedValue(mockUser as any);
      businessRepo.find.mockResolvedValue([]);
      const result = await service.getBusinessOwnerDetails('user-1');
      expect(result.businessCount).toBe(0);
      expect(result.subscriptionPlan).toBeNull();
      expect(result.daysRemaining).toBeNull();
    });
  });

  describe('updateBusinessOwnerStatus', () => {
    it('should update owner and businesses to active', async () => {
      userRepo.findOne.mockResolvedValue({ ...mockUser } as any);
      userRepo.save.mockResolvedValue({ ...mockUser, status: 'active' } as any);
      businessRepo.find.mockResolvedValue([{ ...mockBusiness }] as any);
      businessRepo.save.mockResolvedValue([{ ...mockBusiness, status: 'active' }] as any);
      const result = await service.updateBusinessOwnerStatus('user-1', 'active');
      expect(result).toHaveProperty('status', 'active');
      expect(businessRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if owner not found', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.updateBusinessOwnerStatus('nonexistent', 'active')).rejects.toThrow(NotFoundException);
    });

    it('should not call businessRepo.save if no businesses', async () => {
      userRepo.findOne.mockResolvedValue({ ...mockUser } as any);
      userRepo.save.mockResolvedValue({ ...mockUser } as any);
      businessRepo.find.mockResolvedValue([]);
      await service.updateBusinessOwnerStatus('user-1', 'active');
      expect(businessRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('createBusinessOwnerWithBusiness', () => {
    const payload = {
      user: { email: 'owner@example.com', name: 'Owner', status: 'active' },
      business: {
        name: 'My Business', type: 'LLC', address: '123 Main St',
        city: 'Tunis', country: 'Tunisia', taxId: 'TN123',
        phone: '+21612345678', email: 'biz@example.com',
        currency: 'TND', fiscalYearStart: '2024-01-01',
        industry: 'Tech', taxRate: 19, plan: 'starter',
        subscriptionStartDate: '2024-01-01',
        subscriptionEndDate: '2025-01-01',
      },
    };

    it('should create a business owner with a business', async () => {
      userRepo.findOne.mockResolvedValue(null);
      userRepo.create.mockReturnValue(mockUser as any);
      userRepo.save.mockResolvedValue(mockUser as any);
      businessRepo.create.mockReturnValue(mockBusiness as any);
      businessRepo.save.mockResolvedValue(mockBusiness as any);
      const result = await service.createBusinessOwnerWithBusiness(payload as any);
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('business');
    });

    it('should throw BadRequestException if email already exists', async () => {
      userRepo.findOne.mockResolvedValue(mockUser as any);
      await expect(service.createBusinessOwnerWithBusiness(payload as any)).rejects.toThrow(BadRequestException);
    });

    it('should handle missing subscription dates', async () => {
      const payloadNoDates = {
        ...payload,
        business: { ...payload.business, subscriptionStartDate: undefined, subscriptionEndDate: undefined },
      };
      userRepo.findOne.mockResolvedValue(null);
      userRepo.create.mockReturnValue(mockUser as any);
      userRepo.save.mockResolvedValue(mockUser as any);
      businessRepo.create.mockReturnValue(mockBusiness as any);
      businessRepo.save.mockResolvedValue(mockBusiness as any);
      const result = await service.createBusinessOwnerWithBusiness(payloadNoDates as any);
      expect(result).toHaveProperty('business');
    });
  });
});
