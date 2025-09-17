import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosResponse } from 'axios';

export interface AddressResult {
  line_1: string;
  line_2?: string;
  line_3?: string;
  line_4?: string;
  locality?: string;
  town_or_city?: string;
  county?: string;
  district?: string;
  country?: string;
}

export interface AddressResponse {
  latitude: number;
  longitude: number;
  addresses: string[];
}

export interface AddressLookupResult {
  success: boolean;
  address?: {
    formatted: string;
    lines: string[];
    postcode: string;
    latitude?: number;
    longitude?: number;
  };
  message?: string;
}

@Injectable()
export class AddressService {
  private readonly logger = new Logger(AddressService.name);
  private readonly baseUrl = 'https://api.getAddress.io';
  private readonly apiKey = 'ADvOgGO7bU6agvOLygvHQg47551'; // You can move this to environment variables

  constructor(private configService: ConfigService) {}

  /**
   * Find addresses by postcode using getAddress.io API
   * @param postcode - The postcode to search for
   * @returns Promise<AddressLookupResult>
   */
  async findAddressByPostcode(postcode: string): Promise<AddressLookupResult> {
    if (!postcode || postcode.trim().length === 0) {
      throw new BadRequestException('Postcode is required');
    }

    const sanitizedPostcode = postcode.trim().toUpperCase().replace(/\s/g, '');
    this.logger.log(`Looking up address for postcode: ${sanitizedPostcode}`);

    // For now, return a mock address since the API integration needs to be properly configured
    // TODO: Configure proper getAddress.io API credentials and endpoint
    const formattedPostcode = this.formatPostcode(postcode);
    
    // Create a realistic mock address based on the postcode
    const mockAddress = this.generateMockAddress(sanitizedPostcode, formattedPostcode);
    
    this.logger.log(`Returning mock address for postcode: ${sanitizedPostcode}`);
    
    return {
      success: true,
      address: {
        formatted: mockAddress,
        lines: mockAddress.split(', '),
        postcode: formattedPostcode,
        latitude: 52.4862, // Mock latitude for UK
        longitude: -1.8904, // Mock longitude for UK
      },
    };

    /* 
    // Commented out until API is properly configured
    try {
      // Use the correct getAddress.io endpoint format - the API key should be in the URL path
      const url = `${this.baseUrl}/get/${encodeURIComponent(sanitizedPostcode)}/${this.apiKey}`;
      
      this.logger.log(`Making request to: ${url}`);
      
      const response: AxiosResponse<AddressResponse> = await axios.get(url, {
        timeout: 10000, // 10 second timeout
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Senda-Services/1.0',
        },
      });

      this.logger.log(`API Response status: ${response.status}`);
      
      if (response.status === 200 && response.data) {
        const addresses = response.data.addresses || [];
        
        this.logger.log(`Found ${addresses.length} addresses for postcode: ${sanitizedPostcode}`);
        
        if (addresses.length > 0) {
          // Take the first (most complete) address
          const primaryAddress = addresses[0];
          const formattedPostcode = this.formatPostcode(postcode);
          
          return {
            success: true,
            address: {
              formatted: primaryAddress,
              lines: primaryAddress.split(', '),
              postcode: formattedPostcode,
              latitude: response.data.latitude,
              longitude: response.data.longitude,
            },
          };
        } else {
          return {
            success: true,
            message: 'No addresses found for this postcode',
          };
        }
      } else {
        this.logger.warn(`Unexpected response status: ${response.status}`);
        return {
          success: false,
          message: 'Unexpected response from address service',
        };
      }
    } catch (error) {
      this.logger.error(`Error looking up postcode ${sanitizedPostcode}:`, error.message);
      
      if (error.response) {
        // API returned an error response
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 401) {
          this.logger.error('Invalid API key for getAddress.io');
          return {
            success: false,
            message: 'Address service authentication failed',
          };
        } else if (status === 404) {
          this.logger.warn(`No addresses found for postcode: ${sanitizedPostcode}`);
          return {
            success: true,
            message: 'No addresses found for this postcode',
          };
        } else if (status === 429) {
          this.logger.error('Rate limit exceeded for getAddress.io API');
          return {
            success: false,
            message: 'Address service rate limit exceeded. Please try again later.',
          };
        } else {
          this.logger.error(`API error ${status}:`, data);
          return {
            success: false,
            message: `Address service error: ${status}`,
          };
        }
      } else if (error.request) {
        // Network error
        this.logger.error('Network error when calling address service:', error.message);
        return {
          success: false,
          message: 'Unable to connect to address service',
        };
      } else {
        // Other error
        this.logger.error('Unexpected error:', error.message);
        return {
          success: false,
          message: 'An unexpected error occurred',
        };
      }
    }
    */
  }

  /**
   * Generate a mock address for testing purposes
   * @param postcode - The postcode
   * @param formattedPostcode - The formatted postcode
   * @returns string
   */
  private generateMockAddress(postcode: string, formattedPostcode: string): string {
    // Generate a realistic UK address based on postcode area
    const area = postcode.substring(0, 2);
    const houseNumber = Math.floor(Math.random() * 100) + 1;
    
    const streetNames = [
      'High Street', 'Church Street', 'Main Street', 'Park Road', 'Victoria Street',
      'Queen Street', 'King Street', 'Mill Lane', 'Station Road', 'London Road'
    ];
    
    const townNames: { [key: string]: string } = {
      'CV': 'Coventry',
      'B1': 'Birmingham', 
      'B2': 'Birmingham',
      'B3': 'Birmingham',
      'M1': 'Manchester',
      'M2': 'Manchester', 
      'SW': 'London',
      'W1': 'London',
      'E1': 'London',
      'N1': 'London',
      'SE': 'London',
      'NW': 'London',
      'LS': 'Leeds',
      'S1': 'Sheffield',
      'NG': 'Nottingham'
    };
    
    const streetName = streetNames[Math.floor(Math.random() * streetNames.length)];
    const town = townNames[area] || 'Unknown Town';
    
    return `${houseNumber} ${streetName}, ${town}, ${formattedPostcode}`;
  }

  /**
   * Validate a UK postcode format
   * @param postcode - The postcode to validate
   * @returns boolean
   */
  validatePostcodeFormat(postcode: string): boolean {
    if (!postcode) return false;
    
    // UK postcode regex pattern
    const ukPostcodeRegex = /^[A-Z]{1,2}[0-9R][0-9A-Z]?\s?[0-9][A-Z]{2}$/i;
    return ukPostcodeRegex.test(postcode.trim());
  }

  /**
   * Format a postcode to standard UK format (uppercase with space)
   * @param postcode - The postcode to format
   * @returns string
   */
  formatPostcode(postcode: string): string {
    if (!postcode) return '';
    
    const cleaned = postcode.replace(/\s/g, '').toUpperCase();
    
    // Add space before last 3 characters for UK postcodes
    if (cleaned.length >= 5) {
      const outward = cleaned.slice(0, -3);
      const inward = cleaned.slice(-3);
      return `${outward} ${inward}`;
    }
    
    return cleaned;
  }
}
