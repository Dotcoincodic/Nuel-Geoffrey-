import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform, ValidationPipe } from '@nestjs/common'
import {
  ArrayMaxSize, IsArray, IsBoolean, IsEmail, IsIn, IsInt, IsOptional, IsString, IsUrl, Max, MaxLength, Min, ValidateIf,
} from 'class-validator'

export class WorkBodyDto {
  @IsOptional() @IsString() @MaxLength(200) title?: string
  @IsOptional() @IsString() @MaxLength(200) medium?: string
  @IsOptional() @IsString() @MaxLength(100) size?: string
  @IsOptional() @IsInt() @Min(0) @Max(2100) year?: number
  @IsOptional() @IsInt() @Min(0) price?: number
  @IsOptional() @IsInt() @Min(0) printPrice?: number
  @IsOptional() @IsIn(['available', 'reserved', 'sold']) status?: string
  @IsOptional() @IsIn(['sale', 'archive']) collection?: string
  @IsOptional() @IsString() @MaxLength(2048) image?: string
}

export class TrackBodyDto {
  @IsOptional() @IsString() @MaxLength(200) title?: string
  @IsOptional() @IsString() @MaxLength(200) meta?: string
  @IsOptional() @IsString() @MaxLength(3000) description?: string
  @IsOptional() @IsString() @MaxLength(40) length?: string
  @IsOptional() @IsString() @MaxLength(2048) src?: string
  @IsOptional() @IsString() @MaxLength(2048) cover?: string
}

export class VideoBodyDto {
  @IsOptional() @IsString() @MaxLength(200) title?: string
  @IsOptional() @IsString() @MaxLength(40) date?: string
  @IsOptional() @IsString() @MaxLength(2048) src?: string
  @IsOptional() @IsString() @MaxLength(2048) poster?: string
  @IsOptional() @IsString() @MaxLength(3000) description?: string
  @IsOptional() @IsString() @MaxLength(5000) story?: string
  @IsOptional() @IsInt() @Min(0) likes?: number
  @IsOptional() @IsInt() @Min(0) loves?: number
}

export class PostBodyDto {
  @IsOptional() @IsString() @MaxLength(200) title?: string
  @IsOptional() @IsString() @MaxLength(500) caption?: string
  @IsOptional() @IsString() @MaxLength(40) date?: string
  @IsOptional() @IsString() @MaxLength(2048) cover?: string
  @IsOptional() @IsString() @MaxLength(20000) body?: string
  @IsOptional() @IsString() @MaxLength(40) updatedAt?: string
}

export class SettingsBodyDto {
  @IsOptional() @IsString() @MaxLength(200) name?: string
  @IsOptional() @IsString() @MaxLength(300) headline?: string
  @IsOptional() @IsString() @MaxLength(200) location?: string
  @IsOptional() @ValidateIf((_object, value) => value !== '') @IsEmail() email?: string
  @IsOptional() @IsString() @MaxLength(10000) bio?: string
  @IsOptional() @IsString() @MaxLength(2048) heroImage?: string
  @IsOptional() @IsArray() @ArrayMaxSize(9) @IsString({ each: true }) heroImages?: string[]
  @IsOptional() @IsString() @MaxLength(2048) aboutImage?: string
  @IsOptional() @IsInt() @Min(0) shippingFee?: number
  @IsOptional() @IsString() @MaxLength(2048) instagram?: string
  @IsOptional() @IsString() @MaxLength(2048) facebook?: string
  @IsOptional() @IsString() @MaxLength(2048) whatsapp?: string
  @IsOptional() @IsString() @MaxLength(2048) twitter?: string
  @IsOptional() @ValidateIf((_object, value) => value !== '') @IsUrl({ require_protocol: true }) @MaxLength(2048) spotify?: string
  @IsOptional() @ValidateIf((_object, value) => value !== '') @IsUrl({ require_protocol: true }) @MaxLength(2048) appleMusic?: string
  @IsOptional() @ValidateIf((_object, value) => value !== '') @IsUrl({ require_protocol: true }) @MaxLength(2048) youtube?: string
}

export class VideoReactionDto {
  @IsIn(['likes', 'loves']) kind: string
  @IsInt() @IsIn([1, -1]) delta: number
}

export class MarkMessageDto {
  @IsBoolean()
  read: boolean
}

const contentTypes: Record<string, new () => object> = {
  Work: WorkBodyDto,
  Track: TrackBodyDto,
  Video: VideoBodyDto,
  Post: PostBodyDto,
}

@Injectable()
export class ContentBodyPipe implements PipeTransform {
  private readonly validation = new ValidationPipe({ transform: true, whitelist: false, forbidUnknownValues: true })

  constructor(private readonly modelName: string, private readonly creating: boolean) {}

  async transform(value: unknown, metadata: ArgumentMetadata) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new BadRequestException('Expected a JSON object')
    const record = value as Record<string, unknown>
    if (!Object.keys(record).length) throw new BadRequestException('The request body cannot be empty')
    if (Object.keys(record).some((key) => key.startsWith('$') || key.includes('.'))) {
      throw new BadRequestException('Field names cannot contain MongoDB operators or dots')
    }
    if (this.creating) {
      const required = this.modelName === 'Video' || this.modelName === 'Post' ? ['title', 'date'] : ['title']
      if (required.some((key) => typeof record[key] !== 'string' || !(record[key] as string).trim())) {
        throw new BadRequestException(`Required fields: ${required.join(', ')}`)
      }
    }
    return this.validation.transform(value, { ...metadata, metatype: contentTypes[this.modelName], type: 'body' })
  }
}

@Injectable()
export class SettingsBodyPipe implements PipeTransform {
  private readonly validation = new ValidationPipe({ transform: true, whitelist: false, forbidUnknownValues: true })

  async transform(value: unknown, metadata: ArgumentMetadata) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new BadRequestException('Expected a JSON object')
    if (Object.keys(value as object).some((key) => key.startsWith('$') || key.includes('.'))) {
      throw new BadRequestException('Field names cannot contain MongoDB operators or dots')
    }
    return this.validation.transform(value, { ...metadata, metatype: SettingsBodyDto, type: 'body' })
  }
}
