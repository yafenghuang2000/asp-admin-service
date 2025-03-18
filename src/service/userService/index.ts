import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import RedisCache from '@/utils/redisCache';
import { PasswordService } from '@/utils/PasswordService';
import { LoginDto, LoginResponseDto, RegisterDto, RegisterResponseDto } from '@/dto/user.dto';
import { UserEntity } from '@/entity/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService, // 明确类型
  ) {}

  public login = async (loginDto: LoginDto): Promise<LoginResponseDto> => {
    const user = await this.userRepository.findOne({
      where: { username: loginDto.username },
    });

    if (!user) {
      throw new BadRequestException('用户不存在');
    }

    // 检查密码是否匹配
    const isMatch = await this.passwordService.comparePassword(loginDto.password, user.password);

    if (!isMatch) {
      throw new BadRequestException('密码错误');
    }

    const token = this.jwtService.sign(
      {
        id: user.id,
        username: user.username,
        timestamp: new Date().getTime(),
        nonce: Math.random().toString(36).substring(10),
      },
      { expiresIn: '24h', secret: process.env.JWT_SECRET! },
    );

    const redisKey = `token:${user.username}`;
    const redisSet = await RedisCache.set(redisKey, token, 60 * 60 * 24 * 7);
    if (!redisSet) {
      throw new BadRequestException('设置 Redis 缓存失败');
    }

    return {
      username: user.username,
      token: token,
    };
  };

  public async register(registerDto: RegisterDto): Promise<RegisterResponseDto> {
    // 检查用户是否已存在
    const existingUser = await this.userRepository.findOne({
      where: { username: registerDto.username },
    });

    if (existingUser) {
      throw new BadRequestException('用户已存在');
    }

    // 检查密码是否符合要求
    if (registerDto.password.length < 6) {
      throw new BadRequestException('密码长度必须大于6位');
    }

    // 检查邮箱是否符合要求
    if (!registerDto.email.includes('@')) {
      throw new BadRequestException('邮箱格式不正确');
    }

    // 检查手机号码是否符合要求
    const mobileRegex = /^1[3-9]\d{9}$/;
    if (registerDto.mobile_number && !mobileRegex.test(registerDto.mobile_number)) {
      throw new BadRequestException('手机号码格式不正确');
    }

    const hashedPassword = await this.passwordService.hashPassword(registerDto.password);

    try {
      const newUser = this.userRepository.create({
        username: registerDto.username,
        password: hashedPassword,
        mobile_number: registerDto.mobile_number,
        email: registerDto.email,
      });
      const savedUser = await this.userRepository.save(newUser);
      if (!savedUser) {
        new BadRequestException('用户创建失败');
      }

      return {
        username: savedUser.username,
      };
    } catch (error) {
      throw new BadRequestException(`用户创建失败: ${(error as Error).message || '未知错误'}`);
    }
  }
}
