import { BadRequestException, Body, CanActivate, Controller, ExecutionContext, Injectable, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { JwtService } from '@nestjs/jwt'
import { Throttle } from '@nestjs/throttler'
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator'
import { Model } from 'mongoose'
import * as bcrypt from 'bcryptjs'

export class LoginDto {
  @IsEmail() email: string
  @IsString() @MaxLength(200) password: string
}

export class ChangePasswordDto {
  @IsString() @MinLength(1) @MaxLength(200) currentPassword: string
  @IsString() @MinLength(10) @MaxLength(200) newPassword: string
}

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private jwt: JwtService) {}
  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest()
    const h: string = req.headers.authorization || ''
    const token = h.startsWith('Bearer ') ? h.slice(7) : null
    if (!token) throw new UnauthorizedException()
    try {
      const p = await this.jwt.verifyAsync(token)
      if (p.role !== 'admin') throw new Error()
      req.user = p
      return true
    } catch {
      throw new UnauthorizedException()
    }
  }
}

@Controller('auth')
export class AuthController {
  constructor(@InjectModel('User') private users: Model<any>, private jwt: JwtService) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  async login(@Body() dto: LoginDto) {
    const u = await this.users.findOne({ email: dto.email.toLowerCase() })
    // Same error for unknown email and wrong password.
    const ok = u && (await bcrypt.compare(dto.password, u.get('passwordHash')))
    if (!ok) throw new UnauthorizedException('Wrong email or password')
    return { token: await this.jwt.signAsync({ sub: String(u._id), role: 'admin' }) }
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(AdminGuard)
  @Post('change-password')
  async changePassword(@Req() req: { user: { sub: string } }, @Body() dto: ChangePasswordDto) {
    const user = await this.users.findById(req.user.sub)
    if (!user) throw new UnauthorizedException()
    const currentMatches = await bcrypt.compare(dto.currentPassword, user.get('passwordHash'))
    if (!currentMatches) throw new UnauthorizedException('Current password is incorrect')
    if (await bcrypt.compare(dto.newPassword, user.get('passwordHash'))) {
      throw new BadRequestException('Choose a new password that differs from your current password')
    }
    user.set('passwordHash', await bcrypt.hash(dto.newPassword, 12))
    await user.save()
    return { ok: true }
  }
}
