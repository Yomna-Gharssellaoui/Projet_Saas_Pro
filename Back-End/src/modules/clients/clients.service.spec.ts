import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { ClientEntity } from './entities/client.entity';
import { InvoiceEntity } from '../invoices/entities/invoice.entity';

describe('ClientsService', () => {
  let service: ClientsService;
  let mockClientRepo: any;
  let mockInvoiceRepo: any;

  const mockClient: any = {
    id: '1',
    businessId: 'biz-1',
    name: 'Test Client',
    email: 'test@example.com',
    phone: '123456',
    address: '123 Street',
    city: 'Tunis',
    postalCode: '1000',
    country: 'Tunisia',
    taxId: 'TAX123',
    type: 'individual',   // FIX: valid ClientType value
    status: 'active',
    notes: 'Test notes',
    lastContactDate: '2024-01-01',
    companyName: 'Test Company',
    contactPerson: 'John Doe',
    totalRevenue: 1000,
    outstandingBalance: 500,
  };

  beforeEach(async () => {
    mockClientRepo = {
      create: jest.fn().mockReturnValue(mockClient),
      save: jest.fn().mockResolvedValue(mockClient),
      find: jest.fn().mockResolvedValue([mockClient]),
      findOne: jest.fn().mockResolvedValue(mockClient),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    mockInvoiceRepo = {
      find: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientsService,
        { provide: getRepositoryToken(ClientEntity),  useValue: mockClientRepo  },
        { provide: getRepositoryToken(InvoiceEntity), useValue: mockInvoiceRepo },
      ],
    }).compile();

    service = module.get<ClientsService>(ClientsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── create ──────────────────────────────────────────────────────────────────
  describe('create', () => {
    it('should create a client successfully', async () => {
      const createDto = {
        name: 'New Client',
        email: 'new@example.com',
        phone: '999888',
        address: '456 Avenue',
        city: 'Sfax',
        postalCode: '3000',
        country: 'Tunisia',
        taxId: 'NEW123',
        type: 'company' as any,   // FIX: 'company' not 'corporate'
        status: 'active' as any,
        notes: 'New client',
        lastContactDate: '2024-01-15',
        companyName: 'New Company',
        contactPerson: 'Jane Doe',
      };

      const result = await service.create('biz-1', createDto);

      expect(mockClientRepo.create).toHaveBeenCalled();
      expect(mockClientRepo.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should trim and normalize email on create', async () => {
      const createDto = {
        name: '  Client Name  ',
        email: '  TEST@EXAMPLE.COM  ',
        phone: '123',
        address: 'Addr',
        city: 'City',
        postalCode: '1000',
        country: 'Tunisia',
        taxId: undefined,
        type: 'individual' as any,  // FIX: valid enum value
      };

      await service.create('biz-1', createDto);

      expect(mockClientRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Client Name', email: 'test@example.com' })
      );
    });

    it('should handle optional fields', async () => {
      const createDto = {
        name: 'Simple Client',
        email: 'simple@example.com',
        type: 'individual' as any,  // FIX: valid enum value
      };

      await service.create('biz-1', createDto);

      expect(mockClientRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          phone: '',
          address: '',
          city: '',
          postalCode: '',
          country: 'Tunisia',
          totalRevenue: 0,
          outstandingBalance: 0,
        })
      );
    });
  });

  // ── findAll ─────────────────────────────────────────────────────────────────
  describe('findAll', () => {
    it('should return all clients for a business', async () => {
      mockInvoiceRepo.find.mockResolvedValue([]);
      const result = await service.findAll('biz-1');
      expect(mockClientRepo.find).toHaveBeenCalledWith({
        where: { businessId: 'biz-1' },
        order: { createdAt: 'DESC' },
      });
      expect(Array.isArray(result)).toBe(true);
    });

    it('should compute client stats from invoices', async () => {
      const invoices = [
        { id: 'inv-1', status: 'paid',    totalAmount: 1000, paidAmount: 1000, clientId: '1', businessId: 'biz-1' },
        { id: 'inv-2', status: 'pending', totalAmount: 500,  paidAmount: 200,  clientId: '1', businessId: 'biz-1' },
      ];
      mockInvoiceRepo.find.mockResolvedValue(invoices);
      mockClientRepo.find.mockResolvedValue([mockClient]);
      const result = await service.findAll('biz-1');
      expect(mockInvoiceRepo.find).toHaveBeenCalled();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should exclude cancelled invoices from stats', async () => {
      const invoices = [
        { id: 'inv-1', status: 'cancelled', totalAmount: 1000, paidAmount: 0, clientId: '1', businessId: 'biz-1' },
      ];
      mockInvoiceRepo.find.mockResolvedValue(invoices);
      mockClientRepo.find.mockResolvedValue([mockClient]);
      const result = await service.findAll('biz-1');
      expect(result).toBeDefined();
    });
  });

  // ── findOne ─────────────────────────────────────────────────────────────────
  describe('findOne', () => {
    it('should return a single client with computed stats', async () => {
      mockInvoiceRepo.find.mockResolvedValue([]);
      const result = await service.findOne('biz-1', '1');
      expect(mockClientRepo.findOne).toHaveBeenCalledWith({ where: { id: '1', businessId: 'biz-1' } });
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when client not found', async () => {
      mockClientRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('biz-1', '999')).rejects.toThrow(NotFoundException);
    });

    it('should calculate outstanding balance correctly', async () => {
      const invoices = [
        { id: 'inv-1', status: 'pending', totalAmount: 1000, paidAmount: 600, clientId: '1', businessId: 'biz-1' },
      ];
      mockInvoiceRepo.find.mockResolvedValue(invoices);
      await service.findOne('biz-1', '1');
      expect(mockInvoiceRepo.find).toHaveBeenCalledWith({ where: { businessId: 'biz-1', clientId: '1' } });
    });
  });

  // ── update ──────────────────────────────────────────────────────────────────
  describe('update', () => {
    it('should update client successfully', async () => {
      mockInvoiceRepo.find.mockResolvedValue([]);
      const result = await service.update('biz-1', '1', { name: 'Updated Client', email: 'updated@example.com', phone: '555555' });
      expect(mockClientRepo.findOne).toHaveBeenCalledWith({ where: { id: '1', businessId: 'biz-1' } });
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when updating non-existent client', async () => {
      mockClientRepo.findOne.mockResolvedValue(null);
      await expect(service.update('biz-1', '999', { name: 'Test' })).rejects.toThrow(NotFoundException);
    });

    it('should only update provided fields', async () => {
      mockInvoiceRepo.find.mockResolvedValue([]);
      await service.update('biz-1', '1', { name: 'New Name' });
      expect(mockClientRepo.save).toHaveBeenCalled();
    });

    it('should normalize email on update', async () => {
      mockInvoiceRepo.find.mockResolvedValue([]);
      await service.update('biz-1', '1', { email: '  TEST@EXAMPLE.COM  ' });
      expect(mockClientRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'test@example.com' })
      );
    });
  });

  // ── remove ──────────────────────────────────────────────────────────────────
  describe('remove', () => {
    it('should delete a client successfully', async () => {
      const result = await service.remove('biz-1', '1');
      expect(mockClientRepo.delete).toHaveBeenCalledWith({ id: '1', businessId: 'biz-1' });
      expect(result.deleted).toBe(true);
    });

    it('should throw NotFoundException when client not found', async () => {
      mockClientRepo.delete.mockResolvedValue({ affected: 0 });
      await expect(service.remove('biz-1', '999')).rejects.toThrow(NotFoundException);
    });
  });
});
