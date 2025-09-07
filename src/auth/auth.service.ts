import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { jwtConstants } from './constants';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async signIn(
    email: string,
    pass: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<any> {
    const user = (await this.usersService.findByEmail(email)) as User;

    if (!user) {
      throw new UnauthorizedException();
    } else if (!(await user.validatePassword(pass))) {
      throw new UnauthorizedException();
    }

    const payload = { id: user.id, email: user.email };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: jwtConstants.secret,
      expiresIn: jwtConstants.accessTokenExpiresIn,
    });

    const refreshToken = await this.generateRefreshToken(
      user.id,
      userAgent,
      ipAddress,
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken.token,
      expires_in: this.parseExpirationTime(jwtConstants.accessTokenExpiresIn),
    };
  }

  async generateRefreshToken(
    userId: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<RefreshToken> {
    const token = randomBytes(40).toString('hex');
    const expiresAt = new Date();
    const expireDays = this.parseExpirationTime(
      jwtConstants.refreshTokenExpiresIn,
    );
    expiresAt.setTime(expiresAt.getTime() + expireDays * 1000);

    const refreshToken = this.refreshTokenRepository.create({
      token,
      userId,
      expiresAt,
      userAgent,
      ipAddress,
    });

    return await this.refreshTokenRepository.save(refreshToken);
  }

  async refreshAccessToken(refreshToken: string): Promise<any> {
    const storedToken = await this.refreshTokenRepository.findOne({
      where: { token: refreshToken, isRevoked: false },
      relations: ['user'],
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (storedToken.expiresAt < new Date()) {
      await this.refreshTokenRepository.update(storedToken.id, {
        isRevoked: true,
      });
      throw new UnauthorizedException('Refresh token expired');
    }

    const payload = { id: storedToken.user.id, email: storedToken.user.email };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: jwtConstants.secret,
      expiresIn: jwtConstants.accessTokenExpiresIn,
    });

    return {
      access_token: accessToken,
      expires_in: this.parseExpirationTime(jwtConstants.accessTokenExpiresIn),
    };
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { token: refreshToken },
      { isRevoked: true },
    );
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { userId, isRevoked: false },
      { isRevoked: true },
    );
  }

  private parseExpirationTime(expiration: string): number {
    const unit = expiration.slice(-1);
    const value = parseInt(expiration.slice(0, -1));

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        return 900; // 15 minutes default
    }
  }
}
