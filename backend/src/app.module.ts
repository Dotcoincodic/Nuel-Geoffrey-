import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { APP_GUARD } from '@nestjs/core'
import { JwtModule } from '@nestjs/jwt'
import { MongooseModule } from '@nestjs/mongoose'
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler'
import { AdminGuard, AuthController } from './auth'
import { crud, MessagesController, PublicController, SettingsService, VideoReactionsController } from './content'
import { MailService } from './mail'
import { OrdersController, OrdersService } from './orders'
import { SCHEMAS } from './schemas'
import { UploadsController } from './uploads'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({ inject: [ConfigService], useFactory: (c: ConfigService) => ({ uri: c.get('MONGODB_URI') }) }),
    MongooseModule.forFeature(SCHEMAS),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (c: ConfigService) => ({ secret: c.get('JWT_SECRET'), signOptions: { expiresIn: '12h' } }),
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
  ],
  controllers: [
    AuthController, PublicController, VideoReactionsController, MessagesController, OrdersController, UploadsController,
    crud('works', 'Work'), crud('tracks', 'Track'), crud('videos', 'Video'), crud('posts', 'Post'),
  ],
  providers: [AdminGuard, MailService, SettingsService, OrdersService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
