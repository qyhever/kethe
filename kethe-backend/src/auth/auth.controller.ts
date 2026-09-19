import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Patch,
  Post,
  Req,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import {
  ApiAccessTokenErrorResponse,
  ApiValidationErrorResponse,
  ApiWrappedCreatedResponse,
  ApiWrappedOkResponse,
} from '../common/decorators/api-wrapped-response.decorator'
import { SuccessMessage } from '../common/decorators/success-message.decorator'
import { Public } from '../common/decorators/public.decorator'
import { ResponseMessageEnum } from '../common/enums/response-message.enum'
import type { RequestWithContext } from '../common/types/request-with-context'
import { AuthService } from './auth.service'
import { AuthTokensDto } from './dto/auth-tokens.dto'
import { LoginDto } from './dto/login.dto'
import { RefreshTokenDto } from './dto/refresh-token.dto'
import { RegisterDto } from './dto/register.dto'
import { SendRegistrationCodeDto } from './dto/send-registration-code.dto'
import { VerificationCodeService } from './verification-code.service'
import { SendPasswordResetCodeDto } from './dto/send-password-reset-code.dto'
import { ResetPasswordDto } from './dto/reset-password.dto'
import { ChangePasswordDto } from './dto/change-password.dto'

@ApiTags('认证')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name)

  constructor(
    private readonly authService: AuthService,
    private readonly verificationCodeService: VerificationCodeService,
  ) {}

  @Post('registration-code')
  @Public()
  @ApiOperation({
    summary: '发送注册验证码',
    description:
      '向指定邮箱发送注册验证码。邮箱已注册、发送过频或邮件发送失败时返回业务失败响应',
  })
  @ApiWrappedCreatedResponse({
    description: '验证码发送请求已处理',
    message: '请求成功',
    data: { type: 'null' },
  })
  @ApiValidationErrorResponse()
  sendRegistrationCode(@Body() dto: SendRegistrationCodeDto) {
    return this.verificationCodeService.sendRegistrationCode(dto.email)
  }

  @Post('password-reset-code')
  @Public()
  @SuccessMessage(ResponseMessageEnum.PASSWORD_RESET_CODE_SENT)
  @ApiOperation({
    summary: '发送重置密码验证码',
    description:
      '若邮箱已注册则发送重置密码验证码。邮箱未注册、发送过频或邮件发送失败时均返回中性成功响应',
  })
  @ApiWrappedCreatedResponse({
    description: '重置密码验证码请求已处理',
    message: ResponseMessageEnum.PASSWORD_RESET_CODE_SENT,
    data: { type: 'null' },
  })
  @ApiValidationErrorResponse()
  sendPasswordResetCode(@Body() dto: SendPasswordResetCodeDto) {
    return this.verificationCodeService.sendPasswordResetCode(dto.email)
  }

  @Post('reset-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @SuccessMessage(ResponseMessageEnum.PASSWORD_RESET_SUCCESS)
  @ApiOperation({
    summary: '重置密码',
    description:
      '校验重置密码验证码并更新密码。成功后需使用新密码重新登录，不签发新令牌',
  })
  @ApiWrappedOkResponse({
    description: '重置密码请求已处理',
    message: ResponseMessageEnum.PASSWORD_RESET_SUCCESS,
    data: { type: 'null' },
  })
  @ApiValidationErrorResponse()
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto)
  }

  @Patch('password')
  @HttpCode(HttpStatus.OK)
  @SuccessMessage(ResponseMessageEnum.PASSWORD_CHANGE_SUCCESS)
  @ApiBearerAuth()
  @ApiAccessTokenErrorResponse()
  @ApiOperation({
    summary: '修改密码',
    description: '校验当前密码后为当前登录用户更新密码',
  })
  @ApiWrappedOkResponse({
    description: '修改密码请求已处理',
    message: ResponseMessageEnum.PASSWORD_CHANGE_SUCCESS,
    data: { type: 'null' },
  })
  @ApiValidationErrorResponse()
  changePassword(
    @Body() dto: ChangePasswordDto,
    @Req() request: RequestWithContext,
  ) {
    return this.authService.changePassword(request.user!.id, dto)
  }

  @Post('register')
  @Public()
  @ApiOperation({
    summary: '用户注册',
    description:
      '使用邮箱验证码创建新用户。用户名、邮箱重复或验证码错误时返回业务失败响应',
  })
  @ApiWrappedCreatedResponse({
    description: '注册请求已处理',
    message: '请求成功',
    data: { type: 'null' },
  })
  @ApiValidationErrorResponse()
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto)
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @SuccessMessage(ResponseMessageEnum.LOGIN_SUCCESS)
  @ApiOperation({
    summary: '用户登录',
    description:
      '使用邮箱和密码登录，成功后返回访问令牌和刷新令牌。用户不存在或密码错误时返回业务失败响应',
  })
  @ApiWrappedOkResponse({
    description: '登录请求已处理',
    message: ResponseMessageEnum.LOGIN_SUCCESS,
    data: { model: AuthTokensDto },
  })
  @ApiValidationErrorResponse()
  async login(@Body() dto: LoginDto, @Req() request: RequestWithContext) {
    const result = await this.authService.login(dto)

    if (!('error' in result)) {
      const loginContext = {
        email: dto.email,
        event: 'user_login' as const,
        ip: request.ip,
        message: '用户登录成功',
        requestId: request.requestId,
        userAgent: request.get('user-agent'),
      }

      this.logger.log(loginContext)
      void this.authService.notifyLoginSuccess(loginContext)
    }

    return result
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @SuccessMessage(ResponseMessageEnum.REFRESH_TOKEN_SUCCESS)
  @ApiOperation({
    summary: '刷新令牌',
    description: '使用刷新令牌换取新的访问令牌和刷新令牌',
  })
  @ApiWrappedOkResponse({
    description: '刷新令牌成功',
    message: ResponseMessageEnum.REFRESH_TOKEN_SUCCESS,
    data: { model: AuthTokensDto },
  })
  @ApiValidationErrorResponse()
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken)
  }
}
