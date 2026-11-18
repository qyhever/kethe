import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { IsNull, Raw, Repository } from 'typeorm'
import { AuthSession } from './entities/auth-session.entity'

export function isSessionId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
      value,
    )
  )
}

function getDeviceLabel(userAgent = '') {
  const device = [
    [/iPhone/i, 'iPhone'],
    [/iPad|Macintosh.*Mobile/i, 'iPad'],
    [/Android/i, 'Android'],
    [/Windows/i, 'Windows'],
    [/Macintosh/i, 'Mac'],
    [/Linux/i, 'Linux'],
  ] as const
  const browser = [
    [/MicroMessenger/i, '微信'],
    [/Edg(?:e|A|iOS)?\//i, 'Edge'],
    [/OPR\/|Opera/i, 'Opera'],
    [/Chrome\/|CriOS\//i, 'Chrome'],
    [/Firefox\/|FxiOS\//i, 'Firefox'],
    [/Safari\//i, 'Safari'],
  ] as const

  return (
    [
      device.find(([pattern]) => pattern.test(userAgent))?.[1],
      browser.find(([pattern]) => pattern.test(userAgent))?.[1],
    ]
      .filter(Boolean)
      .join(' · ') || '未知设备'
  )
}

const activityInterval = 5 * 60 * 1000

@Injectable()
export class AuthSessionService {
  constructor(
    @InjectRepository(AuthSession)
    private readonly sessions: Repository<AuthSession>,
  ) {}

  async create(
    id: string,
    userId: number,
    refreshJti: string,
    expiresAt: Date,
    userAgent?: string,
  ) {
    const now = new Date()
    await this.sessions.insert({
      id,
      userId,
      refreshJti,
      deviceLabel: getDeviceLabel(userAgent),
      createdAt: now,
      lastActiveAt: now,
      expiresAt,
    })
  }

  private active(userId: number) {
    return {
      userId,
      revokedAt: IsNull(),
      expiresAt: Raw((column) => `${column} > UTC_TIMESTAMP()`),
    }
  }

  async checkAccess(userId: number, id: string) {
    const criteria = { ...this.active(userId), id }
    const session = await this.sessions.findOne({
      where: criteria,
      select: { lastActiveAt: true },
    })
    if (!session) return false

    if (Date.now() - session.lastActiveAt.getTime() >= activityInterval) {
      const updated = await this.sessions.update(
        {
          ...criteria,
          lastActiveAt: Raw(
            (column) => `${column} <= UTC_TIMESTAMP() - INTERVAL 5 MINUTE`,
          ),
        },
        { lastActiveAt: () => 'UTC_TIMESTAMP()' },
      )
      if (!updated.affected) return this.sessions.existsBy(criteria)
    }
    return true
  }

  async rotate(
    userId: number,
    id: string,
    previousJti: string,
    refreshJti: string,
    expiresAt: Date,
  ) {
    const result = await this.sessions.update(
      { ...this.active(userId), id, refreshJti: previousJti },
      { refreshJti, expiresAt },
    )
    return result.affected === 1
  }

  async list(userId: number, currentSessionId?: string) {
    const sessions = await this.sessions.find({
      where: this.active(userId),
      select: {
        id: true,
        deviceLabel: true,
        createdAt: true,
        lastActiveAt: true,
      },
      order: { lastActiveAt: 'DESC', id: 'ASC' },
    })
    const currentIndex = sessions.findIndex(({ id }) => id === currentSessionId)
    if (currentIndex > 0) sessions.unshift(...sessions.splice(currentIndex, 1))
    return { currentSessionId: currentSessionId ?? null, sessions }
  }

  async revoke(userId: number, id: string) {
    await this.sessions.update(
      { ...this.active(userId), id },
      { revokedAt: () => 'UTC_TIMESTAMP()' },
    )
    return null
  }
}
