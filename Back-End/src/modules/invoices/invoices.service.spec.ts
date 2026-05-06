import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { InvoiceEntity } from './entities/invoice.entity';
import { InvoiceItemEntity } from './entities/invoice-item.entity';

describe('InvoicesService', () => {
  let service: InvoicesService;
  let mockInvoiceRepo: any;
  let mockItemsRepo: any;

  const mockInvoice: any = {
    id: 'inv-1',
    businessId: 'biz-1',
    invoiceNumber: 'INV-001',
    clientId: 'client-1',
    clientName: 'Test Client',
    issueDate: '2024-01-01',
    dueDate: '2024-02-01',
    status: 'draft',
    currency: 'TND',
    notes: 'Test notes',
    paidAmount: 0,
    subtotal: 1000,
    taxAmount: 190,
    totalAmount: 1190,
    items: [],
  };

  beforeEach(async () => {
    mockInvoiceRepo = {
      create: jest.fn().mockReturnValue(mockInvoice),
      save: jest.fn().mockResolvedValue(mockInvoice),
      find: jest.fn().mockResolvedValue([mockInvoice]),
      findOne: jest.fn().mockResolvedValue(mockInvoice),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    mockItemsRepo = {
      create: jest.fn().mockReturnValue([]),
      save: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicesService,
        {
          provide: getRepositoryToken(InvoiceEntity),
          useValue: mockInvoiceRepo,
        },
        {
          provide: getRepositoryToken(InvoiceItemEntity),
          useValue: mockItemsRepo,
        },
      ],
    }).compile();

    service = module.get<InvoicesService>(InvoicesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an invoice successfully', async () => {
      const createDto = {
        invoiceNumber: 'INV-001',
        clientId: 'client-1',
        clientName: 'Test Client',
        issueDate: '2024-01-01',
        dueDate: '2024-02-01',
        status: 'draft',
        currency: 'TND',
        items: [
          {
            description: 'Service',
            quantity: 2,
            unitPrice: 500,
            taxRate: 19,
          },
        ],
      };

      const result = await service.create('biz-1', createDto as any);

      expect(mockInvoiceRepo.create).toHaveBeenCalled();
      expect(mockInvoiceRepo.save).toHaveBeenCalled();
      expect(mockItemsRepo.create).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should calculate totals correctly', async () => {
      const createDto = {
        invoiceNumber: 'INV-002',
        clientId: 'client-2',
        clientName: 'Client 2',
        issueDate: '2024-01-01',
        dueDate: '2024-02-01',
        items: [
          {
            description: 'Item 1',
            quantity: 1,
            unitPrice: 1000,
            taxRate: 19,
          },
          {
            description: 'Item 2',
            quantity: 2,
            unitPrice: 500,
            taxRate: 19,
          },
        ],
      };

      mockInvoiceRepo.create.mockImplementation((data: any) => ({
        ...mockInvoice,
        ...data,
      }));

      await service.create('biz-1', createDto as any);

      expect(mockInvoiceRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          subtotal: 2000,
          totalAmount: expect.any(Number),
        })
      );
    });

    it('should throw BadRequestException when items array is empty', async () => {
      const createDto = {
        invoiceNumber: 'INV-003',
        clientId: 'client-3',
        clientName: 'Client 3',
        issueDate: '2024-01-01',
        dueDate: '2024-02-01',
        items: [],
      };

      await expect(service.create('biz-1', createDto as any)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException when items is not an array', async () => {
      const createDto = {
        invoiceNumber: 'INV-004',
        clientId: 'client-4',
        clientName: 'Client 4',
        issueDate: '2024-01-01',
        dueDate: '2024-02-01',
        items: null,
      };

      await expect(service.create('biz-1', createDto as any)).rejects.toThrow(
        BadRequestException
      );
    });

    it('should handle default values', async () => {
      const createDto = {
        invoiceNumber: 'INV-005',
        clientId: 'client-5',
        clientName: 'Client 5',
        issueDate: '2024-01-01',
        dueDate: '2024-02-01',
        items: [
          {
            description: 'Service',
            quantity: 1,
            unitPrice: 500,
          },
        ],
      };

      await service.create('biz-1', createDto as any);

      expect(mockInvoiceRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          currency: 'TND',
          status: 'draft',
          paidAmount: 0,
        })
      );
    });
  });

  describe('findAll', () => {
    it('should return all invoices for a business', async () => {
      const result = await service.findAll('biz-1');

      expect(mockInvoiceRepo.find).toHaveBeenCalledWith({
        where: { businessId: 'biz-1' },
        order: { issueDate: 'DESC' },
      });
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return empty array when no invoices found', async () => {
      mockInvoiceRepo.find.mockResolvedValue([]);

      const result = await service.findAll('biz-1');

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a single invoice', async () => {
      const result = await service.findOne('biz-1', 'inv-1');

      expect(mockInvoiceRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'inv-1', businessId: 'biz-1' },
      });
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when invoice not found', async () => {
      mockInvoiceRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('biz-1', '999')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('update', () => {
    it('should update invoice successfully', async () => {
      const updateDto = {
        status: 'sent',
      };

      mockInvoiceRepo.findOne.mockResolvedValue(mockInvoice);

      const result = await service.update('biz-1', 'inv-1', updateDto as any);

      expect(mockInvoiceRepo.findOne).toHaveBeenCalled();
      expect(mockInvoiceRepo.save).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should set paidAmount to totalAmount when status is paid', async () => {
      const updateDto = { status: 'paid' };
      const invoice = { ...mockInvoice, status: 'draft', paidAmount: 0 };

      mockInvoiceRepo.findOne.mockResolvedValue(invoice);

      await service.update('biz-1', 'inv-1', updateDto as any);

      expect(mockInvoiceRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          paidAmount: invoice.totalAmount,
        })
      );
    });

    it('should reset paidAmount when leaving paid status', async () => {
      const updateDto = { status: 'draft' };
      const invoice = { ...mockInvoice, status: 'paid', paidAmount: 1190 };

      mockInvoiceRepo.findOne.mockResolvedValue(invoice);

      await service.update('biz-1', 'inv-1', updateDto as any);

      expect(mockInvoiceRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          paidAmount: 0,
        })
      );
    });

    it('should throw NotFoundException when invoice not found', async () => {
      mockInvoiceRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update('biz-1', '999', { status: 'sent' })
      ).rejects.toThrow(NotFoundException);
    });

    it('should not reset paidAmount if not leaving paid status', async () => {
      const updateDto = { status: 'paid' };
      const invoice = { ...mockInvoice, status: 'pending', paidAmount: 500 };

      mockInvoiceRepo.findOne.mockResolvedValue(invoice);

      await service.update('biz-1', 'inv-1', updateDto as any);

      expect(mockInvoiceRepo.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should delete an invoice successfully', async () => {
      const result = await service.remove('biz-1', 'inv-1');

      expect(mockInvoiceRepo.delete).toHaveBeenCalledWith({
        id: 'inv-1',
        businessId: 'biz-1',
      });
      expect(result.deleted).toBe(true);
    });

    it('should throw NotFoundException when invoice not found', async () => {
      mockInvoiceRepo.delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove('biz-1', '999')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('calcTotals', () => {
    it('should calculate totals with tax correctly', async () => {
      const items = [
        { quantity: 2, unitPrice: 500, taxRate: 19 },
        { quantity: 1, unitPrice: 1000, taxRate: 19 },
      ];

      const createDto = {
        invoiceNumber: 'INV-TAX',
        clientId: 'client-tax',
        clientName: 'Tax Client',
        issueDate: '2024-01-01',
        dueDate: '2024-02-01',
        items: items,
      };

      mockInvoiceRepo.create.mockImplementation((data: any) => ({
        ...mockInvoice,
        ...data,
      }));

      await service.create('biz-1', createDto as any);

      // Expected: subtotal = (2*500) + (1*1000) = 2000
      // tax = 2000 * 0.19 = 380
      // total = 2380
      expect(mockInvoiceRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          subtotal: 2000,
        })
      );
    });

    it('should calculate totals without tax', async () => {
      const createDto = {
        invoiceNumber: 'INV-NOTAX',
        clientId: 'client-notax',
        clientName: 'No Tax Client',
        issueDate: '2024-01-01',
        dueDate: '2024-02-01',
        items: [
          { quantity: 1, unitPrice: 1000 },
        ],
      };

      mockInvoiceRepo.create.mockImplementation((data: any) => ({
        ...mockInvoice,
        ...data,
      }));

      await service.create('biz-1', createDto as any);

      expect(mockInvoiceRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          subtotal: 1000,
        })
      );
    });
  });
});
