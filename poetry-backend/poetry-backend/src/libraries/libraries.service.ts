// src/libraries/libraries.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Library, User, Author, Poem } from 'src/models';

export interface LibraryForUserResponse {
  library: Library;
  poems: Array<PoemWithFlags>;
  authors: Array<AuthorWithFlag>;
}

export interface PoemWithFlags {
  id: string;
  title: string;
  image_url?: string;
  written_date?: Date;
  rating?: number;
  created_at: Date;
  author: Author;
  userLiked: boolean;
  userRead: boolean;
}

export interface AuthorWithFlag extends Author {
  userLiked: boolean;
}

@Injectable()
export class LibrariesService {
  constructor(
    @InjectRepository(Library)
    private readonly librariesRepository: Repository<Library>,
  ) { }

  // Return all libraries, including basic relations.
  async findAll(): Promise<Library[]> {
    const libraries = await this.librariesRepository.find({
      relations: ['poems', 'poems.author'],
    });
    if (!libraries || !Array.isArray(libraries)) {
      throw new NotFoundException('No libraries found');
    }
    return libraries;
  }

  // Find a single library by its id.
  async findOne(id: string): Promise<Library> {
    const library = await this.librariesRepository.findOne({
      where: { id },
      relations: ['poems', 'poems.author'],
    });
    if (!library) {
      throw new NotFoundException(`Library with id "${id}" not found`);
    }
    return library;
  }

  // Create a new library.
  async create(libraryData: Partial<Library>): Promise<Library> {
    const library = this.librariesRepository.create(libraryData);
    return await this.librariesRepository.save(library);
  }

  // Update an existing library.
  async update(id: string, libraryData: Partial<Library>): Promise<Library> {
    const existingLibrary = await this.findOne(id);
    if (!existingLibrary) {
      throw new NotFoundException(`Library with id "${id}" not found`);
    }
    const updatedLibrary = Object.assign(existingLibrary, libraryData);
    return await this.librariesRepository.save(updatedLibrary);
  }

  // Delete a library by its id.
  async delete(id: string): Promise<void> {
    const library = await this.findOne(id);
    if (!library) {
      throw new NotFoundException(`Library with id "${id}" not found`);
    }
    await this.librariesRepository.delete(id);
  }

  // Get a library view for a user with additional flags on poems and authors.
  async getLibraryForUser(
    libraryId: string,
    userId: string,
  ): Promise<LibraryForUserResponse> {
    // Fetch the library with its poems and their authors.
    const library = await this.librariesRepository.findOne({
      where: { id: libraryId },
      relations: ['poems', 'poems.author'],
    });
    if (!library) {
      throw new NotFoundException(`Library with id "${libraryId}" not found`);
    }
    // Ensure we have a safe array of poems.
    const libraryPoems: Poem[] = Array.isArray(library.poems)
      ? library.poems
      : [];

    // Fetch the user with their explicit join entities for liked and read poems,
    // as well as the many-to-many relation for liked authors.
    const userRepository = this.librariesRepository.manager.getRepository(User);
    const user = await userRepository.findOne({
      where: { id: userId },
      relations: ['likedAuthors', 'userLikedPoems', 'userReadPoems'],
    });
    if (!user) {
      throw new NotFoundException(`User with id "${userId}" not found`);
    }

    // Annotate each poem in the library with user-specific flags.
    const poemsWithFlags: PoemWithFlags[] = libraryPoems.map((poem) => {
      // Use safe defaults for the join arrays.
      const likedJoins = user.userLikedPoems || [];
      const readJoins = user.userReadPoems || [];
      const userLiked = likedJoins.some(
        (ulp) => ulp && ulp.poem && ulp.poem.id === poem.id,
      );
      const userRead = readJoins.some(
        (urp) => urp && urp.poem && urp.poem.id === poem.id,
      );
      return { ...poem, userLiked, userRead };
    });

    // Build a deduplicated list of authors from the library's poems.
    const authorsMap = new Map<string, AuthorWithFlag>();
    for (const poem of libraryPoems) {
      if (poem.author && poem.author.id) {
        const author = poem.author;
        if (!authorsMap.has(author.id)) {
          const userLiked = (user.likedAuthors || []).some(
            (a) => a && a.id === author.id,
          );
          authorsMap.set(author.id, { ...author, userLiked });
        }
      }
    }
    const authors: AuthorWithFlag[] = Array.from(authorsMap.values());

    return { library, poems: poemsWithFlags, authors };
  }
}
