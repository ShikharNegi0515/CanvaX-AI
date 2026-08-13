import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CanvasService } from './canvas.service';
import { CreateCanvasDto, SaveCanvasDto, ShareCanvasDto } from './dto/canvas.dto';

type AuthRequest = { user: { id: string; email: string } };

@UseGuards(JwtAuthGuard)
@Controller('canvas')
export class CanvasController {
  constructor(private canvasService: CanvasService) {}

  @Post()
  create(@Request() req: AuthRequest, @Body() dto: CreateCanvasDto) {
    return this.canvasService.create(req.user.id, dto);
  }

  @Get()
  findAll(@Request() req: AuthRequest) {
    return this.canvasService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.canvasService.findOne(id, req.user.id);
  }

  @Patch(':id')
  save(@Param('id') id: string, @Request() req: AuthRequest, @Body() dto: SaveCanvasDto) {
    return this.canvasService.save(id, req.user.id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.canvasService.remove(id, req.user.id);
  }

  @Post(':id/share')
  share(@Param('id') id: string, @Request() req: AuthRequest, @Body() dto: ShareCanvasDto) {
    return this.canvasService.share(id, req.user.id, dto);
  }
}
