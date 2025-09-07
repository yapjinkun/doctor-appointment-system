import { Test, TestingModule } from '@nestjs/testing';
import { DoctorSchedulesController } from './doctor-schedules.controller';
import { DoctorSchedulesService } from './doctor-schedules.service';

describe('DoctorSchedulesController', () => {
  let controller: DoctorSchedulesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DoctorSchedulesController],
      providers: [DoctorSchedulesService],
    }).compile();

    controller = module.get<DoctorSchedulesController>(
      DoctorSchedulesController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
