import type { Request } from 'express'

interface RequestUser {
  id: number
  sessionId?: string
}

export interface RequestWithContext extends Request {
  requestId: string
  user?: RequestUser
}
