import { Controller, Get } from '@nestjs/common';
import { OpenSeaWebSocketService } from './open-sea-web-socket.service';

@Controller('open-sea-web-socket')
export class OpenSeaWebSocketController {
    constructor(private openSeaWebSocketService: OpenSeaWebSocketService) {}

    @Get('transfer-events')
    async getTransferEvents() {
      await this.openSeaWebSocketService.getTransferEvents();
    }
}
