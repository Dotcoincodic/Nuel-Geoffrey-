import 'reflect-metadata'
import { Logger, ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import helmet from 'helmet'
import { existsSync, mkdirSync } from 'fs'
import { resolve } from 'path'
import 'dotenv/config'
import { AppModule } from './app.module'

async function bootstrap() {
  const publicApiUrl = process.env.PUBLIC_API_URL || process.env.RENDER_EXTERNAL_URL
  if (publicApiUrl) process.env.PUBLIC_API_URL = publicApiUrl.replace(/\/$/, '')
  const missing = ['MONGODB_URI', 'JWT_SECRET', 'FRONTEND_URL'].filter((k) => !process.env[k])
  if (missing.length) {
    console.error(`Missing required environment variables: ${missing.join(', ')}. Copy .env.example to .env and fill them in.`)
    process.exit(1)
  }
  if (process.env.JWT_SECRET.length < 32) {
    console.error('JWT_SECRET is too short. Use at least 32 random characters.')
    process.exit(1)
  }
  const uploadsDir = resolve(process.env.UPLOADS_DIR || 'uploads')
  if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true })

  // rawBody is required: the Paystack webhook signature is computed over the exact bytes received.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true })
  app.set('trust proxy', 1) // correct client IPs for rate limiting behind Render / Railway
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } })) // lets the React site load /uploads images
  const origins = [...new Set([process.env.FRONTEND_URL, process.env.CORS_ORIGIN || '']
    .flatMap((value) => value.split(','))
    .map((value) => value.trim().replace(/\/$/, ''))
    .filter(Boolean))]
  if (origins.includes('*')) throw new Error('Wildcard CORS origins are not allowed.')
  if (process.env.NODE_ENV !== 'production') origins.push('http://localhost:5173', 'http://127.0.0.1:5173')
  app.enableCors({
    origin: (origin, callback) => callback(null, !origin || origins.includes(origin)),
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Paystack-Signature'],
    credentials: false,
  })
  app.setGlobalPrefix('api')
  app.useStaticAssets(uploadsDir, { prefix: '/uploads/' })
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  app.enableShutdownHooks()

  const openApi = new DocumentBuilder()
    .setTitle('Nuel Artist API')
    .setDescription('Public site content, checkout, and secured studio administration endpoints.')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build()
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, openApi))

  const port = Number(process.env.PORT || 4000)
  await app.listen(port, '0.0.0.0')
  new Logger('Bootstrap').log(`API listening on port ${port}`)
}
bootstrap().catch(() => {
  new Logger('Bootstrap').error('API startup failed. Check required environment variables and MongoDB connectivity.')
  process.exit(1)
})
