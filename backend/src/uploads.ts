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

const resourceTypeFor = (mimetype: string) => (mimetype.startsWith('image/') ? 'image' : mimetype.startsWith('video/') || mimetype.startsWith('audio/') ? 'video' : 'raw')
const CHUNK_SIZE = 20 * 1024 * 1024 // Cloudinary requires chunks for large uploads; 20 MB keeps requests reliable.

async function uploadToCloudinary(file: Express.Multer.File, config: { cloudName: string; apiKey: string; apiSecret: string }) {
  const resourceType = resourceTypeFor(file.mimetype)
  const endpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/${resourceType}/upload`
  const fileSize = (await fs.stat(file.path)).size
  const uniqueId = randomUUID()

  const sendChunk = async (buffer: Buffer, start: number, end: number) => {
    const timestamp = Math.floor(Date.now() / 1000)
    const signature = createHash('sha1').update(`timestamp=${timestamp}${config.apiSecret}`).digest('hex')
    const form = new FormData()
    form.append('file', new Blob([buffer], { type: file.mimetype }), file.filename)
    form.append('timestamp', String(timestamp))
    form.append('api_key', config.apiKey)
    form.append('signature', signature)
    const response = await fetch(endpoint, {
      method: 'POST',
      body: form,
      headers: { 'X-Unique-Upload-Id': uniqueId, 'Content-Range': `bytes ${start}-${end - 1}/${fileSize}` },
    })
    const result: any = await response.json().catch(() => null)
    return { response, result }
  }

  let result: any = null
  let response: Response | null = null
  if (fileSize <= CHUNK_SIZE) {
    const timestamp = Math.floor(Date.now() / 1000)
    const signature = createHash('sha1').update(`timestamp=${timestamp}${config.apiSecret}`).digest('hex')
    const form = new FormData()
    form.append('file', new Blob([await fs.readFile(file.path)], { type: file.mimetype }), file.filename)
    form.append('timestamp', String(timestamp))
    form.append('api_key', config.apiKey)
    form.append('signature', signature)
    response = await fetch(endpoint, { method: 'POST', body: form })
    result = await response.json().catch(() => null)
  } else {
    const handle = await fs.open(file.path, 'r')
    try {
      for (let start = 0; start < fileSize; start += CHUNK_SIZE) {
        const end = Math.min(start + CHUNK_SIZE, fileSize)
        const buffer = Buffer.alloc(end - start)
        await handle.read(buffer, 0, buffer.length, start)
        ;({ response, result } = await sendChunk(buffer, start, end))
        if (!response.ok) break
      }
    } finally {
      await handle.close()
    }
  }

  if (!response?.ok || !result?.secure_url) {
    const detail = typeof result?.error?.message === 'string' ? result.error.message : `Upload provider rejected the file (HTTP ${response?.status ?? 'unknown'})`
    throw new BadGatewayException(detail)
  }
  return { url: result.secure_url }
}

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
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim()
    const apiKey = process.env.CLOUDINARY_API_KEY?.trim()
    const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim()
    if (cloudName && apiKey && apiSecret) {
      if (!/^[a-z0-9-]+$/i.test(cloudName)) {
        await fs.unlink(file.path).catch(() => {})
        throw new ServiceUnavailableException(`CLOUDINARY_CLOUD_NAME "${cloudName}" is invalid. Use the Cloudinary cloud name from your dashboard (letters, numbers, and hyphens only).`)
      }
      try {
        return await uploadToCloudinary(file, { cloudName, apiKey, apiSecret })
      } catch (error) {
        if (error instanceof BadGatewayException) throw error
        const detail = error instanceof Error ? error.message : 'Unknown upload error'
        throw new BadGatewayException(`Could not store the uploaded file: ${detail}`)
      } finally {
        await fs.unlink(file.path).catch(() => {})
      }
    }
    if (cloudName || apiKey || apiSecret) {
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
