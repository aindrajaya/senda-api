import { Injectable, HttpException } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { buildProxyAxiosConfig } from '../../config/proxy.config';
import { EqualsMoneyAccountRegistrationDto, EqualsMoneyAccountRegistrationResponseDto } from '../../dto/equalsmoney-account.dto';

export interface CurrencyInfo {
	code: string;
	name: string;
	enabled: boolean;
	balances?: {
		available: number;
		pending: number;
	};
}

export interface CurrencyListResponse {
	success: boolean;
	message: string;
	currencies: CurrencyInfo[];
}

@Injectable()
export class EqualsMoneyService {
	constructor(private configService: ConfigService) {}

	async getAccounts(limit = 100, offset = 0, primaryEmailAddress = ''): Promise<any> {
		const baseUrl = this.configService.get<string>('EQUALSMONEY_BASE_URL') || 'https://api-sandbox.equalsmoney.com/v2';
		const url = `${baseUrl}/accounts?limit=${limit}&offset=${offset}${primaryEmailAddress ? `&primaryEmailAddress=${primaryEmailAddress}` : ''}`;
		const apiKey = this.configService.get<string>('EQUALS_MONEY_API_KEY') || 'd5cf7ede-92a5-4800-a4b3-ee6ed32a1852';
		const config = buildProxyAxiosConfig({ url, apiKey });
		try {
			const response = await axios(config);
			return response.data;
		} catch (error) {
			throw new HttpException(
				error.response?.data || error.message || 'EqualsMoney API error',
				error.response?.status || 500,
			);
		}
	}

	async onboardAccount(registrationData: EqualsMoneyAccountRegistrationDto): Promise<EqualsMoneyAccountRegistrationResponseDto> {
		const baseUrl = this.configService.get<string>('EQUALSMONEY_BASE_URL') || 'https://api-sandbox.equalsmoney.com/v2';
		const url = `${baseUrl}/onboarding`;
		const apiKey = this.configService.get<string>('EQUALS_MONEY_API_KEY') || 'd5cf7ede-92a5-4800-a4b3-ee6ed32a1852';
		
		console.log('Onboard Account - URL:', url);
		console.log('Onboard Account - API Key:', apiKey ? 'Present' : 'Missing');
		
		// Get firstName and lastName directly from the registration data
		const firstName = registrationData.contact.firstName.trim();
		const lastName = registrationData.contact.lastName.trim();

		// Use the exact structure as required by Equals Money API
		const requestBody = {
			market: registrationData.market,
			features: registrationData.features,
			accountType: registrationData.accountType.toLowerCase(), // Ensure lowercase
			contact: {
				firstName: firstName,
				lastName: lastName,
				email: registrationData.contact.email,
				phone: registrationData.contact.phone,
				dob: registrationData.contact.dob,
				address: {
					addressLine1: registrationData.contact.address.addressLine1,
					addressLine2: registrationData.contact.address.addressLine2,
					townCity: registrationData.contact.address.townCity,
					postCode: registrationData.contact.address.postCode,
					countryCode: registrationData.contact.address.countryCode,
				}
			},
			account: {
				companyName: registrationData.account.companyName,
				companyNumber: registrationData.account.companyNumber,
				incorporationDate: registrationData.account.incorporationDate,
				type: registrationData.account.type,
				website: registrationData.account.website,
				onboardingDetail: registrationData.account.onboardingDetail,
				address: {
					addressLine1: registrationData.account.address.addressLine1,
					addressLine2: registrationData.account.address.addressLine2,
					townCity: registrationData.account.address.townCity,
					postCode: registrationData.account.address.postCode,
					countryCode: registrationData.account.address.countryCode,
				}
			},
			kyc: {
				mainPurpose: registrationData.kyc.mainPurpose,
				sourceOfFunds: registrationData.kyc.sourceOfFunds,
				destinationOfFunds: registrationData.kyc.destinationOfFunds,
				currenciesRequired: registrationData.kyc.currenciesRequired,
				annualVolume: registrationData.kyc.annualVolume,
				numberOfPayments: registrationData.kyc.numberOfPayments,
			}
		};

		console.log('Request Body:', JSON.stringify(requestBody, null, 2));

		const config = buildProxyAxiosConfig({ 
			url, 
			apiKey, 
			method: 'POST', 
			data: requestBody 
		});

		console.log('Axios Config:', {
			url: config.url,
			method: config.method,
			headers: config.headers,
			hasData: !!config.data,
			hasAgent: !!config.httpsAgent
		});

		try {
			const response = await axios(config);
			console.log('Success Response:', response.status, response.data);
			return {
				success: true,
				message: 'Account registered successfully',
				accountId: response.data.id,
				customerReference: response.data.correlationId,
				status: response.data.status,
			};
		} catch (error) {
			console.error('Onboard Account Error:', {
				status: error.response?.status,
				statusText: error.response?.statusText,
				data: error.response?.data,
				errors: error.response?.data?.errors,
				message: error.message
			});
			
			// Log detailed error information if available
			if (error.response?.data?.errors) {
				console.error('Detailed validation errors:', JSON.stringify(error.response.data.errors, null, 2));
			}
			
			throw new HttpException(
				error.response?.data || error.message || 'EqualsMoney account registration failed',
				error.response?.status || 500,
			);
		}
	}

