import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HomePoem } from './home-poem.entity';
import { HomeFeaturedLibrary } from './home-featured-library.entity';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';
import { User } from '../models';

@Module({
  imports: [TypeOrmModule.forFeature([HomePoem, HomeFeaturedLibrary, User])],
  controllers: [HomeController],
  providers: [HomeService],
})
export class HomeModule {}
