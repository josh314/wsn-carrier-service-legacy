
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

export interface Service {
  Code: 
    "01" | /* Next Day Air */
    "02" | /* 2nd Day Air */
    "03" | /* Ground */
    "12" | /* 3 Day Select */
    "13" | /* Next Day Air Saver */
    "14" | /* UPS Next Day Air Early */
    "59" | /* 2nd Day Air A.M. Valid international values: */
    "07" | /* Worldwide Express */
    "08" | /* Worldwide Expedited*/
    "11" | /* Standard */
    "54" | /* Worldwide Express Plus */
    "65" | /* Saver */
    "96" | /* UPS Worldwide Express Freight */
    "71"  /* UPS Worldwide Express Freight Midday Required for Rating and ignored for Shopping.*/
  Description?: string
}

/**********************************************
 * Packages
 *
 * ***/

export interface PackagingType {
  Code: 
    "00" | /* UNKNOWN  */
    "01" | /* UPS Letter  */
    "02" | /* Package  */
    "03" | /* Tube  */
    "04" | /* Pak  */
    "21" | /* Express Box  */
    "24" | /* 25KG Box  */
    "25" | /* 10KG Box  */
    "30" | /* Pallet  */
    "2a" | /* Small Express Box  */
    "2b" | /* Medium Express Box  */
    "2c"   /* Large Express Box */
  //For FRS rating requests the only valid value is customer supplied packaging “02”.
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

export interface CustomerClassification {
  Code: 
    "00" | /* Rates Associated with Shipper Number" */
    "01" | /* Daily Rates */
    "04" | /* Retail Rates */ 
    "05" | /* Regional Rates */
    "06" | /* General List Rates */
    "53"  /* Standard List Rates */
}

export interface PickupType {
  Code: 
    "01" | /* Daily Pickup (Default: used when an invalid pickup type code is provided) */
    "03" | /* Customer Counter */
    "06" | /* One Time Pickup */
    "19" | /* Letter Center */
    "20"   /* Air Service Center*/
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