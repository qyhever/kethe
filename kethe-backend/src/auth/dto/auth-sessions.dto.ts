import { ApiProperty } from '@nestjs/swagger'

class AuthSessionDto {
  @ApiProperty({ format: 'uuid' })
  id: string

  @ApiProperty({ example: 'iPhone · Safari' })
  deviceLabel: string

  @ApiProperty()
  createdAt: Date

  @ApiProperty()
  lastActiveAt: Date
}

export class AuthSessionsDto {
  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  currentSessionId: string | null

  @ApiProperty({ type: [AuthSessionDto] })
  sessions: AuthSessionDto[]
}
