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
  class CrudController {
    constructor(@InjectModel(modelName) private model: Model<any>) {}
    @Get() async list() { return (await this.model.find().sort({ createdAt: 1 })).map(withoutPicsumImages) }
    @UseGuards(AdminGuard) @Post() create(@Body() b: any) { return this.model.create(clean(b)) }
    @UseGuards(AdminGuard) @Put(':id')
    async update(@Param('id') id: string, @Body() b: any) {
      checkId(id)
      const doc = await this.model.findByIdAndUpdate(id, { $set: clean(b) }, { new: true })
      if (!doc) throw new NotFoundException()
      return doc
    }
    @UseGuards(AdminGuard) @Delete(':id')
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
export class PublicController {
  constructor(
    @InjectModel('Work') private works: Model<any>, @InjectModel('Track') private tracks: Model<any>,
    @InjectModel('Video') private videos: Model<any>, @InjectModel('Post') private posts: Model<any>,
    private settings: SettingsService,
  ) {}

  // Everything the public site needs, in one request.
  @Get('public')
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

  @Get('settings') getSettings() { return this.settings.get() }
  @UseGuards(AdminGuard) @Put('settings') saveSettings(@Body() b: any) { return this.settings.save(b) }
}

@Controller('videos')
export class VideoReactionsController {
  constructor(@InjectModel('Video') private videos: Model<any>) {}

  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Post(':id/react')
  async react(@Param('id') id: string, @Body() b: { kind: string; delta: number }) {
    checkId(id)
    if (!['likes', 'loves'].includes(b?.kind) || ![1, -1].includes(b?.delta)) throw new BadRequestException()
    const v = await this.videos.findByIdAndUpdate(id, { $inc: { [b.kind]: b.delta } }, { new: true })
    if (!v) throw new NotFoundException()
    if (v.get(b.kind) < 0) await this.videos.updateOne({ _id: id }, { $set: { [b.kind]: 0 } })
    return { ok: true }
  }
}

export class CreateMessageDto {
  @IsIn(['contact', 'comment']) type: 'contact' | 'comment'
  @IsString() @MinLength(1) @MaxLength(100) name: string
  @IsOptional() @IsEmail() email?: string
  @IsString() @MinLength(1) @MaxLength(3000) message: string
  @IsOptional() @IsString() @MaxLength(60) videoId?: string
  @IsOptional() @IsString() @MaxLength(200) videoTitle?: string
}

@Controller('messages')
export class MessagesController {
  constructor(@InjectModel('Message') private model: Model<any>, private mail: MailService) {}

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post()
  async create(@Body() dto: CreateMessageDto) {
    const m = await this.model.create({ ...dto, read: false })
    this.mail.newMessage(m.toJSON())
    return { ok: true }
  }
  @UseGuards(AdminGuard) @Get() list() { return this.model.find().sort({ createdAt: -1 }) }
  @UseGuards(AdminGuard) @Patch(':id')
  async mark(@Param('id') id: string, @Body() b: { read: boolean }) {
    checkId(id)
    return this.model.findByIdAndUpdate(id, { $set: { read: Boolean(b?.read) } }, { new: true })
  }
  @UseGuards(AdminGuard) @Delete(':id')
  async remove(@Param('id') id: string) {
    checkId(id)
    await this.model.findByIdAndDelete(id)
    return { ok: true }
  }
}
