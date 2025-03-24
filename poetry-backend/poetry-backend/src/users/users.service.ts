// src/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/models';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) { }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findOne(id: string): Promise<User | null> {
    const user = await this.usersRepository.findOne({ where: { id } });
    return user || null;
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.usersRepository.create(userData);
    return this.usersRepository.save(user);
  }

  async update(id: string, userData: Partial<User>): Promise<User | null> {
    const existingUser = await this.usersRepository.findOne({ where: { id } });
    if (!existingUser) {
      return null;
    }
    await this.usersRepository.update(id, userData);
    return await this.usersRepository.findOne({ where: { id } });
  }

  async delete(id: string): Promise<void> {
    await this.usersRepository.delete(id);
  }
}
