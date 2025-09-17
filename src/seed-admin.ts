import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AppAdminService } from './app-admin/app-admin.service';

async function createInitialAdmin() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const appAdminService = app.get(AppAdminService);

  try {
    const admin = await appAdminService.createAppAdmin({
      firstName: 'Super',
      lastName: 'Admin',
      email: 'admin@company.com',
      password: 'Admin123!',
    });
    
    console.log('Initial admin created:', admin);
  } catch (error) {
    if (error.message?.includes('already exists')) {
      console.log('Admin already exists');
    } else {
      console.error('Error creating admin:', error);
    }
  }

  await app.close();
}

createInitialAdmin();