	/**
	 * Get supported currencies from EqualsMoney API
	 * DEVELOPMENT MODE: Returns static currency list without any API calls, OTP, phone, or email verification
	 */
	async getSupportedCurrencies(accountId?: string): Promise<CurrencyListResponse> {
		// DEVELOPMENT MODE: Always return static currency list 
		// No API calls, no authentication, no user verification required
		const commonCurrencies = this.getCommonSupportedCurrencies();
		
		// If accountId is provided, add mock balances for demonstration
		if (accountId) {
			const currenciesWithMockBalances = commonCurrencies.slice(0, 5).map(currency => ({
				...currency,
				balances: {
					available: Math.round(Math.random() * 10000 * 100) / 100, // Random amount with 2 decimals
					pending: Math.round(Math.random() * 100 * 100) / 100,      // Random pending with 2 decimals
				}
			}));

			return {
				success: true,
				message: `Mock account currencies retrieved for development (Account: ${accountId})`,
				currencies: currenciesWithMockBalances,
			};
		}
		
		return {
			success: true,
			message: 'Static supported currencies retrieved (Development Mode - No Auth Required)',
			currencies: commonCurrencies,
		};
	}

	/**
	 * Get common supported currencies based on EqualsMoney documentation and market data
	 */
	private getCommonSupportedCurrencies(): CurrencyInfo[] {
		return [
			{ code: 'GBP', name: 'British Pound Sterling', enabled: true },
			{ code: 'USD', name: 'US Dollar', enabled: true },
			{ code: 'EUR', name: 'Euro', enabled: true },
			{ code: 'CAD', name: 'Canadian Dollar', enabled: true },
			{ code: 'AUD', name: 'Australian Dollar', enabled: true },
			{ code: 'JPY', name: 'Japanese Yen', enabled: true },
			{ code: 'CHF', name: 'Swiss Franc', enabled: true },
			{ code: 'SEK', name: 'Swedish Krona', enabled: true },
			{ code: 'NOK', name: 'Norwegian Krone', enabled: true },
			{ code: 'DKK', name: 'Danish Krone', enabled: true },
			{ code: 'PLN', name: 'Polish Złoty', enabled: true },
			{ code: 'CZK', name: 'Czech Koruna', enabled: true },
			{ code: 'HUF', name: 'Hungarian Forint', enabled: true },
			{ code: 'BGN', name: 'Bulgarian Lev', enabled: true },
			{ code: 'RON', name: 'Romanian Leu', enabled: true },
			{ code: 'HRK', name: 'Croatian Kuna', enabled: true },
			{ code: 'NZD', name: 'New Zealand Dollar', enabled: true },
			{ code: 'SGD', name: 'Singapore Dollar', enabled: true },
			{ code: 'HKD', name: 'Hong Kong Dollar', enabled: true },
			{ code: 'ZAR', name: 'South African Rand', enabled: true },
			{ code: 'CNY', name: 'Chinese Yuan', enabled: true },
			{ code: 'INR', name: 'Indian Rupee', enabled: true },
			{ code: 'MXN', name: 'Mexican Peso', enabled: true },
			{ code: 'BRL', name: 'Brazilian Real', enabled: true },
			{ code: 'RUB', name: 'Russian Ruble', enabled: true },
			{ code: 'TRY', name: 'Turkish Lira', enabled: true },
			{ code: 'ILS', name: 'Israeli Shekel', enabled: true },
			{ code: 'AED', name: 'UAE Dirham', enabled: true },
			{ code: 'SAR', name: 'Saudi Riyal', enabled: true },
			{ code: 'QAR', name: 'Qatari Riyal', enabled: true },
		];
	}

	/**
	 * Get currency name from ISO code
	 */
	private getCurrencyName(code: string): string {
		const currencyNames: { [key: string]: string } = {
			'GBP': 'British Pound Sterling',
			'USD': 'US Dollar',
			'EUR': 'Euro',
			'CAD': 'Canadian Dollar',
			'AUD': 'Australian Dollar',
			'JPY': 'Japanese Yen',
			'CHF': 'Swiss Franc',
			'SEK': 'Swedish Krona',
			'NOK': 'Norwegian Krone',
			'DKK': 'Danish Krone',
			'PLN': 'Polish Złoty',
			'CZK': 'Czech Koruna',
			'HUF': 'Hungarian Forint',
			'BGN': 'Bulgarian Lev',
			'RON': 'Romanian Leu',
			'HRK': 'Croatian Kuna',
			'NZD': 'New Zealand Dollar',
			'SGD': 'Singapore Dollar',
			'HKD': 'Hong Kong Dollar',
			'ZAR': 'South African Rand',
			'CNY': 'Chinese Yuan',
			'INR': 'Indian Rupee',
			'MXN': 'Mexican Peso',
			'BRL': 'Brazilian Real',
			'RUB': 'Russian Ruble',
			'TRY': 'Turkish Lira',
			'ILS': 'Israeli Shekel',
			'AED': 'UAE Dirham',
			'SAR': 'Saudi Riyal',
			'QAR': 'Qatari Riyal',
		};

		return currencyNames[code] || code;
	}
}
