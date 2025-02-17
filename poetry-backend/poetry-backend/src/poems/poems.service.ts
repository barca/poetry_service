// src/poems/poems.service.ts
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Poem } from '../models';

@Injectable()
export class PoemsService {
  constructor(
    @InjectRepository(Poem)
    private poemsRepository: Repository<Poem>,
  ) {}

  findAll(): Promise<Poem[]> {
    return this.poemsRepository.find({ relations: ['author'] });
  }

  findOne(id: string): Promise<Poem | null> {
    return this.poemsRepository.findOne({
      where: { id },
      relations: ['author'],
    });
  }

  create(poemData: Partial<Poem>): Promise<Poem> {
    const newPoem = this.poemsRepository.create(poemData);
    return this.poemsRepository.save(newPoem);
  }

  async update(id: string, poemData: Partial<Poem>): Promise<Poem | null> {
    await this.poemsRepository.update(id, poemData);
    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    await this.poemsRepository.delete(id);
  }
}
