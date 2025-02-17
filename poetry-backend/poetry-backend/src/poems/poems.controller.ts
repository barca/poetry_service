// src/poems/poems.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { PoemsService } from './poems.service';
import { Poem } from '../models';

@Controller('poems')
export class PoemsController {
  constructor(private readonly poemsService: PoemsService) {}

  @Get()
  async findAll(): Promise<Poem[]> {
    return this.poemsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Poem | null> {
    return this.poemsService.findOne(id);
  }

  @Post()
  async create(@Body() poemData: Partial<Poem>): Promise<Poem> {
    return this.poemsService.create(poemData);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() poemData: Partial<Poem>,
  ): Promise<Poem | null> {
    return this.poemsService.update(id, poemData);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    return this.poemsService.delete(id);
  }
}
