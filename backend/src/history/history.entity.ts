import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('analysis_history')
export class AnalysisHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'sql_summary', type: 'text' })
  sqlSummary: string;

  @Column({ name: 'sql_full', type: 'text', nullable: true })
  sqlFull: string;

  @Column({ type: 'varchar', length: 32 })
  dialect: string;

  @Column({ type: 'boolean' })
  ok: boolean;

  @Column({ name: 'findings_json', type: 'jsonb' })
  findingsJson: unknown;

  @Column({ type: 'varchar', length: 64, nullable: true })
  username?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
