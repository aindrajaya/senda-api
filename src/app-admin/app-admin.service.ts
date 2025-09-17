import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppAdmin, User, Company, Invitation } from '../entities';
import { InvitationStatus } from '../common/enums';
import { PasswordUtil } from '../common/utils/password.util';
import {
  CreateAppAdminDto,
  UpdateAppAdminDto,
  AppAdminResponseDto,
  AppAdminStatsDto,
} from '../dto/app-admin.dto';

@Injectable()
export class AppAdminService {
  private readonly logger = new Logger(AppAdminService.name);

  constructor(
    @InjectRepository(AppAdmin)
    private appAdminRepository: Repository<AppAdmin>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    @InjectRepository(Invitation)
    private invitationRepository: Repository<Invitation>,
  ) {}

  async createAppAdmin(createDto: CreateAppAdminDto): Promise<AppAdminResponseDto> {
    // Check if email already exists
    const existingAdmin = await this.appAdminRepository.findOne({
      where: { email: createDto.email },
    });

    if (existingAdmin) {
      throw new ConflictException('Email address already exists');
    }

    try {
      // Hash password
      const hashedPassword = await PasswordUtil.hash(createDto.password);

      // Create app admin
      const appAdmin = this.appAdminRepository.create({
        firstName: createDto.firstName,
        lastName: createDto.lastName,
        email: createDto.email,
        password: hashedPassword,
      });

      const savedAdmin = await this.appAdminRepository.save(appAdmin);

      return this.mapToResponseDto(savedAdmin);
    } catch (error) {
      this.logger.error('Error creating app admin:', error);
      throw new BadRequestException('Failed to create app admin');
    }
  }

  async getAllAppAdmins(): Promise<AppAdminResponseDto[]> {
    const admins = await this.appAdminRepository.find({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      order: { createdAt: 'DESC' },
    });

    return admins.map(admin => this.mapToResponseDto(admin));
  }

  async getAppAdminById(id: string): Promise<AppAdminResponseDto> {
    const admin = await this.appAdminRepository.findOne({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!admin) {
      throw new NotFoundException('App admin not found');
    }

    return this.mapToResponseDto(admin);
  }

  async updateAppAdmin(id: string, updateDto: UpdateAppAdminDto): Promise<AppAdminResponseDto> {
    const admin = await this.appAdminRepository.findOne({ where: { id } });

    if (!admin) {
      throw new NotFoundException('App admin not found');
    }

    // Check if email is being updated and if it already exists
    if (updateDto.email && updateDto.email !== admin.email) {
      const existingAdmin = await this.appAdminRepository.findOne({
        where: { email: updateDto.email },
      });

      if (existingAdmin) {
        throw new ConflictException('Email address already exists');
      }
    }

    try {
      // Update admin
      Object.assign(admin, updateDto);
      const updatedAdmin = await this.appAdminRepository.save(admin);

      return this.mapToResponseDto(updatedAdmin);
    } catch (error) {
      this.logger.error('Error updating app admin:', error);
      throw new BadRequestException('Failed to update app admin');
    }
  }

  async deleteAppAdmin(id: string): Promise<{ success: boolean; message: string }> {
    const admin = await this.appAdminRepository.findOne({ where: { id } });

    if (!admin) {
      throw new NotFoundException('App admin not found');
    }

    try {
      await this.appAdminRepository.remove(admin);

      return {
        success: true,
        message: 'App admin deleted successfully',
      };
    } catch (error) {
      this.logger.error('Error deleting app admin:', error);
      throw new BadRequestException('Failed to delete app admin');
    }
  }

  async getSystemStats(): Promise<AppAdminStatsDto> {
    try {
      const [
        totalCompanies,
        totalUsers,
        activeUsers,
        pendingInvitations,
        totalAppAdmins,
      ] = await Promise.all([
        this.companyRepository.count(),
        this.userRepository.count(),
        this.userRepository.count({ where: { isActive: true } }),
        this.invitationRepository.count({ where: { status: InvitationStatus.PENDING } }),
        this.appAdminRepository.count({ where: { isActive: true } }),
      ]);

      return {
        totalCompanies,
        totalUsers,
        activeUsers,
        pendingInvitations,
        totalAppAdmins,
      };
    } catch (error) {
      this.logger.error('Error getting system stats:', error);
      throw new BadRequestException('Failed to get system statistics');
    }
  }

  async getAllCompanies(): Promise<any[]> {
    const companies = await this.companyRepository.find({
      relations: ['users'],
      select: {
        id: true,
        companyName: true,
        companyNumber: true,
        address: true,
        createdAt: true,
        users: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          isActive: true,
        },
      },
      order: { createdAt: 'DESC' },
    });

    return companies.map(company => ({
      ...company,
      userCount: company.users.length,
      activeUserCount: company.users.filter(user => user.isActive).length,
    }));
  }

  async getAllUsers(): Promise<any[]> {
    const users = await this.userRepository.find({
      relations: ['company'],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        emailVerificationStatus: true,
        phoneVerificationStatus: true,
        isActive: true,
        createdAt: true,
        company: {
          id: true,
          companyName: true,
          companyNumber: true,
        },
      },
      order: { createdAt: 'DESC' },
    });

    return users;
  }

  private mapToResponseDto(admin: AppAdmin): AppAdminResponseDto {
    return {
      id: admin.id,
      firstName: admin.firstName,
      lastName: admin.lastName,
      email: admin.email,
      isActive: admin.isActive,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    };
  }
}

