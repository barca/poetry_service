// src/comments/comments.controller.ts
import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { Comment } from '../models';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  /**
   * Toggle a like on a comment.
   * Request Body: { userId: string, commentId: string }
   */
  @Post('toggle-like')
  async toggleLike(
    @Body() body: { userId: string; commentId: string },
  ): Promise<{ liked: boolean; likesCount: number }> {
    const { userId, commentId } = body;
    return this.commentsService.toggleLike(commentId, userId);
  }

  /**
   * Create a comment.
   * Request Body: { userId: string, poemId: string, text: string }
   */
  @Post('create')
  async createComment(
    @Body() body: { userId: string; poemId: string; text: string },
  ): Promise<Comment> {
    const { userId, poemId, text } = body;
    return this.commentsService.createComment(userId, poemId, text);
  }

  /**
   * Get all comments for a given poem.
   * Query Parameter "userId" indicates which comments the user has liked.
   * Example: GET /comments/poem/123?userId=456
   */
  @Get('poem/:poemId')
  async getCommentsByPoem(
    @Param('poemId') poemId: string,
    @Query('userId') userId: string,
  ): Promise<Array<Comment & { likesCount: number; userLiked: boolean }>> {
    const comments = await this.commentsService.findByPoem(poemId);
    return comments.map((comment) => {
      const likesCount = comment.likedByUsers?.length || 0;
      const userLiked =
        comment.likedByUsers?.some((u) => u.id === userId) || false;
      return { ...comment, likesCount, userLiked };
    });
  }
}
