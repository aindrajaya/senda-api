import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company, User, Invitation } from '../entities';
import { UserRole, VerificationStatus, OtpType, InvitationStatus } from '../common/enums';
import { PasswordUtil } from '../common/utils/password.util';
import { OtpService } from '../services/otp/otp.service';
import {
  RegisterCompanyDto,
  RegisterTeamMemberDto,
  RegistrationResponseDto,
} from '../dto/auth.dto';
import { VerifyOtpDto, OtpResponseDto } from '../dto/otp.dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Invitation)
    private invitationRepository: Repository<Invitation>,
    private otpService: OtpService,
  ) { }

  async registerCompany(registerDto: RegisterCompanyDto): Promise<RegistrationResponseDto> {
    // Check if company number already exists
    const existingCompany = await this.companyRepository.findOne({
      where: { companyNumber: registerDto.companyNumber },
    });

    if (existingCompany) {
      throw new ConflictException('Company number already registered');
    }

    // Check if admin email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.adminEmail },
    });

    if (existingUser) {
      throw new ConflictException('Email address already registered');
    }

    try {
      // Create company
      const company = this.companyRepository.create({
        companyNumber: registerDto.companyNumber,
        companyName: registerDto.companyName,
        address: registerDto.address,
        directors: registerDto.directors,
      });

      const savedCompany = await this.companyRepository.save(company);

      // Hash password
      const hashedPassword = await PasswordUtil.hash(registerDto.adminPassword);

      // Create admin user
      const adminUser = this.userRepository.create({
        firstName: registerDto.adminFirstName,
        lastName: registerDto.adminLastName,
        email: registerDto.adminEmail,
        phone: registerDto.adminPhone,
        password: hashedPassword,
        role: UserRole.ADMIN,
        companyId: savedCompany.id,
      });

      const savedUser = await this.userRepository.save(adminUser);

      // Send verification OTPs
      await this.otpService.generateAndSendOtp(
        OtpType.EMAIL_VERIFICATION,
        savedUser.email,
        undefined,
        savedUser.id,
      );

      await this.otpService.generateAndSendOtp(
        OtpType.PHONE_VERIFICATION,
        undefined,
        savedUser.phone,
        savedUser.id,
      );

      return {
        success: true,
        message: 'Company registered successfully. Please verify your email and phone.',
        userId: savedUser.id,
        companyId: savedCompany.id,
      };
    } catch (error) {
      this.logger.error('Error registering company:', error);
      throw new BadRequestException('Failed to register company');
    }
  }

  async registerTeamMember(registerDto: RegisterTeamMemberDto): Promise<RegistrationResponseDto> {
    // Find and validate invitation
    const invitation = await this.invitationRepository.findOne({
      where: {
        token: registerDto.invitationToken,
        status: InvitationStatus.PENDING,
      },
      relations: ['company'],
    });

    if (!invitation) {
      throw new NotFoundException('Invalid or expired invitation');
    }

    if (invitation.expiresAt < new Date()) {
      throw new BadRequestException('Invitation has expired');
    }

    if (invitation.email !== registerDto.email) {
      throw new BadRequestException('Email does not match invitation');
    }

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email address already registered');
    }

    try {
      // Hash password
      const hashedPassword = await PasswordUtil.hash(registerDto.password);

      // Create team member user
      const teamMember = this.userRepository.create({
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        email: registerDto.email,
        phone: registerDto.phone,
        password: hashedPassword,
        role: UserRole.MEMBER,
        companyId: invitation.companyId,
      });

      const savedUser = await this.userRepository.save(teamMember);

      // Update invitation status
      invitation.status = InvitationStatus.ACCEPTED;
      invitation.acceptedAt = new Date();
      await this.invitationRepository.save(invitation);

      // Send verification OTPs
      await this.otpService.generateAndSendOtp(
        OtpType.EMAIL_VERIFICATION,
        savedUser.email,
        undefined,
        savedUser.id,
      );

      await this.otpService.generateAndSendOtp(
        OtpType.PHONE_VERIFICATION,
        undefined,
        savedUser.phone,
        savedUser.id,
      );

      return {
        success: true,
        message: 'Team member registered successfully. Please verify your email and phone.',
        userId: savedUser.id,
        companyId: invitation.companyId,
      };
    } catch (error) {
      this.logger.error('Error registering team member:', error);
      throw new BadRequestException('Failed to register team member');
    }
  }

  async sendOtpEmailBeforeRegistration(email: string): Promise<OtpResponseDto> {
    if (!email || typeof email !== 'string') {
      throw new BadRequestException('Email is required');
    }
    // Optionally: validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestException('Invalid email format');
    }

    return await this.otpService.generateAndSendOtp(
      OtpType.EMAIL_VERIFICATION,
      email,
      undefined,
      undefined,
    );
  }

  async verifyEmailBeforeRegistration(verifyDto: VerifyOtpDto): Promise<OtpResponseDto> {
    const result = await this.otpService.verifyOtp(
      verifyDto.code,
      OtpType.EMAIL_VERIFICATION,
      undefined,
      undefined,
      verifyDto.email,
    );

    if(!result.success) {
      throw new BadRequestException(result.message);
    }
    
    return result;
  }

  async verifyEmail(userId: string, verifyDto: VerifyOtpDto): Promise<OtpResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const result = await this.otpService.verifyOtp(
      verifyDto.code,
      OtpType.EMAIL_VERIFICATION,
      userId,
      undefined,
      user.email,
    );

    if (result.success) {
      // Update user verification status
      user.emailVerificationStatus = VerificationStatus.VERIFIED;
      user.emailVerifiedAt = new Date();
      await this.userRepository.save(user);
    }

    return result;
  }

  async verifyPhone(userId: string, verifyDto: VerifyOtpDto): Promise<OtpResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const result = await this.otpService.verifyOtp(
      verifyDto.code,
      OtpType.PHONE_VERIFICATION,
      userId,
      undefined,
      undefined,
      user.phone,
    );

    if (result.success) {
      // Update user verification status
      user.phoneVerificationStatus = VerificationStatus.VERIFIED;
      user.phoneVerifiedAt = new Date();
      await this.userRepository.save(user);
    }

    return result;
  }

  async resendVerificationOtp(userId: string, type: 'email' | 'phone'): Promise<OtpResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (type === 'email') {
      if (user.emailVerificationStatus === VerificationStatus.VERIFIED) {
        return { success: false, message: 'Email is already verified' };
      }

      return await this.otpService.generateAndSendOtp(
        OtpType.EMAIL_VERIFICATION,
        user.email,
        undefined,
        userId,
      );
    } else {
      if (user.phoneVerificationStatus === VerificationStatus.VERIFIED) {
        return { success: false, message: 'Phone is already verified' };
      }

      return await this.otpService.generateAndSendOtp(
        OtpType.PHONE_VERIFICATION,
        undefined,
        user.phone,
        userId,
      );
    }
  }

  async getUserProfile(userId: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
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
        emailVerifiedAt: true,
        phoneVerifiedAt: true,
        isActive: true,
        createdAt: true,
        company: {
          id: true,
          companyName: true,
          companyNumber: true,
          address: true,
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Check if an email address is available for registration
   */
  async checkEmailAvailability(email: string): Promise<{ 
    available: boolean; 
    message: string; 
    success: boolean;
  }> {
    if (!email || typeof email !== 'string') {
      return {
        available: false,
        message: 'Email is required and must be a valid string',
        success: false,
      };
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        available: false,
        message: 'Please provide a valid email format',
        success: false,
      };
    }

    try {
      const existingUser = await this.userRepository.findOne({
        where: { email: email.toLowerCase().trim() },
      });

      if (existingUser) {
        return {
          available: false,
          message: 'Email is already taken',
          success: true,
        };
      }

      return {
        available: true,
        message: 'Email is available',
        success: true,
      };
    } catch (error) {
      this.logger.error(`Error checking email availability: ${error.message}`, error.stack);
      return {
        available: false,
        message: 'Unable to check email availability. Please try again.',
        success: false,
      };
    }
  }
}

