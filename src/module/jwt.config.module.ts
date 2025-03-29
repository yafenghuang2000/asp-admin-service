import {
  CanActivate,
  ExecutionContext,
  Global,
  Injectable,
  Module,
  SetMetadata,
} from '@nestjs/common';
import { AuthGuard, PassportStrategy, PassportModule } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import * as process from 'node:process';

@Global()
@Module({
  imports: [
    PassportModule.register({
      defaultStrategy: 'jwt',
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? '',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  exports: [JwtModule],
})
export class JwtGlobalModule {}

/**
 * 跳过jwt验证
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const setPublic = (): MethodDecorator & ClassDecorator => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * jwt验证
 */
@Injectable()
export class JwtAuthenticationGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  public canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }
    return super.canActivate(context) as Promise<boolean>;
  }
}

/**
 * JWT策略类，用于验证JWT的有效性
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? '',
    });
  }

  public validate(payload: unknown): unknown {
    return payload;
  }
}

/**
 * JWT守卫类，用于保护需要认证的路由
 */
interface IJwtPayload {
  userId: number;
  username: string;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  // 实现CanActivate接口，用于定义守卫逻辑
  constructor(
    private jwtService: JwtService, // JwtService用于处理JWT相关的操作
    private reflector: Reflector, // Reflector用于反射操作，这里未使用
  ) {}

  public canActivate(context: ExecutionContext): boolean {
    // 从上下文中获取HTTP请求对象
    const request: Request = context.switchToHttp().getRequest();
    try {
      // 从请求头中提取JWT令牌
      const token = this.extractTokenFromHeader(request);
      if (!token) return false;
      // 验证JWT令牌，获取令牌的负载信息
      // 将负载信息存储在请求对象中，以便后续中间件或路由处理器使用
      request.user = this.jwtService.verify<IJwtPayload>(token);
      return true;
    } catch (err) {
      console.log('Can not activate jwt guard', err);
      // 返回false，表示请求未通过守卫
      return false;
    }
  }

  // 从请求头中提取JWT令牌的私有方法
  private extractTokenFromHeader(request: Request): string | undefined {
    // 获取Authorization请求头
    const authorizationHeader = request.get('Authorization');
    // 如果Authorization头不是字符串类型，返回undefined
    if (typeof authorizationHeader !== 'string') return undefined;
    const [type, token] = authorizationHeader.split(' ');
    if (type !== 'Bearer') return undefined;
    return token;
  }
}
