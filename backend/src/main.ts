import 'reflect-metadata'
import { Logger, ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import helmet from 'helmet'
import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import 'dotenv/config'
import { AppModule } from './app.module'

async function bootstrap() {
  const missing = ['MONGODB_URI', 'JWT_SECRET', 'FRONTEND_URL', 'PUBLIC_API_URL'].filter((k) => !process.env[k])
  if (missing.length) {
    console.error(`Missing in .env: ${missing.join(', ')}. Copy .env.example to .env and fill them in.`)
    process.exit(1)
  }
  if (process.env.JWT_SECRET.length < 32) {
    console.error('JWT_SECRET is too short. Use at least 32 random characters.')
    process.exit(1)
  }
  if (!existsSync('uploads')) mkdirSync('uploads')

  // rawBody is required: the Paystack webhook signature is computed over the exact bytes received.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true })
  app.set('trust proxy', 1) // correct client IPs for rate limiting behind Render / Railway
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } })) // lets the React site load /uploads images
  app.enableCors({ origin: process.env.FRONTEND_URL.split(',').map((s) => s.trim()) })
  app.setGlobalPrefix('api')
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' })
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))

  const port = Number(process.env.PORT || 4000)
  await app.listen(port)
  new Logger('Bootstrap').log(`API running on http://localhost:${port}/api`)
}
bootstrap()
