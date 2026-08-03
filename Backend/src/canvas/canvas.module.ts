import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CanvasController } from './canvas.controller';
import { CanvasService } from './canvas.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [CanvasController],
  providers: [CanvasService],
})
export class CanvasModule {}
