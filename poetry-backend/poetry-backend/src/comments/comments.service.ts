// src/comments/comments.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment, User, Poem } from '../models';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentsRepository: Repository<Comment>,
  ) {}

  async findAll(): Promise<Comment[]> {
    return this.commentsRepository.find({
      relations: ['user', 'poem', 'likedByUsers'],
    });
  }

  async findOne(id: string): Promise<Comment | null> {
    const comment = await this.commentsRepository.findOne({
      where: { id },
      relations: ['user', 'poem', 'likedByUsers'],
    });
    return comment || null;
  }

  /**
   * Create a comment given a userId, poemId, and text.
   * This method fetches the full User and Poem entities.
   */
  async createComment(
    userId: string,
    poemId: string,
    text: string,
  ): Promise<Comment> {
    // Get the user entity.
    const userRepository = this.commentsRepository.manager.getRepository(User);
    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with id "${userId}" not found`);
    }

    // Get the poem entity.
    const poemRepository = this.commentsRepository.manager.getRepository(Poem);
    const poem = await poemRepository.findOne({ where: { id: poemId } });
    if (!poem) {
      throw new NotFoundException(`Poem with id "${poemId}" not found`);
    }

    const comment = this.commentsRepository.create({ text, user, poem });
    return this.commentsRepository.save(comment);
  }

  async update(
    id: string,
    commentData: Partial<Comment>,
  ): Promise<Comment | null> {
    const existingComment = await this.commentsRepository.findOne({
      where: { id },
    });
    if (!existingComment) {
      return null;
    }
    await this.commentsRepository.update(id, commentData);
    return this.commentsRepository.findOne({
      where: { id },
      relations: ['user', 'poem', 'likedByUsers'],
    });
  }

  async delete(id: string): Promise<void> {
    await this.commentsRepository.delete(id);
  }

  /**
   * Toggle a like on a comment.
   * @param commentId The ID of the comment.
   * @param userId The ID of the user toggling the like.
   * @returns An object with the new "liked" status and current likes count.
   */
  async toggleLike(
    commentId: string,
    userId: string,
  ): Promise<{ liked: boolean; likesCount: number }> {
    // Load the comment including its likedByUsers relation.
    const comment = await this.commentsRepository.findOne({
      where: { id: commentId },
      relations: ['likedByUsers'],
    });
    if (!comment) {
      throw new NotFoundException(`Comment with id "${commentId}" not found`);
    }

    // Get the user from the database.
    const userRepository = this.commentsRepository.manager.getRepository(User);
    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with id "${userId}" not found`);
    }

    let liked: boolean;
    const index = comment.likedByUsers.findIndex((u) => u.id === userId);
    if (index !== -1) {
      // User already liked: remove the like.
      comment.likedByUsers.splice(index, 1);
      liked = false;
    } else {
      // Otherwise, add the like.
      comment.likedByUsers.push(user);
      liked = true;
    }
    await this.commentsRepository.save(comment);
    const likesCount = comment.likedByUsers.length;
    return { liked, likesCount };
  }

  /**
   * Find all comments for a given poem.
   * @param poemId The ID of the poem.
   * @returns An array of comments.
   */
  async findByPoem(poemId: string): Promise<Comment[]> {
    return this.commentsRepository.find({
      where: { poem: { id: poemId } },
      relations: ['likedByUsers', 'user', 'poem'],
    });
  }
}
