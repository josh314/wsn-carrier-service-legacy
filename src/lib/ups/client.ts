import * as rp from 'request-promise';

/****************************************************************
 * Enums for API code values
 * 
 ******/

// Disabling the unused-vars rule just for the enum definitions
/* eslint-disable no-unused-vars */

export enum ServiceCodeEnum {
  NEXT_DAY_AIR = "01",
  TWO_DAY_AIR = "02",
  GROUND = "03",
  THREE_DAY_SELECT = "12",
  NEXT_DAY_AIR_SAVER = "13",
  UPS_NEXT_DAY_AIR_EARLY = "14",
  TWO_DAY_AIR_AM_VALID_INTERNATIONAL_VALUES = "59",
  WORLDWIDE_EXPRESS = "07",
  WORLDWIDE_EXPEDITED = "08",
  STANDARD = "11",
  WORLDWIDE_EXPRESS_PLUS = "54",
  SAVER = "65",
  UPS_WORLDWIDE_EXPRESS_FREIGHT = "96",
  UPS_WORLDWIDE_EXPRESS_FREIGHT_MIDDAY = "71" // Required for Rating and ignored for Shopping.
}

//For FRS rating requests the only valid value is customer supplied packaging “02”.
export enum PackagingTypeCodeEnum {
  UNKNOWN = "00",
  UPS_LETTER = "01",
  PACKAGE = "02",
  TUBE = "03",
  PAK = "04",
  EXPRESS_BOX = "21",
  TWENTY_FIVE_KG_BOX = "24",
  TEN_KG_BOX = "25",
  PALLET = "30",
  SMALL_EXPRESS_BOX = "2a",
  MEDIUM_EXPRESS_BOX = "2b",
  LARGE_EXPRESS_BOX = "2c"
}

export const enum CustomerClassificationCodeEnum {
  NEGOTIATED_RATES = "00", /* Rates Associated with Shipper Number" */
  DAILY_RATES = "01",
  RETAIL_RATES = "04",
  REGIONAL_RATES = "05",
  GENERAL_LIST_RATES = "06",
  STANDARD_LIST_RATES = "53",
}

export const enum PickupTypeCodeEnum {
  DAILY_PICKUP = "01", /* Default: used when an invalid pickup type code is provided */
  CUSTOMER_COUNTER = "03",
  ONE_TIME_PICKUP = "06",
  LETTER_CENTER = "19",
  AIR_SERVICE_CENTER = "20",
}

/* eslint-enable no-unused-vars */

/***************************************************
 * Client class
 * 
 *********/

interface ClientSettings {
  accountNumber: UPS.AccountNumber,
  accessLicenseNumber: UPS.AccessLicenseNumber, // The Access Key
  user: UPS.User,
  password: UPS.Password,
}

type Endpoint = 'Rate' | 'AV';

export class Client implements UPS.ApiClient {
  private accountNumber: UPS.AccountNumber;
  private accessLicenseNumber: UPS.AccessLicenseNumber; // The Access Key
  private user: UPS.User;
  private password: UPS.Password;
  private baseUrl: string;


  constructor(settings: ClientSettings) {
    this.accountNumber = settings.accountNumber;
    this.accessLicenseNumber = settings.accessLicenseNumber;
    this.user = settings.user;
    this.password = settings.password;

    this.baseUrl = process.env.NODE_ENV === 'development' ? 'https://wwwcie.ups.com/rest' : 'https://onlinetools.ups.com/rest';
  }

  public async request(endpoint: Endpoint, body: UPS.ApiRequestBody): Promise<UPS.ApiResponseContainer> {
    if(process.env.DEBUG) {
      console.log('Api Request:');
      console.log( JSON.stringify(body, null, 2) );
    }

    const req: rp.Options = {
      method: 'POST',
      uri: `${this.baseUrl}/${endpoint}`,
      headers: {
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: body,
      json: true,
    };
    const apiResp: UPS.ApiResponseContainer = await rp(req);


    if(process.env.DEBUG) {
      console.log('UPS Response:');
      try {
        console.log(JSON.stringify(apiResp, null, 2));
      }
      catch(e) {
        console.log(apiResp);
      }
    }

    return apiResp;
  }

  public async ratingRequest(rateRequest: UPS.Rating.RateRequest): Promise<UPS.Rating.RateResponse> {

    const rateRequestBody: UPS.Rating.RateRequestBody = {
      UPSSecurity: {
        UsernameToken: {
          Username: this.user,
          Password: this.password
        },
        ServiceAccessToken: {
          AccessLicenseNumber: this.accessLicenseNumber
        }
      },
      RateRequest: rateRequest
    };

    const resp: UPS.ApiResponseContainer = await this.request('Rate', rateRequestBody);
    return (resp as UPS.Rating.RateResponseContainer).RateResponse;
  }
}