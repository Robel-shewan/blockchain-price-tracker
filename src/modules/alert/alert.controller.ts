import { Controller, Post, Body } from '@nestjs/common';
import { AlertService } from './alert.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('alerts')
@Controller('alerts')
export class AlertController {
  constructor(private readonly alertService: AlertService) {}

  @Post()
  async createAlert(@Body() createAlertDto: CreateAlertDto) {
    return this.alertService.createAlert(createAlertDto);
  }
}
