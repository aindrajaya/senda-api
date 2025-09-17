import { Injectable, BadRequestException, NotFoundException, HttpException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EqualsMoneyAccount } from '../entities/equalsmoney-account.entity';
import { User } from '../entities/user.entity';
import { Company } from '../entities/company.entity';
import { EqualsMoneyAccountRegistrationDto } from '../dto/equalsmoney-account.dto';
import { EqualsMoneyService } from './eqm/equalsmoney.service';
import { PasswordUtil } from '../common/utils/password.util';
import { UserRole, VerificationStatus } from '../common/enums';

@Injectable()
export class EqualsMoneyAccountService {
  constructor(
    @InjectRepository(EqualsMoneyAccount)
    private equalsMoneyAccountRepository: Repository<EqualsMoneyAccount>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    private equalsMoneyService: EqualsMoneyService,
  ) {}

	async getAllPendingAccounts(relations: string[] = []): Promise<EqualsMoneyAccount[]> {
		return this.equalsMoneyAccountRepository.find({
			where: [
				{ isVerified: false },
				{ status: VerificationStatus.PENDING }
			],
			relations	
		});
	}

	async updateAccountIdByCustomerReference(customerReference: string, equalsMoneyAccountId: string): Promise<EqualsMoneyAccount> {
		const accounts = await this.getAllPendingAccounts();

		const account = accounts.find(acc => {
			try {
				const response = JSON.parse(acc.equalsMoneyResponse ?? '{}');
				return response.customerReference === customerReference;
			} catch {
				return false;
			}
		});

		if (!account) {
			throw new NotFoundException('EqualsMoney account not found');
		}

		account.equalsMoneyAccountId = equalsMoneyAccountId;
		return this.equalsMoneyAccountRepository.save(account);
	}

  async syncAllAccountIdByCompanyNumberAndContactPhone(): Promise<any> {
    const accounts = await this.getAllPendingAccounts(['user', 'user.company']);

    const limit = 100;
    let offset = 0;
    let hasMore = true;

    try {
      while (hasMore) {
        const listAccount = await this.equalsMoneyService.getAccounts(limit, offset);

        if (!listAccount.rows || listAccount.rows.length === 0) {
          break;
        }

        for (const eqmAccount of listAccount.rows) {
          for (const account of accounts) {
            const { user: { company: { companyNumber } }, contactPhone } = account;

            const equalsMoneyAccount = eqmAccount.details.companiesHouseId === companyNumber && eqmAccount.details.telephoneNumber === contactPhone;

            if (equalsMoneyAccount) {
              await this.updateAccountStatus(account.id, VerificationStatus.VERIFIED, eqmAccount.id);
            }
          }
        }

        offset += limit;

        hasMore = offset < listAccount.count;
      }

      return { success: true, message: 'Account synchronization completed' };
    } catch (error) {
      throw new HttpException(
        error.response?.data || error.message || 'EqualsMoney API error',
        error.response?.status || 500,
      );
    }
  }
  
  async accountActivatedWebhook(body: any): Promise<void> {
    try {
      await this.updateAccountIdByCustomerReference(body.correlationId, body.id);
      console.log('Account updated successfully for correlationId:', body.correlationId);
    } catch (err) {
      console.error('Failed to update account:', err);
      throw new BadRequestException('Failed to update account');
    }
  }
  
