import { Body, Controller, InternalServerErrorException, Post } from '@nestjs/common';
import { ApiBody, ApiOperation } from '@nestjs/swagger';
import { LoginDto, LoginResponseDto, RegisterDto, RegisterResponseDto } from '@/dto/user.dto';
import { UserService } from '@/service/userService';

@Controller('user')
export class UserController {
  constructor(private readonly useService: UserService) {}
  @Post('login')
  @ApiOperation({ summary: '用户登录' })
  @ApiBody({
    description: '登录请求体',
    type: LoginDto,
  })
  public async login(@Body() body: LoginDto): Promise<LoginResponseDto> {
    try {
      return await this.useService.login(body);
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  @Post('register')
  @ApiOperation({ summary: '注册用户' })
  @ApiBody({
    description: '注册用户请求体',
    type: RegisterDto,
  })
  public async register(@Body() registerDto: RegisterDto): Promise<RegisterResponseDto> {
    try {
      return await this.useService.register(registerDto);
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}
