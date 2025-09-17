import { SetMetadata } from '@nestjs/common';

export const USER_TYPES_KEY = 'userTypes';
export const UserTypes = (...userTypes: ('user' | 'admin')[]) => 
  SetMetadata(USER_TYPES_KEY, userTypes);

