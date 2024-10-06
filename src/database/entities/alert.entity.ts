import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class Alert {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  chain: string;

  @Column('decimal')
  targetPrice: number;

  @Column({ default: false })
  isTriggered: boolean;

  @Column()
  email: string;

  @CreateDateColumn()
  createdAt: Date;
}
