import { BadGatewayException, BadRequestException, Controller, Post, ServiceUnavailableException, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { createHash, randomUUID } from 'crypto'
import { promises as fs } from 'fs'
import { diskStorage } from 'multer'
import { isAbsolute, resolve } from 'path'
import { AdminGuard } from './auth'
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger'

// Only these types are accepted. The extension comes from this list, never from the uploaded file name.
const EXT: Record<string, string> = {
  'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif',
  'video/mp4': '.mp4', 'video/webm': '.webm', 'audio/mpeg': '.mp3',
}
const uploadDir = resolve(process.env.UPLOADS_DIR || 'uploads')

@Controller('uploads')
@ApiTags('uploads')
export class UploadsController {
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Upload admin media to Cloudinary or local development storage' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } }, required: ['file'] } })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({ destination: uploadDir, filename: (_req, file, cb) => cb(null, randomUUID() + EXT[file.mimetype]) }),
      limits: { fileSize: 200 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => (EXT[file.mimetype] ? cb(null, true) : cb(new BadRequestException('Unsupported file type'), false)),
    }),
  )
  async upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file received')
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env
    if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
      const timestamp = Math.floor(Date.now() / 1000)
      const signature = createHash('sha1').update(`timestamp=${timestamp}${CLOUDINARY_API_SECRET}`).digest('hex')
      const form = new FormData()
      form.append('file', new Blob([await fs.readFile(file.path)], { type: file.mimetype }), file.filename)
      form.append('timestamp', String(timestamp))
      form.append('api_key', CLOUDINARY_API_KEY)
      form.append('signature', signature)
      try {
        const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(CLOUDINARY_CLOUD_NAME)}/auto/upload`, { method: 'POST', body: form })
        const result: any = await response.json().catch(() => null)
        if (!response.ok || !result?.secure_url) throw new Error('Upload provider rejected the file')
        return { url: result.secure_url }
      } catch {
        throw new BadGatewayException('Could not store the uploaded file. Please try again.')
      } finally {
        await fs.unlink(file.path).catch(() => {})
      }
    }
    if (CLOUDINARY_CLOUD_NAME || CLOUDINARY_API_KEY || CLOUDINARY_API_SECRET) {
      await fs.unlink(file.path).catch(() => {})
      throw new ServiceUnavailableException('Cloudinary upload configuration is incomplete.')
    }
    if (process.env.NODE_ENV === 'production' && !isAbsolute(process.env.UPLOADS_DIR?.trim() || '')) {
      await fs.unlink(file.path).catch(() => {})
      throw new ServiceUnavailableException('Persistent media storage is not configured. Set Cloudinary credentials or set UPLOADS_DIR to the absolute path of a mounted persistent disk.')
    }
    const base = (process.env.PUBLIC_API_URL || '').replace(/\/$/, '')
    return { url: `${base}/uploads/${file.filename}` }
  }
}
