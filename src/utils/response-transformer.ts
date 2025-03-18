import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { QueryFailedError } from 'typeorm';
import { plainToClass, ClassConstructor } from 'class-transformer';
import { Response } from 'express';

interface IResponseTransformer<T> {
  code: number;
  message: string;
  data: T;
}

@Injectable()
// 实现NestInterceptor接口的intercept方法，用于拦截请求和响应
export class ResponseTransformerInterceptor<T>
  implements NestInterceptor<T, IResponseTransformer<T>>
{
  public intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<IResponseTransformer<T>> {
    const ctx = context.switchToHttp();
    const response: Response = ctx.getResponse();
    return next.handle().pipe(
      map((data: T) => {
        response.status(HttpStatus.OK); // 设置 HTTP 状态码为 200
        const responseData: IResponseTransformer<T> = {
          code: 0, // 成功状态码统一为 0
          message: 'success', // 默认成功信息
          data: data,
        };
        return responseData;
      }),
      catchError((error: unknown) => {
        let message: string;
        let code: number;
        // let statusCode: number = HttpStatus.OK;
        if (error instanceof HttpException) {
          const response = error.getResponse();
          if (typeof response === 'object' && response !== null) {
            const { code: errorCode, message: errorMessage } = response as {
              code?: number;
              message?: string;
            };
            message = errorMessage ?? error.message ?? '服务错误';
            code = errorCode ?? 9000;
          } else {
            message = error.message || '服务错误';
            code = 9000;
          }
          // statusCode = HttpStatus.OK;
        } else if (error instanceof QueryFailedError) {
          message = '数据库操作失败：' + error.message; // 添加数据库错误详情
          code = 9001; // 自定义数据库错误码
          // statusCode = HttpStatus.OK;
        } else {
          message = '服务错误';
          code = 9000;
          // statusCode = HttpStatus.OK;
        }
        return throwError(
          () =>
            new HttpException(
              {
                code,
                message,
                data: null,
              },
              HttpStatus.OK,
            ),
        );
      }),
    );
  }

  private baseTransformResponse<T extends object, V>(cls: ClassConstructor<T>, data: V): T {
    return plainToClass<T, V>(cls, data, {
      excludeExtraneousValues: true,
      exposeUnsetFields: false,
    });
  }
}
