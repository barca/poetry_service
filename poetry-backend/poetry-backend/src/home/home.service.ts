// src/home/home.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HomePoem } from './home-poem.entity';
import { HomeFeaturedLibrary } from './home-featured-library.entity';
import { Author, Poem, Library, User } from '../models';

export interface HomeResponse {
  staticView: {
    poemsOfTheDay: Array<{ poem: Poem; quote: string | null }>;
    featuredLibraries: Library[];
  };
  dynamicView: {
    recentlyReadPoems: Array<Poem & { userLiked: boolean; userRead: boolean }>;
    recentlyReadAuthors: Array<Author & { userLiked: boolean }>;
  };
}

@Injectable()
export class HomeService {
  constructor(
    @InjectRepository(HomePoem)
    private readonly homePoemRepository: Repository<HomePoem>,
    @InjectRepository(HomeFeaturedLibrary)
    private readonly homeFeaturedLibraryRepository: Repository<HomeFeaturedLibrary>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getHomeView(userId: string, viewDate?: string): Promise<HomeResponse> {
    // Default to today's date (formatted as YYYY-MM-DD)
    const today = viewDate || new Date().toISOString().split('T')[0];

    // Fetch the static home view content for the given date.
    const homePoems = await this.homePoemRepository.find({
      where: { view_date: today },
      order: { order: 'ASC' },
    });
    if (homePoems.length === 0) {
      throw new NotFoundException(`Home poems not set for date ${today}`);
    }

    const homeLibraries = await this.homeFeaturedLibraryRepository.find({
      where: { view_date: today },
      order: { order: 'ASC' },
    });
    if (homeLibraries.length === 0) {
      throw new NotFoundException(
        `Featured libraries not set for date ${today}`,
      );
    }

    let poemsOfTheDay: { poem: Poem; quote: string | null }[] = [];

    try {
      poemsOfTheDay = homePoems.map((hp) => ({
        poem: hp.poem,
        quote: hp.quote,
      }));
    } catch (error) {
      console.error('Error processing homePoems:', error);
    }

    const featuredLibraries = homeLibraries.map((hl) => hl.library);

    // Fetch user-specific dynamic content.
    // We now include the explicit join entities for read and liked poems.
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['userReadPoems', 'userLikedPoems', 'likedAuthors'],
    });
    if (!user) {
      throw new NotFoundException(`User with id "${userId}" not found`);
    }

    // Sort the user's read poems by viewed_at descending and take up to 7.
    const sortedRead = user.userReadPoems.sort(
      (a, b) => b.viewed_at.getTime() - a.viewed_at.getTime(),
    );
    const recentReadJoins = sortedRead.slice(0, 7);

    // Map each join entity to the actual poem along with flags.
    const recentlyReadPoems = recentReadJoins.map((urp) => {
      const poem = urp.poem;
      // Check if a liked record exists for this poem.
      const userLiked = user.userLikedPoems.some(
        (ulp) => ulp.poem.id === poem.id,
      );
      return { ...poem, userLiked, userRead: true };
    });

    // Deduplicate authors from the user's read poems.
    const authorsMap = new Map<string, Author & { userLiked: boolean }>();
    user.userReadPoems.forEach((urp) => {
      const poem = urp.poem;
      if (poem.author) {
        const author = poem.author;
        if (!authorsMap.has(author.id)) {
          const userLiked = user.likedAuthors.some((a) => a.id === author.id);
          authorsMap.set(author.id, { ...author, userLiked });
        }
      }
    });
    const recentlyReadAuthors = Array.from(authorsMap.values());

    return {
      staticView: {
        poemsOfTheDay,
        featuredLibraries,
      },
      dynamicView: {
        recentlyReadPoems,
        recentlyReadAuthors,
      },
    };
  }
}
