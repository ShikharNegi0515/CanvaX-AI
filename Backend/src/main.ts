import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Register global exception filter for detailed error logging
  app.useGlobalFilters(new AllExceptionsFilter());

  // Log critical env vars at startup (values redacted)
  logger.log(`DATABASE_URL set: ${!!process.env.DATABASE_URL}`);
  logger.log(`JWT_SECRET set: ${!!process.env.JWT_SECRET}`);
  logger.log(`FRONTEND_URL: ${process.env.FRONTEND_URL ?? 'NOT SET (defaulting to localhost)'}`);
  logger.log(`CORS_ORIGIN: ${process.env.CORS_ORIGIN ?? 'NOT SET'}`);
  logger.log(`NODE_ENV: ${process.env.NODE_ENV ?? 'NOT SET'}`);

  // Increase payload limit for large canvases with thousands of elements
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  // Enable CORS for frontend
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:3001',
    'https://canva-x-ai.vercel.app', // Production frontend
  ];

  // Allow additional origins via env var
  if (process.env.CORS_ORIGIN) {
    allowedOrigins.push(process.env.CORS_ORIGIN);
  }

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation pipe using class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
  console.log(
    `CanvasX API running on http://localhost:${process.env.PORT ?? 3000}`,
  );
}
bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
