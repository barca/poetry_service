// src/libraries/libraries.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Library } from 'src/models';
import { LibrariesController } from './libraries.controller';
import { LibrariesService } from './libraries.service';

@Module({
  imports: [TypeOrmModule.forFeature([Library])],
  controllers: [LibrariesController],
  providers: [LibrariesService],
})
export class LibrariesModule { }
