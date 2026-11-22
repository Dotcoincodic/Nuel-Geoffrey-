import { Controller, Get, ServiceUnavailableException } from '@nestjs/common'
import { InjectConnection } from '@nestjs/mongoose'
import { Connection } from 'mongoose'
import { ApiOperation, ApiTags } from '@nestjs/swagger'

@Controller('health')
@ApiTags('health')
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Get()
  @ApiOperation({ summary: 'Check API and MongoDB readiness' })
  check() {
    if (this.connection.readyState !== 1) {
      throw new ServiceUnavailableException({ status: 'unavailable', database: 'disconnected' })
    }
    return { status: 'ok', database: 'connected' }
  }
}
