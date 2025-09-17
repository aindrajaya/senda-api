import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { User, Company, Invitation } from '../entities';
import { InvitationStatus, UserRole } from '../common/enums';
import { EmailService } from '../services/email/email.service';
import {
  SendInvitationDto,
  InvitationResponseDto,
  InvitationDetailsDto,
  ValidateInvitationResponseDto,
  TeamMemberDto,
} from '../dto/invitation.dto';

@Injectable()
export class TeamService {
  private readonly logger = new Logger(TeamService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    @InjectRepository(Invitation)
    private invitationRepository: Repository<Invitation>,
    private emailService: EmailService,
    private configService: ConfigService,
  ) {}

  async sendInvitation(
    inviterId: string,
    sendInvitationDto: SendInvitationDto,
  ): Promise<InvitationResponseDto> {
    // Get inviter details
    const inviter = await this.userRepository.findOne({
      where: { id: inviterId },
      relations: ['company'],
    });

    if (!inviter) {
      throw new NotFoundException('Inviter not found');
    }

    // Check if inviter has admin role
    if (inviter.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only company admins can send invitations');
    }

    // Check if user with this email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: sendInvitationDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Check if there's already a pending invitation for this email
    const existingInvitation = await this.invitationRepository.findOne({
      where: {
        email: sendInvitationDto.email,
        companyId: inviter.companyId,
        status: InvitationStatus.PENDING,
      },
    });

    if (existingInvitation && existingInvitation.expiresAt > new Date()) {
      throw new ConflictException('Pending invitation already exists for this email');
    }

    try {
      // Cancel existing invitation if expired
      if (existingInvitation) {
        existingInvitation.status = InvitationStatus.CANCELLED;
        await this.invitationRepository.save(existingInvitation);
      }

      // Create new invitation
      const token = uuidv4();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

      const invitation = this.invitationRepository.create({
        email: sendInvitationDto.email,
        token,
        expiresAt,
        invitedById: inviterId,
        companyId: inviter.companyId,
      });

      const savedInvitation = await this.invitationRepository.save(invitation);

      // Generate invitation link
      const baseUrl = this.configService.get<string>('APP_BASE_URL', 'http://localhost:3000');
      const invitationLink = `${baseUrl}/register/team-member?token=${token}`;

      // Send invitation email
      const emailSent = await this.emailService.sendInvitationEmail(
        sendInvitationDto.email,
        `${inviter.firstName} ${inviter.lastName}`,
        inviter.company.companyName,
        invitationLink,
      );

      if (!emailSent) {
        // Remove invitation if email failed
        await this.invitationRepository.remove(savedInvitation);
        return {
          success: false,
          message: 'Failed to send invitation email',
        };
      }

      return {
        success: true,
        message: 'Invitation sent successfully',
        invitationId: savedInvitation.id,
      };
    } catch (error) {
      this.logger.error('Error sending invitation:', error);
      throw new BadRequestException('Failed to send invitation');
    }
  }

  async validateInvitation(token: string): Promise<ValidateInvitationResponseDto> {
    const invitation = await this.invitationRepository.findOne({
      where: { token, status: InvitationStatus.PENDING },
      relations: ['invitedBy', 'company'],
    });

    if (!invitation) {
      return {
        valid: false,
        message: 'Invalid or expired invitation',
      };
    }

    if (invitation.expiresAt < new Date()) {
      return {
        valid: false,
        message: 'Invitation has expired',
      };
    }

    const invitationDetails: InvitationDetailsDto = {
      id: invitation.id,
      email: invitation.email,
      token: invitation.token,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      acceptedAt: invitation.acceptedAt,
      invitedByName: `${invitation.invitedBy.firstName} ${invitation.invitedBy.lastName}`,
      companyName: invitation.company.companyName,
      createdAt: invitation.createdAt,
    };

    return {
      valid: true,
      message: 'Invitation is valid',
      invitation: invitationDetails,
    };
  }

  async getCompanyInvitations(userId: string): Promise<InvitationDetailsDto[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only company admins can view invitations');
    }

    const invitations = await this.invitationRepository.find({
      where: { companyId: user.companyId },
      relations: ['invitedBy', 'company'],
      order: { createdAt: 'DESC' },
    });

    return invitations.map((invitation) => ({
      id: invitation.id,
      email: invitation.email,
      token: invitation.token,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      acceptedAt: invitation.acceptedAt,
      invitedByName: `${invitation.invitedBy.firstName} ${invitation.invitedBy.lastName}`,
      companyName: invitation.company.companyName,
      createdAt: invitation.createdAt,
    }));
  }

  async cancelInvitation(userId: string, invitationId: string): Promise<InvitationResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only company admins can cancel invitations');
    }

    const invitation = await this.invitationRepository.findOne({
      where: {
        id: invitationId,
        companyId: user.companyId,
        status: InvitationStatus.PENDING,
      },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found or already processed');
    }

    invitation.status = InvitationStatus.CANCELLED;
    await this.invitationRepository.save(invitation);

    return {
      success: true,
      message: 'Invitation cancelled successfully',
    };
  }

  async getTeamMembers(userId: string): Promise<TeamMemberDto[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const teamMembers = await this.userRepository.find({
      where: { companyId: user.companyId },
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
      },
      order: { createdAt: 'ASC' },
    });

    return teamMembers.map((member) => ({
      id: member.id,
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      phone: member.phone,
      role: member.role,
      emailVerificationStatus: member.emailVerificationStatus,
      phoneVerificationStatus: member.phoneVerificationStatus,
      isActive: member.isActive,
      createdAt: member.createdAt,
    }));
  }

  async deactivateTeamMember(
    adminId: string,
    memberId: string,
  ): Promise<InvitationResponseDto> {
    const admin = await this.userRepository.findOne({
      where: { id: adminId },
    });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    if (admin.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only company admins can deactivate team members');
    }

    const member = await this.userRepository.findOne({
      where: {
        id: memberId,
        companyId: admin.companyId,
      },
    });

    if (!member) {
      throw new NotFoundException('Team member not found');
    }

    if (member.role === UserRole.ADMIN) {
      throw new ForbiddenException('Cannot deactivate company admin');
    }

    member.isActive = false;
    await this.userRepository.save(member);

    return {
      success: true,
      message: 'Team member deactivated successfully',
    };
  }

  async reactivateTeamMember(
    adminId: string,
    memberId: string,
  ): Promise<InvitationResponseDto> {
    const admin = await this.userRepository.findOne({
      where: { id: adminId },
    });

    if (!admin) {
      throw new NotFoundException('Admin not found');
    }

    if (admin.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only company admins can reactivate team members');
    }

    const member = await this.userRepository.findOne({
      where: {
        id: memberId,
        companyId: admin.companyId,
      },
    });

    if (!member) {
      throw new NotFoundException('Team member not found');
    }

    member.isActive = true;
    await this.userRepository.save(member);

    return {
      success: true,
      message: 'Team member reactivated successfully',
    };
  }
}

