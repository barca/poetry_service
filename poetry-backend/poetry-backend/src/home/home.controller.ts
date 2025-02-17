import { Controller, Get, Query } from '@nestjs/common';
import { HomeService, HomeResponse } from './home.service';

@Controller('home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  /**
   * GET /home/view?userId=xxx&date=YYYY-MM-DD
   * If "date" is omitted, today's view is returned.
   */
  @Get('view')
  async getHomeView(
    @Query('userId') userId: string,
    @Query('date') date?: string,
  ): Promise<HomeResponse> {
    return this.homeService.getHomeView(userId, date);
  }
}
