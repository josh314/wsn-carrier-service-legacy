
/*************************************************
 * API Authentication & Access
 *
 * *************/

type AccountNumber = string;
type AccessLicenseNumber = string; // The Access Key
type User = string;
type Password = string;

export interface UpsSecurity {
  UsernameToken: {
    Username: User,
    Password: Password
  },
  ServiceAccessToken: {
    AccessLicenseNumber: AccessLicenseNumber
  }
}

export interface AccessRequest {
  AccessLicenseNumber: AccessLicenseNumber,
  UserId: User,
  Password: Password
}

/************************************************
 * Dimensions & Units
 *
 * */

export interface LengthUnits {
  Code: "IN",
  Description?: "inches"
}

export interface WeightUnits {
  Code: "KGS" | "LBS",
  Description?: "kilograms" | "pounds"
}

export interface Dimensions {
  UnitOfMeasurement: LengthUnits,
  Length: string,
  Width: string,
  Height: string
}

export interface Weight {
  UnitOfMeasurement: WeightUnits,
  Weight: string 
}

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

export interface Service {
  Code: ServiceCodeEnum,
  Description?: string
}

/**********************************************
 * Packages
 *
 * ***/

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

export interface PackagingType {
  Code: PackagingTypeCodeEnum
}

export interface Package {
  PackagingType: PackagingType,
  Dimensions: Dimensions,
  PackageWeight: Weight,
  // PackageServiceOptions?:
}

/***********************************************
 * Shipping
 * 
 *********/

export interface Address {
  AddressLine: Array<string>, //max 3 lines
  City: string,
  StateProvinceCode: string,
  PostalCode: string,
  CountryCode: "US"
}

export interface ShippingLocation {
  Name: string,
  Address: Address
}

export type Shipper = ShippingLocation & { ShipperNumber?: AccountNumber }


export interface ShipmentRatingOptions {
  NegotiatedRatesIndicator?: string
}

export interface Shipment  {
  Shipper: Shipper,
  ShipTo: ShippingLocation,
  ShipFrom: ShippingLocation,
  Service?: Service,
  Package: Array<Package> | Package ,
  ShipmentRatingOptions?: ShipmentRatingOptions
}

export enum CustomerClassificationCodeEnum {
  NEGOTIATED_RATES = "00", /* Rates Associated with Shipper Number" */
  DAILY_RATES = "01",
  RETAIL_RATES = "04",
  REGIONAL_RATES = "05",
  GENERAL_LIST_RATES = "06",
  STANDARD_LIST_RATES = "53",
}

export interface CustomerClassification {
  Code: CustomerClassificationCodeEnum
}

export enum PickupTypeCodeEnum {
  DAILY_PICKUP = "01", /* Default: used when an invalid pickup type code is provided */
  CUSTOMER_COUNTER = "03",
  ONE_TIME_PICKUP = "06",
  LETTER_CENTER = "19",
  AIR_SERVICE_CENTER = "20",
}

export interface PickupType {
  Code: PickupTypeCodeEnum
}

/**********************************************
 * Top-level API objects
 *
 * **********/

export class ApiClient {
  public ratingRequest(request: Rating.RateRequest): Promise<Rating.RateResponse>
}

/*************** Rating ****************/
declare namespace Rating {
  export interface Request {
    RequestAction?: string, // "AV"
    RequestOption?: "Rate" | "Shop",
    TransactionReference?: {
      CustomerContext: string
    }
    SubVersion?: string,
  }
  
  export interface RateRequest {
    Request: Request,
    PickupType?: PickupType,
    CustomerClassification?: CustomerClassification,
    Shipment: Shipment
  }
  
  export interface RateRequestBody {
    UPSSecurity: UpsSecurity,
    RateRequest: RateRequest,
  }

  //TODO
  export interface RateResponse {}

  export interface RateResponseContainer {
    RateResponse: RateResponse
  }
}

declare namespace AV {

  export interface Request {
    RequestAction: "AV",
    RequestOption?: string, // "Rate"
    TransactionReference?: {
      CustomerContext: string
    }
    SubVersion?: string,
  }

  export interface AddressValidationRequest {
    Request: Request,
    Address: {
      City: string,
      StateProvinceCode: string,
      PostalCode: string,
      CountryCode: 'US'
    }
  }
  
  export interface AddressValidationRequestBody {
    AccessRequest: AccessRequest,
    AddressValidationRequest: AddressValidationRequest,
  }

  //TODO
  export interface AddressValidationResponse {
    Response: {
      TransactionReference: string,
      ResponseStatusCode: string,
      ResponseStatusDescription: string,
    },
    AddressValidationResult?: {
      Rank: string,
      Quality: string,
      Address: {
        City: string,
        StateProvinceCode: string,
      },
      PostalCodeLowEnd: string,
      PostalCodeHighEnd: string
    }
  }

  export interface AddressValidationResponseContainer {
    AddressValidationResponse: AddressValidationResponse
  }
}

type ApiRequestBody = Rating.RateRequestBody | AV.AddressValidationRequestBody;
type ApiResponseContainer = Rating.RateResponseContainer | AV.AddressValidationResponseContainer;

export as namespace UPS;