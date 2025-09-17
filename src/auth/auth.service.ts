import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, AppAdmin } from '../entities';
import { EqualsMoneyAccount } from '../entities/equalsmoney-account.entity';
import { PasswordUtil } from '../common/utils/password.util';
import { JwtPayload, AuthenticatedUser } from '../common/interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(AppAdmin)
    private appAdminRepository: Repository<AppAdmin>,
    @InjectRepository(EqualsMoneyAccount)
    private equalsMoneyAccountRepository: Repository<EqualsMoneyAccount>,
    private jwtService: JwtService,
  ) {}

  async validateUser(
    email: string,
    password: string,
    userType: 'user' | 'admin' = 'user',
  ): Promise<AuthenticatedUser | null> {
    this.logger.log(`Login attempt - Email: ${email}, UserType: ${userType}`);
    
    let user: User | AppAdmin | null = null;

    try {
      if (userType === 'admin') {
        this.logger.log(`Searching for admin user with email: ${email}`);
        user = await this.appAdminRepository.findOne({
          where: { email, isActive: true },
        });

        if (!user) {
          this.logger.warn(`Admin user not found or inactive - Email: ${email}`);
          return null;
        }
        this.logger.log(`Admin user found - ID: ${user.id}, Email: ${user.email}`);
      } else {
        this.logger.log(`Searching for regular user with email: ${email}`);
        user = await this.userRepository.findOne({
          where: { email, isActive: true },
          relations: ['company'],
        });

        if (!user) {
          this.logger.warn(`Regular user not found or inactive - Email: ${email}`);
          return null;
        }
        this.logger.log(`Regular user found - ID: ${user.id}, Email: ${user.email}, Active: ${user.isActive}`);

        // Additional check for regular users: verify EqualsMoneyAccount status
        this.logger.log(`Checking EqualsMoneyAccount for user ID: ${user.id}`);
        const equalsMoneyAccount = await this.equalsMoneyAccountRepository.findOne({
          where: { userId: user.id },
        });

        if (!equalsMoneyAccount) {
          this.logger.error(`❌ LOGIN BLOCKED: No EqualsMoneyAccount found for user ID: ${user.id}, Email: ${email}`);
          return null;
        }

        this.logger.log(`EqualsMoneyAccount found - ID: ${equalsMoneyAccount.id}, Status: ${equalsMoneyAccount.status}, EqualsMoneyAccountId: ${equalsMoneyAccount.equalsMoneyAccountId || 'NULL'}`);

        // User can only login if they have a verified EqualsMoneyAccount or one with equalsMoneyAccountId
        if (equalsMoneyAccount.status !== 'verified' && !equalsMoneyAccount.equalsMoneyAccountId) {
          this.logger.error(`❌ LOGIN BLOCKED: EqualsMoneyAccount validation failed for user ID: ${user.id}, Email: ${email}`);
          this.logger.error(`   - Status: ${equalsMoneyAccount.status} (required: 'verified')`);
          this.logger.error(`   - EqualsMoneyAccountId: ${equalsMoneyAccount.equalsMoneyAccountId || 'NULL'} (required: not null)`);
          this.logger.error(`   - Account must be either verified OR have equalsMoneyAccountId populated`);
          return null;
        }
        
        this.logger.log(`✅ EqualsMoneyAccount validation passed for user ID: ${user.id}`);
      }

      // Validate password
      this.logger.log(`Validating password for user: ${user.email}`);
      const isPasswordValid = await PasswordUtil.compare(password, user.password);
      if (!isPasswordValid) {
        this.logger.warn(`❌ LOGIN FAILED: Invalid password for user: ${email}`);
        return null;
      }

      this.logger.log(`✅ Password validation successful for user: ${email}`);

      const authenticatedUser: AuthenticatedUser = {
        id: user.id,
        email: user.email,
        userType,
      };

      if (userType === 'user') {
        const regularUser = user as User;
        authenticatedUser.role = regularUser.role;
        authenticatedUser.companyId = regularUser.companyId;
        this.logger.log(`✅ LOGIN SUCCESSFUL: Regular user ${email} authenticated - Role: ${regularUser.role}, CompanyId: ${regularUser.companyId}`);
      } else {
        this.logger.log(`✅ LOGIN SUCCESSFUL: Admin user ${email} authenticated`);
      }

      return authenticatedUser;
    } catch (error) {
      this.logger.error(`❌ LOGIN ERROR: Exception during authentication for ${email}:`, error.message);
      this.logger.error('Stack trace:', error.stack);
      return null;
    }
  }

  async login(user: AuthenticatedUser) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      userType: user.userType,
      role: user.role,
      companyId: user.companyId,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        userType: user.userType,
        companyId: user.companyId,
      },
    };
  }

  async findUserById(id: string, userType: 'user' | 'admin'): Promise<User | AppAdmin | null> {
    if (userType === 'admin') {
      return this.appAdminRepository.findOne({
        where: { id, isActive: true },
      });
    } else {
      return this.userRepository.findOne({
        where: { id, isActive: true },
        relations: ['company'],
      });
    }
  }
}

