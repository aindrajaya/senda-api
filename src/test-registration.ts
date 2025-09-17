import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { EqualsMoneyAccountService } from './services/equalsmoney-account.service';
import { Market, AccountType, CompanyType } from './dto/equalsmoney-account.dto';

async function testEqualsMoneyRegistration() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const equalsMoneyAccountService = app.get(EqualsMoneyAccountService);

  const testData = {
    market: Market.UK,
    features: ['payments'],
    accountType: AccountType.BUSINESS,
    contact: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@testcompany.com',
      phone: '+447123456789',
      dob: '19/01/1980',
      address: {
        addressLine1: 'Great Building',
        addressLine2: 'Greater Building',
        townCity: 'London',
        postCode: 'SE13UB',
        countryCode: 'GB'
      }
    },
    account: {
      companyName: 'Test Company Ltd',
      companyNumber: '12345678',
      incorporationDate: '2020-01-01',
      type: CompanyType.LTD,
      website: 'https://www.testcompany.com',
      onboardingDetail: 'Test company for EqualsMoney integration',
      address: {
        addressLine1: 'Business Building',
        townCity: 'London',
        postCode: 'E1 6AN',
        countryCode: 'GB'
      }
    },
    kyc: {
      mainPurpose: ['Investment'],
      sourceOfFunds: ['salary'],
      destinationOfFunds: ['GB'],
      currenciesRequired: ['GBP'],
      annualVolume: 'Less than £10,000',
      numberOfPayments: 'More than 20 payments'
    }
  };

  try {
    const result = await equalsMoneyAccountService.registerAccount(testData);
    console.log('Registration successful:', result);
  } catch (error) {
    console.error('Registration failed:', error.message);
  }

  await app.close();
}

// Only run if this script is called directly
if (require.main === module) {
  testEqualsMoneyRegistration();
}
