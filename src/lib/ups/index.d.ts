
/*************************************************
 * "Enums"
 *
 * Note that "Enum" types are basically fake enums
 * whose actual enum implmentation are done elsewhere.
 * One has to manually match up the string values here
 * with the implementation of the actual enum.
 * These types are not exported; they only are defined here
 * to provide type information for properties of interfaces
 * are defined in this file.
 * This is all because one can't properly define a real
 * enum in a *.d.ts file.
 *
 ******/


type ServiceCodeEnum =
  "01" | // NEXT_DAY_AIR
  "02" | // TWO_DAY_AIR
  "03" | // GROUND
  "12" | // THREE_DAY_SELECT
  "13" | // NEXT_DAY_AIR_SAVER
  "14" | // UPS_NEXT_DAY_AIR_EARLY
  "59" | // TWO_DAY_AIR_AM_VALID_INTERNATIONAL_VALUES
  "07" | // WORLDWIDE_EXPRESS
  "08" | // WORLDWIDE_EXPEDITED
  "11" | // STANDARD
  "54" | // WORLDWIDE_EXPRESS_PLUS
  "65" | // SAVER
  "96" | // UPS_WORLDWIDE_EXPRESS_FREIGHT
  "71"  // UPS_WORLDWIDE_EXPRESS_FREIGHT_MIDDAY
;

type PackagingTypeCodeEnum =
  "00" | // UNKNOWN
  "01" | // UPS_LETTER
  "02" | // PACKAGE
  "03" | // TUBE
  "04" | // PAK
  "21" | // EXPRESS_BOX
  "24" | // TWENTY_FIVE_KG_BOX
  "25" | // TEN_KG_BOX
  "30" | // PALLET
  "2a" | // SMALL_EXPRESS_BOX
  "2b" | // MEDIUM_EXPRESS_BOX
  "2c"   // LARGE_EXPRESS_BOX
;

type CustomerClassificationCodeEnum =
  "00" | // NEGOTIATED_RATES
  "01" | // DAILY_RATES
  "04" | // RETAIL_RATES
  "05" | // REGIONAL_RATES
  "06" | // GENERAL_LIST_RATES
  "53"   // STANDARD_LIST_RATES
;

type PickupTypeCodeEnum =
  "01" | // DAILY_PICKUP
  "03" | // CUSTOMER_COUNTER
  "06" | // ONE_TIME_PICKUP
  "19" | // LETTER_CENTER
  "20"   // AIR_SERVICE_CENTER
;

// There are many possible alert codes. Only recording ones we might actual use in our logic
type AlertCodeEnum =
  "110920" | // When user indicated Residential indicator is different from AMS Classification.
  "112153" | // Unregistered User
  "112154" | // FBR688: FULL RATES RETURNED. CUSTOMER COULD NOT BE FOUND FOR THAT ZIP CODE."
  "112155" | // Destination is a rural point
  "119084" | // Missing / Invalid Shipper Number. Returned rates are Retail Rates.
  "120902"   // Negotiated rates cannot be returned without a valid account number
;

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
  Description?: "kilograms" | "pounds" | "Kilograms" | "Pounds"
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

export interface Service {
  Code: ServiceCodeEnum,
  Description?: string
}

/**********************************************
 * Packages
 *
 * ***/

export interface PackagingType {
  Code: PackagingTypeCodeEnum
}

export interface Package {
  PackagingType: PackagingType,
  Dimensions: Dimensions,
  PackageWeight: Weight,
  Commodity?: Commodity
  // PackageServiceOptions?:
}

export type FreightClass = "60";

export interface Commodity {
  FreightClass: FreightClass,
  NMFC?: {
    PrimeCode: string,
    SubCode?: string
  }
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


// The actual string values for these indicators don't seem to matter
export type NegotiatedRatesIndicator = "1" | undefined;
export type FRSShipmentIndicator = "1" | undefined;
export type RateChartIndicator = "1" | undefined;


export interface ShipmentRatingOptions {
  NegotiatedRatesIndicator?: NegotiatedRatesIndicator,
  FRSShipmentIndicator?: FRSShipmentIndicator,
  RateChartIndicator?: RateChartIndicator
}

export interface FRSPaymentInformation {
  Type:{
    Code: 
      "01" | //Prepaid
      "02" | //FreightCollect
      "03"  //BillThirdParty
  },
  AccountNumber: string,
  Address?: {
    PostalCode?: string,
    CountryCode: string
  }
}

export interface Shipment  {
  Shipper: Shipper,
  ShipTo: ShippingLocation,
  ShipFrom: ShippingLocation,
  Service?: Service,
  Package: Array<Package> | Package ,
  ShipmentRatingOptions: ShipmentRatingOptions,
  FRSPaymentInformation?: FRSPaymentInformation,
  TaxInformationIndicator?: "1", //value doesn't matter: "1" chosen as a convention
}

export interface CustomerClassification {
  Code: CustomerClassificationCodeEnum
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

  export interface Charge {
    CurrencyCode: string, // "USD"
    MonetaryValue: string
  }

  export interface RatedPackage {
    TransportationCharges: Charge,
    ServiceOptionsCharges: Charge,
    TotalCharges: Charge,
    Weight: string,
    BillingWeight: Weight
  }

  export type RateChartEnum =
    "1" | // Daily Rates
    "3" | // Standard List Rates
    "4"   // Retail Rates
  ;

  //TODO
  export interface RateResponse {
    Response: {
      ResponseStatus: { //TODO
        Code: string, // 1 = Successful
        Description: string // Success for valid
      },
      Alert?: Array<{ "Code": AlertCodeEnum , "Description": string}>,
      AlertDetail?: any, // IGNORE
      TransactionReference: string //TODO
    },
    RatedShipment: {
      RateChart: RateChartEnum,
      Service: Service,
      RatedShipmentAlert: Array<{ Code: AlertCodeEnum  , Description: string }>,
      BillingWeight: Weight,
      TransportationCharges: Weight,
      ServiceOptionsCharges: Weight,
      TotalCharges: Charge,
      NegotiatedRateCharges: {
        TotalCharge: Charge,
      }
      FRSShipmentData: {
        TransportationCharges: {
          GrossCharge: Charge,
          DiscountAmount: Charge,
          DiscountPercentage: string,
          NetCharge: Charge
        }
      },
      RatedPackage: RatedPackage | Array<RatedPackage>
    }
  }

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