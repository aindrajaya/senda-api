import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, AppAdmin } from '../../entities';
import { JwtPayload, AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(AppAdmin)
    private appAdminRepository: Repository<AppAdmin>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    let user: User | AppAdmin | null = null;

    if (payload.userType === 'admin') {
      user = await this.appAdminRepository.findOne({
        where: { id: payload.sub, isActive: true },
      });
    } else {
      user = await this.userRepository.findOne({
        where: { id: payload.sub, isActive: true },
        relations: ['company'],
      });
    }

    if (!user) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      userType: payload.userType,
      companyId: payload.companyId,
    };
  }
}

