// src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthorsModule } from './authors/authors.module';
import { PoemsModule } from './poems/poems.module';
import { LibrariesModule } from './libraries/libraries.module';
import { CommentsModule } from './comments/comments.module';
import { Author, Poem, User, Library, Comment } from './models';
import { HomeFeaturedLibrary } from './home/home-featured-library.entity';
import { HomePoem } from './home/home-poem.entity';
import { HomeModule } from './home/home.module';

@Module({
  imports: [
    // Configure TypeORM connection (adjust credentials as needed)
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'your_username',
      password: 'your_password',
      database: 'poetry_app',
      entities: [
        Author,
        Poem,
        User,
        Library,
        Comment,
        HomeFeaturedLibrary,
        HomePoem,
      ],
      synchronize: true, // Only for development! Use migrations in production.
    }),
    AuthorsModule,
    PoemsModule,
    LibrariesModule,
    CommentsModule,
    HomeModule,
  ],
})
export class AppModule {}
