import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { TeamService } from './team.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/interfaces/jwt-payload.interface';
import {
  SendInvitationDto,
  InvitationResponseDto,
  InvitationDetailsDto,
  ValidateInvitationResponseDto,
  TeamMemberDto,
} from '../dto/invitation.dto';

@ApiTags('Team Management')
@Controller('team')
@UseGuards(ThrottlerGuard)
export class TeamController {
  constructor(private teamService: TeamService) {}

  @Post('invite')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send invitation to join team (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Invitation sent successfully',
    type: InvitationResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Only admins can send invitations' })
  @ApiResponse({ status: 409, description: 'User already exists or invitation pending' })
  async sendInvitation(
    @CurrentUser() user: AuthenticatedUser,
    @Body() sendInvitationDto: SendInvitationDto,
  ): Promise<InvitationResponseDto> {
    return this.teamService.sendInvitation(user.id, sendInvitationDto);
  }

  @Get('validate-invitation')
  @ApiOperation({ summary: 'Validate invitation token' })
  @ApiQuery({ name: 'token', description: 'Invitation token' })
  @ApiResponse({
    status: 200,
    description: 'Invitation validation result',
    type: ValidateInvitationResponseDto,
  })
  async validateInvitation(
    @Query('token') token: string,
  ): Promise<ValidateInvitationResponseDto> {
    return this.teamService.validateInvitation(token);
  }

  @Get('invitations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all company invitations (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'List of company invitations',
    type: [InvitationDetailsDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Only admins can view invitations' })
  async getCompanyInvitations(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<InvitationDetailsDto[]> {
    return this.teamService.getCompanyInvitations(user.id);
  }

  @Delete('invitations/:invitationId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel pending invitation (Admin only)' })
  @ApiParam({ name: 'invitationId', description: 'Invitation ID' })
  @ApiResponse({
    status: 200,
    description: 'Invitation cancelled successfully',
    type: InvitationResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Only admins can cancel invitations' })
  @ApiResponse({ status: 404, description: 'Invitation not found' })
  async cancelInvitation(
    @CurrentUser() user: AuthenticatedUser,
    @Param('invitationId') invitationId: string,
  ): Promise<InvitationResponseDto> {
    return this.teamService.cancelInvitation(user.id, invitationId);
  }

  @Get('members')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all team members' })
  @ApiResponse({
    status: 200,
    description: 'List of team members',
    type: [TeamMemberDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTeamMembers(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TeamMemberDto[]> {
    return this.teamService.getTeamMembers(user.id);
  }

  @Patch('members/:memberId/deactivate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate team member (Admin only)' })
  @ApiParam({ name: 'memberId', description: 'Team member ID' })
  @ApiResponse({
    status: 200,
    description: 'Team member deactivated successfully',
    type: InvitationResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Only admins can deactivate members' })
  @ApiResponse({ status: 404, description: 'Team member not found' })
  async deactivateTeamMember(
    @CurrentUser() user: AuthenticatedUser,
    @Param('memberId') memberId: string,
  ): Promise<InvitationResponseDto> {
    return this.teamService.deactivateTeamMember(user.id, memberId);
  }

  @Patch('members/:memberId/reactivate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reactivate team member (Admin only)' })
  @ApiParam({ name: 'memberId', description: 'Team member ID' })
  @ApiResponse({
    status: 200,
    description: 'Team member reactivated successfully',
    type: InvitationResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Only admins can reactivate members' })
  @ApiResponse({ status: 404, description: 'Team member not found' })
  async reactivateTeamMember(
    @CurrentUser() user: AuthenticatedUser,
    @Param('memberId') memberId: string,
  ): Promise<InvitationResponseDto> {
    return this.teamService.reactivateTeamMember(user.id, memberId);
  }
}

