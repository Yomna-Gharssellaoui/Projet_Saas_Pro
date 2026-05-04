import { Test, TestingModule } from '@nestjs/testing';
import { SecurityQuestionsService } from './security-questions.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SecurityQuestion } from './security-questions.entity';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

describe('SecurityQuestionsService', () => {
  let service: SecurityQuestionsService;

  beforeEach(async () => {
    const mockRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SecurityQuestionsService,
        {
          provide: getRepositoryToken(SecurityQuestion),
          useValue: mockRepo,
        },
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            updatePassword: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SecurityQuestionsService>(SecurityQuestionsService);
  });

  it('devrait être défini', () => {
    expect(service).toBeDefined();
  });
});
