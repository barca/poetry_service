import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthorsModule } from './authors/authors.module';
import { PoemsModule } from './poems/poems.module';
import { LibrariesModule } from './libraries/libraries.module';
import { CommentsModule } from './comments/comments.module';
import { HomeModule } from './home/home.module';
import { typeOrmConfig } from './db_config';

@Module({
  imports: [
    // Use the shared TypeORM configuration
    TypeOrmModule.forRoot(typeOrmConfig),
    AuthorsModule,
    PoemsModule,
    LibrariesModule,
    CommentsModule,
    HomeModule,
  ],
})
export class AppModule { }
