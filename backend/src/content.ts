import {
  BadRequestException, Body, Controller, Delete, Get, Injectable, NotFoundException, Param, Patch, Post, Put, UseGuards,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Throttle } from '@nestjs/throttler'
import { IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'
import { isValidObjectId, Model } from 'mongoose'
import { AdminGuard } from './auth'
import { DEFAULT_SETTINGS } from './defaults'
import { MailService } from './mail'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger'
import { ContentBodyPipe, MarkMessageDto, SettingsBodyPipe, VideoReactionDto } from './content-dto'

const clean = (b: any) => {
  const { id, _id, createdAt, updatedAt, __v, ...rest } = b || {}
  return rest
}
const checkId = (id: string) => {
  if (!isValidObjectId(id)) throw new BadRequestException('Invalid id')
}
const isPicsumUrl = (value: unknown): value is string =>
  typeof value === 'string' && /^https?:\/\/(?:www\.)?picsum\.photos(?:\/|$)/i.test(value.trim())
const withoutPicsumImages = (record: any) => {
  const result = typeof record?.toJSON === 'function' ? record.toJSON() : { ...record }
  for (const field of ['image', 'cover', 'poster', 'heroImage', 'aboutImage']) {
    if (isPicsumUrl(result[field])) result[field] = ''
  }
  if (Array.isArray(result.heroImages)) result.heroImages = result.heroImages.filter((url: unknown) => !isPicsumUrl(url))
  return result
}

// Builds list / create / update / delete endpoints for a collection.
// Anyone can read. Only a signed-in admin can write.
export function crud(path: string, modelName: string) {
  @Controller(path)
  @ApiTags(`${modelName} content`)
  class CrudController {
    constructor(@InjectModel(modelName) private model: Model<any>) {}
    @Get() @ApiOperation({ summary: `List public ${modelName.toLowerCase()} records` })
    async list() { return (await this.model.find().sort({ createdAt: 1 })).map(withoutPicsumImages) }
    @UseGuards(AdminGuard) @ApiBearerAuth() @ApiBody({ schema: { type: 'object', additionalProperties: true } })
    @Post() @ApiOperation({ summary: `Create a ${modelName.toLowerCase()} record (admin)` })
    create(@Body(new ContentBodyPipe(modelName, true)) b: any) { return this.model.create(clean(b)) }
    @UseGuards(AdminGuard) @Put(':id')
    @ApiBearerAuth() @ApiBody({ schema: { type: 'object', additionalProperties: true } })
    @ApiOperation({ summary: `Replace fields on a ${modelName.toLowerCase()} record (admin)` })
    async update(@Param('id') id: string, @Body(new ContentBodyPipe(modelName, false)) b: any) {
      checkId(id)
      const doc = await this.model.findByIdAndUpdate(id, { $set: clean(b) }, { new: true })
      if (!doc) throw new NotFoundException()
      return doc
    }
    @UseGuards(AdminGuard) @ApiBearerAuth() @Delete(':id') @ApiOperation({ summary: `Delete a ${modelName.toLowerCase()} record (admin)` })
    async remove(@Param('id') id: string) {
      checkId(id)
      await this.model.findByIdAndDelete(id)
      return { ok: true }
    }
  }
  return CrudController
}

@Injectable()
export class SettingsService {
  constructor(@InjectModel('Setting') private model: Model<any>) {}
  async get() {
    const doc = await this.model.findOne({ key: 'site' })
    const { id, key, createdAt, updatedAt, ...rest } = doc ? doc.toJSON() : ({} as any)
    return withoutPicsumImages({ ...DEFAULT_SETTINGS, ...rest })
  }
  async save(body: any) {
    await this.model.findOneAndUpdate({ key: 'site' }, { $set: { ...clean(body), key: 'site' } }, { upsert: true, new: true })
    return this.get()
  }
}

@Controller()
@ApiTags('public content and settings')
export class PublicController {
  constructor(
    @InjectModel('Work') private works: Model<any>, @InjectModel('Track') private tracks: Model<any>,
    @InjectModel('Video') private videos: Model<any>, @InjectModel('Post') private posts: Model<any>,
    private settings: SettingsService,
  ) {}

  // Everything the public site needs, in one request.
  @Get('public')
  @ApiOperation({ summary: 'Load all public content and site settings' })
  async all() {
    const [works, tracks, videos, posts, settings] = await Promise.all([
      this.works.find().sort({ createdAt: 1 }), this.tracks.find().sort({ createdAt: 1 }),
      this.videos.find().sort({ createdAt: 1 }), this.posts.find().sort({ createdAt: 1 }), this.settings.get(),
    ])
    return {
      works: works.map(withoutPicsumImages), tracks: tracks.map(withoutPicsumImages),
      videos: videos.map(withoutPicsumImages), posts: posts.map(withoutPicsumImages), settings,
    }
  }

  @Get('settings') @ApiOperation({ summary: 'Read public site settings' }) getSettings() { return this.settings.get() }
  @UseGuards(AdminGuard) @ApiBearerAuth() @ApiBody({ schema: { type: 'object', additionalProperties: true } })
  @Put('settings') @ApiOperation({ summary: 'Update site settings (admin)' }) saveSettings(@Body(new SettingsBodyPipe()) b: any) { return this.settings.save(b) }
}

@Controller('videos')
@ApiTags('video reactions')
export class VideoReactionsController {
  constructor(@InjectModel('Video') private videos: Model<any>) {}

  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Post(':id/react')
  @ApiOperation({ summary: 'Increment or decrement a video like/love reaction' })
  async react(@Param('id') id: string, @Body() b: VideoReactionDto) {
    checkId(id)
    if (!['likes', 'loves'].includes(b?.kind) || ![1, -1].includes(b?.delta)) throw new BadRequestException()
    const v = await this.videos.findByIdAndUpdate(id, { $inc: { [b.kind]: b.delta } }, { new: true })
    if (!v) throw new NotFoundException()
    if (v.get(b.kind) < 0) await this.videos.updateOne({ _id: id }, { $set: { [b.kind]: 0 } })
    return { ok: true }
  }
}

export class CreateMessageDto {
  @ApiProperty({ enum: ['contact', 'comment'] })
  @IsIn(['contact', 'comment']) type: 'contact' | 'comment'
  @ApiProperty({ maxLength: 100 })
  @IsString() @MinLength(1) @MaxLength(100) name: string
  @ApiProperty({ required: false })
  @IsOptional() @IsEmail() email?: string
  @ApiProperty({ maxLength: 3000 })
  @IsString() @MinLength(1) @MaxLength(3000) message: string
  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(60) videoId?: string
  @ApiProperty({ required: false })
  @IsOptional() @IsString() @MaxLength(200) videoTitle?: string
}

@Controller('messages')
@ApiTags('messages')
export class MessagesController {
  constructor(@InjectModel('Message') private model: Model<any>, private mail: MailService) {}

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post()
  @ApiOperation({ summary: 'Submit a contact message or video comment' })
  async create(@Body() dto: CreateMessageDto) {
    const m = await this.model.create({ ...dto, read: false })
    this.mail.newMessage(m.toJSON())
    return { ok: true }
  }
  @UseGuards(AdminGuard) @ApiBearerAuth() @Get() @ApiOperation({ summary: 'List messages (admin)' }) list() { return this.model.find().sort({ createdAt: -1 }) }
  @UseGuards(AdminGuard) @ApiBearerAuth() @Patch(':id') @ApiOperation({ summary: 'Update message read state (admin)' })
  async mark(@Param('id') id: string, @Body() b: MarkMessageDto) {
    checkId(id)
    return this.model.findByIdAndUpdate(id, { $set: { read: Boolean(b?.read) } }, { new: true })
  }
  @UseGuards(AdminGuard) @ApiBearerAuth() @Delete(':id') @ApiOperation({ summary: 'Delete a message (admin)' })
  async remove(@Param('id') id: string) {
    checkId(id)
    await this.model.findByIdAndDelete(id)
    return { ok: true }
  }
}
