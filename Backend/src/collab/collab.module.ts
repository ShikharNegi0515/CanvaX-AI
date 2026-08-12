import { Module } from '@nestjs/common';
import { CollabGateway } from './collab.gateway';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'canvax-secret-key',
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [CollabGateway],
})
export class CollabModule {}
