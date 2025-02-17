import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { AuthorsService } from './authors.service';
import { Author } from '../models';

@Controller('authors')
export class AuthorsController {
  constructor(private readonly authorsService: AuthorsService) {}

  // Other endpoints (findAll, findOne, create, update, delete) would be defined here.

  /**
   * Toggle the like status for an author.
   * POST /authors/toggle-like
   * Request Body: { userId: string, authorId: string }
   */
  @Post('toggle-like')
  async toggleLike(
    @Body() body: { userId: string; authorId: string },
  ): Promise<{ liked: boolean; likesCount: number }> {
    const { userId, authorId } = body;
    return this.authorsService.toggleLike(authorId, userId);
  }

  /**
   * Get combined author and user information.
   * GET /authors/for-user/:authorId?userId=xxx
   * Returns the author information, the list of poems created by the author,
   * whether the user has liked the author, and which of the author's poems the user has read.
   */
  @Get('for-user/:authorId')
  async getAuthorForUser(
    @Param('authorId') authorId: string,
    @Query('userId') userId: string,
  ): Promise<{ author: Author; likedByUser: boolean; readPoems: string[] }> {
    return this.authorsService.getAuthorForUser(authorId, userId);
  }
}
