import { Test, TestingModule } from '@nestjs/testing';
import { DoctorSchedulesService } from './doctor-schedules.service';

describe('DoctorSchedulesService', () => {
  let service: DoctorSchedulesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DoctorSchedulesService],
    }).compile();

    service = module.get<DoctorSchedulesService>(DoctorSchedulesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