  async registerAccount(accountData: EqualsMoneyAccountRegistrationDto) {
    // Get firstName and lastName directly from the contact data
    const firstName = accountData.contact.firstName.trim();
    const lastName = accountData.contact.lastName.trim();

    if (!firstName || !lastName) {
      throw new BadRequestException('Both first name and last name are required');
    }

    // Check if user with this email already exists
    const existingUser = await this.userRepository.findOne({
      where: { email: accountData.contact.email }
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // Check if company with this business name already exists
    const existingCompany = await this.companyRepository.findOne({
      where: { companyName: accountData.account.companyName }
    });

    let company: Company;
    
    if (existingCompany) {
      company = existingCompany;
    } else {
      // Create new company
      company = this.companyRepository.create({
        companyNumber: accountData.account.companyNumber,
        companyName: accountData.account.companyName,
        address: `${accountData.account.address.addressLine1}, ${accountData.account.address.townCity}, ${accountData.account.address.postCode}, ${accountData.account.address.countryCode}`,
        directors: [`${firstName} ${lastName}`],
      });
      
      company = await this.companyRepository.save(company);
    }

    // Create user from contact information
    const hashedPassword = await PasswordUtil.hash('TempPassword123!'); // Generate temporary password
    
    const user = this.userRepository.create({
      firstName: firstName,
      lastName: lastName,
      email: accountData.contact.email,
      phone: accountData.contact.phone,
      password: hashedPassword,
      role: UserRole.ADMIN, // Company admin since they're registering the business
      emailVerificationStatus: VerificationStatus.PENDING,
      phoneVerificationStatus: VerificationStatus.PENDING,
      isActive: true,
      companyId: company.id,
      company: company,
    });

    const savedUser = await this.userRepository.save(user);

    // Call EqualsMoney API to create the account
    let equalsMoneyResponse: any;
    let apiSuccess = false;
    try {
      equalsMoneyResponse = await this.equalsMoneyService.onboardAccount(accountData);
      apiSuccess = equalsMoneyResponse.success === true;
      console.log('EqualsMoney API success:', equalsMoneyResponse);
    } catch (error) {
      console.error('EqualsMoney API error:', error);
      // Continue with local registration even if API fails
      equalsMoneyResponse = { 
        success: false,
        error: error.message, 
        apiCallFailed: true 
      };
    }

    // Create EqualsMoney account record
    const equalsMoneyAccount = this.equalsMoneyAccountRepository.create({
      // Account details
      accountType: accountData.accountType,
      businessLegalName: accountData.account.companyName,
      businessTradingName: accountData.account.companyName, // Use company name as trading name
      businessDescription: accountData.account.onboardingDetail || 'Business account',
      businessWebsite: accountData.account.website || '',
      businessAddress: accountData.account.address.addressLine1,
      businessCity: accountData.account.address.townCity,
      businessState: '', // Not available in current DTO
      businessPostcode: accountData.account.address.postCode,
      businessCountry: accountData.account.address.countryCode,

      // Contact details
      contactFirstName: firstName,
      contactLastName: lastName,
      contactEmail: accountData.contact.email,
      contactPhone: accountData.contact.phone,
      contactJobTitle: 'Company Representative', // Default value
      contactAddress: accountData.contact.address.addressLine1,
      contactCity: accountData.contact.address.townCity,
      contactState: '', // Not available in current DTO
      contactPostcode: accountData.contact.address.postCode,
      contactCountry: accountData.contact.address.countryCode,
      contactDateOfBirth: accountData.contact.dob,

      // KYC details (map available fields)
      kycDocumentType: 'passport', // Default value
      kycDocumentNumber: '', // Not available in current DTO
      kycDocumentCountry: accountData.contact.address.countryCode,
      kycDocumentExpiryDate: '', // Empty string instead of null

      // API response and status
      equalsMoneyResponse: JSON.stringify(equalsMoneyResponse),
      equalsMoneyAccountId: equalsMoneyResponse?.accountId || null,
      isVerified: apiSuccess && equalsMoneyResponse?.status === 'verified',
      status: equalsMoneyResponse?.apiCallFailed ? 'api_error' : 
              apiSuccess ? (equalsMoneyResponse?.status || 'pending') : 'pending',

      // Link to user
      userId: savedUser.id,
      user: savedUser,
    });

    const savedAccount = await this.equalsMoneyAccountRepository.save(equalsMoneyAccount);

    return {
      success: true,
      message: 'Account registered successfully',
      user: {
        id: savedUser.id,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        email: savedUser.email,
        role: savedUser.role,
        company: {
          id: company.id,
          name: company.companyName,
        }
      },
      equalsMoneyAccount: {
        id: savedAccount.id,
        status: savedAccount.status,
        equalsMoneyAccountId: savedAccount.equalsMoneyAccountId,
        apiSuccess: apiSuccess,
      },
      equalsMoneyResponse: equalsMoneyResponse?.apiCallFailed 
        ? { error: 'EqualsMoney API call failed, but account was saved locally' }
        : equalsMoneyResponse,
      temporaryPassword: 'TempPassword123!', // Return this so user knows initial password
    };
  }

  async getAccountByUserId(userId: string): Promise<EqualsMoneyAccount> {
    const account = await this.equalsMoneyAccountRepository.findOne({
      where: { userId },
      relations: ['user', 'user.company'],
    });

    if (!account) {
      throw new NotFoundException('EqualsMoney account not found for this user');
    }

    return account;
  }

  async getAllAccounts(): Promise<EqualsMoneyAccount[]> {
    return this.equalsMoneyAccountRepository.find({
      relations: ['user', 'user.company'],
    });
  }

  async updateAccountStatus(accountId: string, status: string, equalsMoneyAccountId?: string): Promise<EqualsMoneyAccount> {
    const account = await this.equalsMoneyAccountRepository.findOne({
      where: { id: accountId }
    });

    if (!account) {
      throw new NotFoundException('EqualsMoney account not found');
    }

    account.status = status;
    if (equalsMoneyAccountId) {
      account.equalsMoneyAccountId = equalsMoneyAccountId;
    }
    if (status === 'approved') {
      account.isVerified = true;
    }

    return this.equalsMoneyAccountRepository.save(account);
  }
}
