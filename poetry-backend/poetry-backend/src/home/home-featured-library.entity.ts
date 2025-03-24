import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Library } from 'src/models';

@Entity({ name: 'home_featured_library' })
export class HomeFeaturedLibrary {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // The date for which this record applies (formatted as YYYY-MM-DD)
  @Column({ type: 'date' })
  view_date: string;

  // Ordering field (1 to 4)
  @Column({ type: 'int' })
  order: number;

  @ManyToOne(() => Library, { eager: true })
  @JoinColumn({ name: 'library_id' })
  library: Library;
}
