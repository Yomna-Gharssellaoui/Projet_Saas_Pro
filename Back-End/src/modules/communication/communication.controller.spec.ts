import { Test, TestingModule } from '@nestjs/testing';
import { CommunicationController, CommunicationService } from './communication.service-controller';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

describe('CommunicationController', () => {
  let controller: CommunicationController;

  beforeEach(async () => {
    const mockService = {
      getChannels: jest.fn(),
      createChannel: jest.fn(),
      deleteChannel: jest.fn(),
      addMember: jest.fn(),
      searchMessages: jest.fn(),
      togglePin: jest.fn(),
      getPinnedMessages: jest.fn(),
      summarizeChannel: jest.fn(),
      getMessages: jest.fn(),
      getTodos: jest.fn(),
      addTodo: jest.fn(),
      toggleTodo: jest.fn(),
      deleteTodo: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommunicationController],
      providers: [
        {
          provide: CommunicationService,
          useValue: mockService,
        },
      ],
    })
    .overrideGuard(JwtAuthGuard)
    .useValue({ canActivate: () => true })
    .compile();

    controller = module.get<CommunicationController>(CommunicationController);
  });

  it('devrait être défini', () => {
    expect(controller).toBeDefined();
  });
});
