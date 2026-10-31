import { BadRequestException, Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { randomUUID } from 'crypto'
import { diskStorage } from 'multer'
import { AdminGuard } from './auth'

// Only these types are accepted. The extension comes from this list, never from the uploaded file name.
const EXT: Record<string, string> = {
  'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif',
  'video/mp4': '.mp4', 'video/webm': '.webm', 'audio/mpeg': '.mp3',
}

@Controller('uploads')
export class UploadsController {
  @UseGuards(AdminGuard)
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({ destination: 'uploads', filename: (_req, file, cb) => cb(null, randomUUID() + EXT[file.mimetype]) }),
      limits: { fileSize: 200 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => (EXT[file.mimetype] ? cb(null, true) : cb(new BadRequestException('Unsupported file type'), false)),
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file received')
    const base = (process.env.PUBLIC_API_URL || '').replace(/\/$/, '')
    return { url: `${base}/uploads/${file.filename}` }
  }
}
