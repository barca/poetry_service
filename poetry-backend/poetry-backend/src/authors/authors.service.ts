import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Author, User } from 'src/models';

@Injectable()
export class AuthorsService {
  constructor(
    @InjectRepository(Author)
    private readonly authorsRepository: Repository<Author>,
  ) { }

  // Other standard methods (findAll, findOne, create, update, delete) would go here.

  /**
   * Toggle the like status for an author.
   * @param authorId - The ID of the author.
   * @param userId - The ID of the user toggling the like.
   * @returns An object with the updated like status and the current count of likes.
   */
  async toggleLike(
    authorId: string,
    userId: string,
  ): Promise<{ liked: boolean; likesCount: number }> {
    // Load the author with its likedByUsers relation.
    const author = await this.authorsRepository.findOne({
      where: { id: authorId },
      relations: ['likedByUsers'],
    });
    if (!author) {
      throw new NotFoundException(`Author with id "${authorId}" not found`);
    }
    // Retrieve the full user entity.
    const userRepository = this.authorsRepository.manager.getRepository(User);
    const user = await userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with id "${userId}" not found`);
    }

    let liked: boolean;
    const index = author.likedByUsers.findIndex((u) => u.id === userId);
    if (index !== -1) {
      // If the user already likes the author, remove the like.
      author.likedByUsers.splice(index, 1);
      liked = false;
    } else {
      // Otherwise, add the user to the list of users who like the author.
      author.likedByUsers.push(user);
      liked = true;
    }
    await this.authorsRepository.save(author);
    return { liked, likesCount: author.likedByUsers.length };
  }

  /**
   * Get combined author and user information.
   * This returns the author with their poems, a flag indicating if the user has liked the author,
   * and a list of the IDs for the poems (by that author) that the user has read.
   * @param authorId - The ID of the author.
   * @param userId - The ID of the user.
   */
  async getAuthorForUser(
    authorId: string,
    userId: string,
  ): Promise<{ author: Author; likedByUser: boolean; readPoems: string[] }> {
    // Load the author including the poems they have created and the users who like them.
    const author = await this.authorsRepository.findOne({
      where: { id: authorId },
      relations: ['poems', 'likedByUsers'],
    });
    if (!author) {
      throw new NotFoundException(`Author with id "${authorId}" not found`);
    }

    // Load the user including the UserReadPoem join entities.
    const userRepository = this.authorsRepository.manager.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: userId },
      relations: ['userReadPoems'], // updated relation using the explicit join table
    });
    if (!user) {
      throw new NotFoundException(`User with id "${userId}" not found`);
    }

    // Determine whether the user has liked the author.
    const likedByUser = author.likedByUsers.some((u) => u.id === userId);

    // Determine which of the author's poems have been read by the user.
    // user.userReadPoems is an array of join entities that each have a 'poem' property.
    const readPoems = author.poems
      .filter((poem) =>
        user.userReadPoems.some((urp) => urp.poem.id === poem.id),
      )
      .map((poem) => poem.id);

    return { author, likedByUser, readPoems };
  }
}
