// src/poems/poems.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PoemsController } from './poems.controller';
import { PoemsService } from './poems.service';
import { Poem } from '../models';

@Module({
  imports: [TypeOrmModule.forFeature([Poem])],
  controllers: [PoemsController],
  providers: [PoemsService],
})
export class PoemsModule {}
