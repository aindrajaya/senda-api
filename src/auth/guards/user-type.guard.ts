import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthenticatedUser } from '../../common/interfaces/jwt-payload.interface';
import { USER_TYPES_KEY } from '../decorators/user-types.decorator';

@Injectable()
export class UserTypesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredUserTypes = this.reflector.getAllAndOverride<('user' | 'admin')[]>(
      USER_TYPES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredUserTypes) {
      return true;
    }

    const { user }: { user: AuthenticatedUser } = context.switchToHttp().getRequest();
    
    if (!user) {
      return false;
    }

    return requiredUserTypes.includes(user.userType);
  }
}

