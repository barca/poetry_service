import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Poem } from '../models';

@Entity({ name: 'home_poem' })
export class HomePoem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // The date for which this record applies (formatted as YYYY-MM-DD)
  @Column({ type: 'date' })
  view_date: string;

  // Ordering field (e.g., 1 or 2)
  @Column({ type: 'int' })
  order: number;

  // The poem-of-the-day
  @ManyToOne(() => Poem, { eager: true })
  @JoinColumn({ name: 'poem_id' })
  poem: Poem;

  // An optional quote for this poem-of-the-day
  @Column({ type: 'text', nullable: true })
  quote: string | null;
}
