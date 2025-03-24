import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinColumn,
  JoinTable,
} from 'typeorm';

//
// AUTHOR ENTITY
//
@Entity()
export class Author {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text', { nullable: true })
  image_url: string;

  @Column('text', { nullable: true })
  biography: string;

  @Column({ nullable: true })
  date_of_birth: Date;

  @Column({ nullable: true })
  date_of_death: Date;

  @Column({ nullable: true })
  place_of_birth: string;

  @Column({ nullable: true })
  place_of_residence: string;

  @Column('simple-array', { nullable: true })
  tags: string[];

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  // One author can write many poems.
  @OneToMany(() => Poem, (poem) => poem.author)
  poems: Poem[];

  // Many users can like an author.
  @ManyToMany(() => User, (user) => user.likedAuthors)
  likedByUsers: User[];
}

//
// POEM ENTITY
//
@Entity()
export class Poem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  title: string;

  @Column('text', { nullable: true })
  text: string;

  @Column('text', { nullable: true })
  image_url: string;

  @Column({ type: 'date', nullable: true })
  written_date: Date;

  @Column({ type: 'numeric', nullable: true })
  rating: number;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @Column('simple-array', { nullable: true })
  tags: string[];

  // Many poems are written by one author.
  @ManyToOne(() => Author, (author) => author.poems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author: Author;

  // A poem can have many comments.
  @OneToMany(() => Comment, (comment) => comment.poem)
  comments: Comment[];

  // Instead of an implicit many-to-many for likes, we use an explicit relation:
  @OneToMany(() => UserLikedPoem, (ulp) => ulp.poem)
  userLikedPoems: UserLikedPoem[];

  // Similarly, for tracking views:
  @OneToMany(() => UserReadPoem, (urp) => urp.poem)
  userReadPoems: UserReadPoem[];

  // Libraries that include this poem.
  @ManyToMany(() => Library, (library) => library.poems)
  libraries: Library[];
}

//
// USER ENTITY
//
@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  // A user can write many comments.
  @OneToMany(() => Comment, (comment) => comment.user)
  comments: Comment[];

  // A user can create many libraries.
  @OneToMany(() => Library, (library) => library.created_by)
  libraries: Library[];

  // Instead of the implicit many-to-many, we define explicit relations for likes and reads:

  // User's liked poems (with timestamp)
  @OneToMany(() => UserLikedPoem, (ulp) => ulp.user)
  userLikedPoems: UserLikedPoem[];

  // User's liked authors (kept as many-to-many because no extra info is required)
  @ManyToMany(() => Author, (author) => author.likedByUsers)
  @JoinTable({
    name: 'user_liked_authors',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'author_id', referencedColumnName: 'id' },
  })
  likedAuthors: Author[];

  // User's liked comments.
  @ManyToMany(() => Comment, (comment) => comment.likedByUsers)
  @JoinTable({
    name: 'user_liked_comments',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'comment_id', referencedColumnName: 'id' },
  })
  likedComments: Comment[];

  // User's read poems (with timestamp)
  @OneToMany(() => UserReadPoem, (urp) => urp.user)
  userReadPoems: UserReadPoem[];
}

//
// LIBRARY ENTITY
//
@Entity()
export class Library {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column('text', { nullable: true })
  image_url: string;

  @CreateDateColumn({ type: 'timestamp' })
  updated: Date;

  // The user who created this library.
  @ManyToOne(() => User, (user) => user.libraries, { onDelete: 'CASCADE' })
  created_by: User;

  // A library can contain many poems.
  @ManyToMany(() => Poem, (poem) => poem.libraries)
  @JoinTable({
    name: 'library_poems',
    joinColumn: { name: 'library_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'poem_id', referencedColumnName: 'id' },
  })
  poems: Poem[];
}

//
// COMMENT ENTITY
//
@Entity()
export class Comment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  text: string;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  // The user who wrote the comment.
  @ManyToOne(() => User, (user) => user.comments, { onDelete: 'CASCADE' })
  user: User;

  // The poem this comment is associated with. When a poem is deleted, its comments will be removed.
  @ManyToOne(() => Poem, (poem) => poem.comments, { onDelete: 'CASCADE' })
  poem: Poem;

  // Users who have liked this comment.
  @ManyToMany(() => User, (user) => user.likedComments)
  likedByUsers: User[];
}

//
// NEW ENTITY: USER LIKED POEM
//
@Entity({ name: 'user_liked_poem' })
export class UserLikedPoem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // The user who liked the poem.
  @ManyToOne(() => User, (user) => user.userLikedPoems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // The poem that was liked.
  @ManyToOne(() => Poem, (poem) => poem.userLikedPoems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'poem_id' })
  poem: Poem;

  // When the like was recorded.
  @CreateDateColumn({ type: 'timestamp' })
  liked_at: Date;
}

//
// NEW ENTITY: USER READ POEM
//
@Entity({ name: 'user_read_poem' })
export class UserReadPoem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // The user who viewed/read the poem.
  @ManyToOne(() => User, (user) => user.userReadPoems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // The poem that was viewed.
  @ManyToOne(() => Poem, (poem) => poem.userReadPoems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'poem_id' })
  poem: Poem;

  // When the view was recorded.
  @CreateDateColumn({ type: 'timestamp' })
  viewed_at: Date;
}
