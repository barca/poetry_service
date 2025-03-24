import { DataSourceOptions } from 'typeorm';
import { Author, Poem, User, Library, Comment, UserLikedPoem, UserReadPoem } from 'src/models';

import { HomeFeaturedLibrary } from './home/home-featured-library.entity';
import { HomePoem } from './home/home-poem.entity';
import * as dotenv from 'dotenv';
dotenv.config();
export const typeOrmConfig: DataSourceOptions = {
    type: 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT ? +process.env.POSTGRES_PORT : 5432,
    username: process.env.POSTGRES_USER || 'tyler',
    password: process.env.POSTGRES_PASSWORD || 'your_password',
    database: process.env.POSTGRES_DB || 'tyler',
    entities: [Author, Poem, User, Library, Comment, UserLikedPoem, UserReadPoem, HomeFeaturedLibrary, HomePoem],
    synchronize: true,
    schema: 'public',
};
