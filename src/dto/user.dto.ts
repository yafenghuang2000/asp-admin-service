import { IsNotEmpty, IsString, IsOptional, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/**
 * 登录请求体
 */
export class LoginDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    type: String,
    description: '用户名',
    required: true,
    example: 'admin',
  })
  public username: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    type: String,
    description: '密码',
    required: true,
    example: '123456admin',
  })
  public password: string;
}

/**
 * 登录响应体
 */
export class LoginResponseDto {
  @ApiProperty({ description: '用户名' })
  @Expose()
  public username: string;

  @ApiProperty({ description: 'token' })
  @Expose()
  public token: string;
}

/**
 * 注册请求体
 */
export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    type: String,
    description: '用户名',
    required: true,
  })
  public username: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    type: String,
    description: '姓名',
    required: true,
  })
  public nickname: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    type: String,
    description: '密码',
    required: true,
  })
  public password: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    type: String,
    description: '手机号码',
    required: true,
  })
  public phone: string;

  @IsNotEmpty()
  @IsString()
  @IsEmail()
  @ApiProperty({
    type: String,
    description: '邮箱',
    required: true,
  })
  public email: string;

  @IsNotEmpty()
  @IsString()
  @IsEmail()
  @ApiProperty({
    type: String,
    description: '用户类型',
    required: true,
  })
  public type: string;

  @IsNotEmpty()
  @IsString()
  @IsEmail()
  @ApiProperty({
    type: String,
    description: '所属组织',
    required: true,
  })
  public organization: string;

  @IsNotEmpty()
  @IsString()
  @IsEmail()
  @ApiProperty({
    type: String,
    description: '是否启用',
    required: true,
  })
  public status: string;

  @IsNotEmpty()
  @IsString()
  @IsEmail()
  @ApiProperty({
    type: String,
    description: '权限列表',
    required: true,
  })
  public role: string;
}

/**
 * 注册响应体
 */
export class RegisterResponseDto {
  @ApiProperty({ description: '用户名' })
  @Expose()
  public username: string;
}
