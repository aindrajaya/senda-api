import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../entities';

export interface CompanyHouseDirector {
  name: string;
  officer_role: string;
  appointed_on?: string;
  resigned_on?: string;
  date_of_birth?: {
    month: number;
    year: number;
  };
  nationality?: string;
  country_of_residence?: string;
  occupation?: string;
}

export interface CompanyHouseData {
  company_number: string;
  company_name: string;
  company_status: string;
  company_status_detail?: string;
  date_of_creation: string;
  type: string;
  registered_office_address: {
    address_line_1?: string;
    address_line_2?: string;
    locality?: string;
    region?: string;
    postal_code?: string;
    country: string;
  };
  accounts?: {
    next_accounts?: {
      due_on: string;
      period_end_on: string;
      period_start_on: string;
    };
    last_accounts?: {
      made_up_to: string;
      type: string;
    };
    accounting_reference_date?: {
      day: string;
      month: string;
    };
  };
  annual_return?: {
    last_made_up_to: string;
    next_due: string;
  };
  confirmation_statement?: {
    last_made_up_to: string;
    next_due: string;
  };
  sic_codes?: string[];
  has_been_liquidated?: boolean;
  has_charges?: boolean;
  has_insolvency_history?: boolean;
  description?: string;
}

export interface CompanyDataResponse {
  message: string;
  data: CompanyHouseData | null;
  director: CompanyHouseDirector[];
  success: boolean;
}

@Injectable()
export class CompanyService {
  private readonly logger = new Logger(CompanyService.name);

  constructor(
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    private configService: ConfigService,
  ) {}

  async getCompanyData(businessId: string): Promise<CompanyDataResponse> {
    if (!businessId || typeof businessId !== 'string') {
      throw new HttpException(
        {
          message: 'Business ID is required and must be a string',
          success: false,
        },
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const apiKey = this.configService.get<string>('COMPANIES_HOUSE_API_KEY');
    
    if (!apiKey) {
      this.logger.error('Companies House API key not configured');
      throw new HttpException(
        {
          message: 'Service configuration error',
          success: false,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    try {
      // Get director details first
      const directors = await this.getDirectorDetails(businessId, apiKey);

      // Get company details
      const companyData = await this.fetchCompanyDetails(businessId, apiKey);

      if (!companyData) {
        return {
          message: 'Unable to retrieve information. Please try again after 30 minutes',
          data: null,
          director: [],
          success: true,
        };
      }

      return {
        message: 'Company details retrieved successfully',
        data: companyData,
        director: directors,
        success: true,
      };
    } catch (error) {
      this.logger.error(`Error fetching company data: ${error.message}`, error.stack);
      
      if (error.message.includes('timeout') || error.message.includes('ETIMEDOUT')) {
        throw new HttpException(
          {
            message: 'Request timed out. Please try again later.',
            data: null,
            success: false,
          },
          HttpStatus.REQUEST_TIMEOUT,
        );
      }

      throw new HttpException(
        {
          message: 'Unable to retrieve information. Please try again after 30 minutes',
          data: null,
          success: false,
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }

  private async fetchCompanyDetails(companyNumber: string, apiKey: string): Promise<CompanyHouseData | null> {
    const url = `https://api.company-information.service.gov.uk/company/${companyNumber}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
          'Accept': 'application/json',
        },
        // Set timeout for 30 seconds
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Check for API errors
      if (data.errors && data.errors.length > 0) {
        this.logger.warn(`Companies House API returned errors: ${JSON.stringify(data.errors)}`);
        return null;
      }

      return data as CompanyHouseData;
    } catch (error) {
      if (error.name === 'TimeoutError' || error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  private async getDirectorDetails(companyNumber: string, apiKey: string): Promise<CompanyHouseDirector[]> {
    const url = `https://api.company-information.service.gov.uk/company/${companyNumber}/officers`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`,
          'Accept': 'application/json',
        },
        // Set timeout for 30 seconds
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        if (response.status === 404) {
          return [];
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Check for API errors
      if (data.errors && data.errors.length > 0) {
        this.logger.warn(`Companies House Officers API returned errors: ${JSON.stringify(data.errors)}`);
        return [];
      }

      // Process and format the officers/directors data
      const officers = data.items || [];
      return officers.map((officer: any) => ({
        name: this.formatDirectorName(officer),
        officer_role: officer.officer_role || '',
        appointed_on: officer.appointed_on,
        resigned_on: officer.resigned_on,
        date_of_birth: officer.date_of_birth,
        nationality: officer.nationality,
        country_of_residence: officer.country_of_residence,
        occupation: officer.occupation,
      }));
    } catch (error) {
      if (error.name === 'TimeoutError' || error.name === 'AbortError') {
        this.logger.warn(`Timeout fetching directors for company ${companyNumber}`);
        return [];
      }
      
      this.logger.warn(`Error fetching directors for company ${companyNumber}: ${error.message}`);
      return [];
    }
  }

  /**
   * Save company data to local database (optional)
   */
  async saveCompanyData(companyData: CompanyHouseData): Promise<Company> {
    const existingCompany = await this.companyRepository.findOne({
      where: { companyNumber: companyData.company_number },
    });

    if (existingCompany) {
      // Update existing company
      existingCompany.companyName = companyData.company_name;
      existingCompany.address = this.formatAddress(companyData.registered_office_address);
      return await this.companyRepository.save(existingCompany);
    } else {
      // Create new company
      const newCompany = this.companyRepository.create({
        companyNumber: companyData.company_number,
        companyName: companyData.company_name,
        address: this.formatAddress(companyData.registered_office_address),
        directors: [], // You might want to extract director names here
      });
      
      return await this.companyRepository.save(newCompany);
    }
  }

  private formatAddress(address: CompanyHouseData['registered_office_address']): string {
    const parts = [
      address.address_line_1,
      address.address_line_2,
      address.locality,
      address.region,
      address.postal_code,
      address.country,
    ].filter(Boolean);

    return parts.join(', ');
  }

  /**
   * Get director names only (useful for simple lists)
   */
  async getDirectorNames(businessId: string): Promise<string[]> {
    const apiKey = this.configService.get<string>('COMPANIES_HOUSE_API_KEY');
    
    if (!apiKey) {
      this.logger.error('Companies House API key not configured');
      return [];
    }

    try {
      const directors = await this.getDirectorDetails(businessId, apiKey);
      return directors
        .filter(director => director.name && director.name.trim() !== '')
        .map(director => director.name);
    } catch (error) {
      this.logger.error(`Error fetching director names: ${error.message}`);
      return [];
    }
  }

  /**
   * Format director name from Companies House API response
   * The API can return names in different formats, so we need to handle them properly
   */
  private formatDirectorName(officer: any): string {
    if (!officer) {
      return '';
    }

    // If name is already a string, return it
    if (typeof officer.name === 'string') {
      return officer.name;
    }

    // If name is an object with title, forenames, surname
    if (officer.name && typeof officer.name === 'object') {
      const { title, forenames, surname } = officer.name;
      const nameParts = [title, forenames, surname].filter(Boolean);
      return nameParts.join(' ');
    }

    // Fallback: try to construct from individual fields
    const title = officer.title || '';
    const forenames = officer.forenames || '';
    const surname = officer.surname || '';
    
    const nameParts = [title, forenames, surname].filter(Boolean);
    return nameParts.join(' ') || 'Name not available';
  }
}
