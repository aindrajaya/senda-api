import { UserRole } from '../enums';

export interface JwtPayload {
  sub: string; // user ID
  email: string;
  role?: UserRole; // for regular users
  userType: 'user' | 'admin'; // to distinguish between regular users and app admins
  companyId?: string; // for regular users
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role?: UserRole;
  userType: 'user' | 'admin';
  companyId?: string;
}

