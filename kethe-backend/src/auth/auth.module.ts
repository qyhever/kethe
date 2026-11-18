import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { APP_GUARD } from '@nestjs/core'
import type { EnvironmentVariables } from '../config/environment.validation'
import { MailModule } from '../mail/mail.module'
import { UserModule } from '../user/user.module'
import { AuthController } from './auth.controller'
import { AuthSessionService } from './auth-session.service'
import { AuthSession } from './entities/auth-session.entity'
import { AuthService } from './auth.service'
import { EmailVerificationCode } from './entities/email-verification-code.entity'
import { TypeOrmVerificationCodeRepository } from './repositories/typeorm-verification-code.repository'
import { VerificationCodeRepository } from './repositories/verification-code.repository'
import { VerificationCodeService } from './verification-code.service'
import { AccessTokenGuard } from './guards/access-token.guard'

@Module({
  imports: [
    TypeOrmModule.forFeature([EmailVerificationCode, AuthSession]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (
        configService: ConfigService<EnvironmentVariables, true>,
      ) => ({
        secret: configService.get('JWT_SECRET', { infer: true }),
        signOptions: {
          issuer: configService.get('JWT_ISSUER', { infer: true }),
        },
      }),
    }),
    MailModule,
    UserModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthSessionService,
    VerificationCodeService,
    {
      provide: APP_GUARD,
      useClass: AccessTokenGuard,
    },
    {
      provide: VerificationCodeRepository,
      useClass: TypeOrmVerificationCodeRepository,
    },
  ],
})
export class AuthModule {}
