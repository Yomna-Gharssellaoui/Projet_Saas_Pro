import { Test, TestingModule } from '@nestjs/testing';
import { CommunicationService } from './communication.service-controller';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ChannelEntity } from './channel.entity';
import { MessageEntity } from './message.entity';
import { TodoEntity } from './todo.entity';

describe('CommunicationService', () => {
  let service: CommunicationService;

  beforeEach(async () => {
    const mockRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommunicationService,
        {
          provide: getRepositoryToken(ChannelEntity),
          useValue: mockRepo,
        },
        {
          provide: getRepositoryToken(MessageEntity),
          useValue: mockRepo,
        },
        {
          provide: getRepositoryToken(TodoEntity),
          useValue: mockRepo,
        },
      ],
    }).compile();

    service = module.get<CommunicationService>(CommunicationService);
  });

  it('devrait être défini', () => {
    expect(service).toBeDefined();
  });
});
