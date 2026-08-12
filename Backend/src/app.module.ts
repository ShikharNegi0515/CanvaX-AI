import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CanvasModule } from './canvas/canvas.module';
import { PrismaModule } from './prisma/prisma.module';
import { AiModule } from './ai/ai.module';
import { CollabModule } from './collab/collab.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    CanvasModule,
    AiModule,
    CollabModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
