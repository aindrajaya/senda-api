import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import { SKIP_COMPANY_CHECK_KEY } from '../decorators/skip-company-check.decorator';

@Injectable()
export class CompanyOwnershipGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skipCompanyCheck = this.reflector.getAllAndOverride<boolean>(
      SKIP_COMPANY_CHECK_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (skipCompanyCheck) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser = request.user;

    if (!user) {
      return false;
    }

    // App admins can access everything
    if (user.userType === 'admin') {
      return true;
    }

    // For regular users, check if they're accessing their own company's data
    const { params, body } = request;
    
    // Check if there's a companyId in params or body
    const targetCompanyId = params.companyId || body.companyId;
    
    if (targetCompanyId && targetCompanyId !== user.companyId) {
      throw new ForbiddenException('Access denied: You can only access your own company data');
    }

    // Check if there's a userId in params and verify it belongs to the same company
    const targetUserId = params.userId || params.memberId;
    
    if (targetUserId && targetUserId !== user.id) {
      const targetUser = await this.userRepository.findOne({
        where: { id: targetUserId },
        select: ['id', 'companyId'],
      });

      if (!targetUser || targetUser.companyId !== user.companyId) {
        throw new ForbiddenException('Access denied: User not found in your company');
      }
    }

    return true;
  }
}

