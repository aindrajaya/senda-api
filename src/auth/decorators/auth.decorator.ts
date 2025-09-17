import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { UserTypesGuard } from '../guards/user-type.guard';
import { Roles } from './roles.decorator';
import { UserTypes } from './user-types.decorator';
import { UserRole } from '../../common/enums';

export function Auth(...roles: UserRole[]) {
  const decorators = [
    UseGuards(JwtAuthGuard, RolesGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
  ];

  if (roles.length > 0) {
    decorators.push(Roles(...roles));
  }

  return applyDecorators(...decorators);
}

export function AuthUserTypes(...userTypes: ('user' | 'admin')[]) {
  const decorators = [
    UseGuards(JwtAuthGuard, UserTypesGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
  ];

  if (userTypes.length > 0) {
    decorators.push(UserTypes(...userTypes));
  }

  return applyDecorators(...decorators);
}

export function AuthAdmin() {
  return applyDecorators(
    UseGuards(JwtAuthGuard, RolesGuard),
    Roles(UserRole.ADMIN),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
  );
}

export function AuthAppAdmin() {
  return applyDecorators(
    UseGuards(JwtAuthGuard, UserTypesGuard),
    UserTypes('admin'),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
  );
}

