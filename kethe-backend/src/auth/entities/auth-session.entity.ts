import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm'
import { User } from '../../user/entities/user.entity'

@Entity({ name: 'auth_sessions', synchronize: false })
@Index('idx_auth_sessions_user_active', ['userId', 'revokedAt', 'expiresAt'])
export class AuthSession {
  @PrimaryColumn({ type: 'char', length: 36 })
  id: string

  @Column({ name: 'user_id', type: 'int' })
  userId: number

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({
    name: 'user_id',
    foreignKeyConstraintName: 'fk_auth_sessions_user',
  })
  user: User

  @Column({ name: 'refresh_jti', type: 'char', length: 36 })
  refreshJti: string

  @Column({ name: 'device_label', type: 'varchar', length: 64 })
  deviceLabel: string

  @Column({ name: 'created_at', type: 'datetime' })
  createdAt: Date

  @Column({ name: 'last_active_at', type: 'datetime' })
  lastActiveAt: Date

  @Column({ name: 'expires_at', type: 'datetime' })
  expiresAt: Date

  @Column({ name: 'revoked_at', type: 'datetime', nullable: true })
  revokedAt: Date | null
}
