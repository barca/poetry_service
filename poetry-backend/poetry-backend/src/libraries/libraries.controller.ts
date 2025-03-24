// src/libraries/libraries.controller.ts
import {
  Controller,
  Get,
  Param,
  Query,
  Delete,
  Body,
  Post,
  Put,
  NotFoundException,
} from '@nestjs/common';
import { LibrariesService, LibraryForUserResponse } from './libraries.service';
import { Library } from 'src/models';

@Controller('libraries')
export class LibrariesController {
  constructor(private readonly librariesService: LibrariesService) { }

  @Get()
  async findAll(): Promise<Library[]> {
    const libraries = await this.librariesService.findAll();
    if (!libraries || !Array.isArray(libraries)) {
      throw new NotFoundException('No libraries found');
    }
    return libraries;
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Library> {
    const library = await this.librariesService.findOne(id);
    if (!library) {
      throw new NotFoundException(`Library with id "${id}" not found`);
    }
    return library;
  }

  @Post()
  async create(@Body() libraryData: Partial<Library>): Promise<Library> {
    const newLibrary = await this.librariesService.create(libraryData);
    if (!newLibrary) {
      throw new NotFoundException('Failed to create library');
    }
    return newLibrary;
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() libraryData: Partial<Library>,
  ): Promise<Library> {
    const updatedLibrary = await this.librariesService.update(id, libraryData);
    if (!updatedLibrary) {
      throw new NotFoundException(`Library with id "${id}" not found`);
    }
    return updatedLibrary;
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    const library = await this.librariesService.findOne(id);
    if (!library) {
      throw new NotFoundException(`Library with id "${id}" not found`);
    }
    await this.librariesService.delete(id);
  }

  @Get('for-user/:libraryId')
  async getLibraryForUser(
    @Param('libraryId') libraryId: string,
    @Query('userId') userId: string,
  ): Promise<LibraryForUserResponse> {
    const response = await this.librariesService.getLibraryForUser(
      libraryId,
      userId,
    );
    if (!response) {
      throw new NotFoundException(
        `No library view found for libraryId: ${libraryId} and userId: ${userId}`,
      );
    }
    if (!response.library) {
      throw new NotFoundException(
        `Library not found in the response for libraryId: ${libraryId}`,
      );
    }
    if (!Array.isArray(response.poems)) {
      throw new NotFoundException('Poems data is not valid');
    }
    if (!Array.isArray(response.authors)) {
      throw new NotFoundException('Authors data is not valid');
    }
    return response;
  }
}
