import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    // Log full error details
    this.logger.error(`[${request.method}] ${request.url} → ${status}`);
    this.logger.error(`Body: ${JSON.stringify(request.body)}`);

    if (exception instanceof Error) {
      this.logger.error(`Error: ${exception.message}`);
      this.logger.error(`Stack: ${exception.stack}`);
      // Log Prisma-specific cause
      const cause = (exception as any).cause;
      if (cause) {
        this.logger.error(`Cause: ${JSON.stringify(cause)}`);
      }
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      // Include error detail in non-500 cases, and always in dev
      ...(process.env.NODE_ENV !== 'production' || status !== 500
        ? {
            error:
              exception instanceof Error ? exception.message : String(exception),
          }
        : {}),
    });
  }
}
