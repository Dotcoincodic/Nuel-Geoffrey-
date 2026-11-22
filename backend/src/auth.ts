import { BadRequestException, Body, CanActivate, Controller, ExecutionContext, Injectable, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { JwtService } from '@nestjs/jwt'
import { Throttle } from '@nestjs/throttler'
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator'
import { Model } from 'mongoose'
import * as bcrypt from 'bcryptjs'
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger'

export class LoginDto {
  @ApiProperty({ example: 'admin@example.com' })
  @IsEmail() email: string
  @ApiProperty({ example: 'Use a private password' })
  @IsString() @MinLength(1) @MaxLength(200) password: string
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'Current password' })
  @IsString() @MinLength(1) @MaxLength(200) currentPassword: string
  @ApiProperty({ minLength: 10, example: 'A new private password' })
  @IsString() @MinLength(10) @MaxLength(200) newPassword: string
}

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private jwt: JwtService, @InjectModel('User') private users: Model<any>) {}
  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest()
    const h: string = req.headers.authorization || ''
    const token = h.startsWith('Bearer ') ? h.slice(7) : null
    if (!token) throw new UnauthorizedException()
    let p: any
    try { p = await this.jwt.verifyAsync(token) } catch {
      throw new UnauthorizedException()
    }
    if (p.role !== 'admin' || typeof p.sub !== 'string') throw new UnauthorizedException()
    const user = await this.users.findById(p.sub)
    if (!user || (user.get('role') && user.get('role') !== 'admin')) throw new UnauthorizedException()
    if (Number(p.tokenVersion || 0) !== Number(user.get('tokenVersion') || 0)) throw new UnauthorizedException()
    req.user = p
    return true
  }
}

@Controller('auth')
@ApiTags('authentication')
export class AuthController {
  constructor(@InjectModel('User') private users: Model<any>, private jwt: JwtService) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  @ApiOperation({ summary: 'Sign in to the studio admin dashboard' })
  async login(@Body() dto: LoginDto) {
    const u = await this.users.findOne({ email: dto.email.toLowerCase() })
    // Same error for unknown email and wrong password.
    const ok = u && (await bcrypt.compare(dto.password, u.get('passwordHash')))
    if (!ok) throw new UnauthorizedException('Wrong email or password')
    return { token: await this.jwt.signAsync({ sub: String(u._id), role: 'admin', tokenVersion: Number(u.get('tokenVersion') || 0) }) }
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @Post('change-password')
  @ApiOperation({ summary: 'Change the signed-in admin password and revoke active tokens' })
  async changePassword(@Req() req: { user: { sub: string } }, @Body() dto: ChangePasswordDto) {
    const user = await this.users.findById(req.user.sub)
    if (!user) throw new UnauthorizedException()
    const currentMatches = await bcrypt.compare(dto.currentPassword, user.get('passwordHash'))
    if (!currentMatches) throw new UnauthorizedException('Current password is incorrect')
    if (await bcrypt.compare(dto.newPassword, user.get('passwordHash'))) {
      throw new BadRequestException('Choose a new password that differs from your current password')
    }
    user.set({ passwordHash: await bcrypt.hash(dto.newPassword, 12), tokenVersion: Number(user.get('tokenVersion') || 0) + 1 })
    await user.save()
    return { ok: true }
  }
}
