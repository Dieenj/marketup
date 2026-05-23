import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('stats/:shopId')
  getStats(@GetUser('id') userId: string, @Param('shopId') shopId: string) {
    return this.dashboardService.getStats(userId, shopId);
  }

  @Get('top-products/:shopId')
  getTopProducts(
    @GetUser('id') userId: string,
    @Param('shopId') shopId: string,
  ) {
    return this.dashboardService.getTopProducts(userId, shopId);
  }
}
