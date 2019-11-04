import {
  Client,
  ServiceCodeEnum,
  PackagingTypeCodeEnum,
  CustomerClassificationCodeEnum,
  PickupTypeCodeEnum
} from "ups/client";

const WAREHOUSE: UPS.Address = {
  AddressLine: [
    "124 Greenmount Rd",
  ],
  City: "Rising Sun",
  StateProvinceCode: "MD",
  PostalCode: "21911",
  CountryCode: "US"
};

const WHOLESALE_NINJAS: UPS.Shipper = {
  Name: "Wholesale Ninjas",
  Address: WAREHOUSE,
};

interface RateOptions {
  negotiatedRates?: boolean,
  gfpRates?: boolean
}

const getPackageWeight = (shippingItem: CarrierService.ShippingItem): UPS.Weight => {
  let factors: Map<CarrierService.WeightUnits, number> = new Map([
    [ 'pounds', 1 ],
    [ 'ounces', 1/16 ],
    [ 'grams', 0.0022 ],
    [ 'kilograms', 2.2 ],
  ]);
  let factor: number = factors.get(shippingItem.weightUnits) as number;
  return {
    UnitOfMeasurement: {
      Code: "LBS",
    },
    Weight: (factor*shippingItem.weight).toString(2)
  };
};

const getPackageDimensions = (shippingItem: CarrierService.ShippingItem): UPS.Dimensions => {
  let factors: Map<CarrierService.DimensionUnits, number> = new Map([
    [ 'inches', 1 ],
    [ 'feet', 12 ],
    [ 'centimeters', 0.394 ]
  ]);
  return {
    UnitOfMeasurement: {
      Code: 'IN'
    },
    Height: ( (factors.get(shippingItem.heightUnits) as number) * shippingItem.height ).toString(2),
    Length: ( (factors.get(shippingItem.lengthUnits) as number) * shippingItem.length ).toString(2),
    Width: ( (factors.get(shippingItem.widthUnits) as number) * shippingItem.width ).toString(2)
  };
};

export const packageFromOrderItemShippingItem = (shippingItem: CarrierService.ShippingItem): UPS.Package => {
  const pkg: UPS.Package = {
    PackagingType: {
      Code: PackagingTypeCodeEnum.PACKAGE
    },
    Dimensions: getPackageDimensions(shippingItem),
    PackageWeight: getPackageWeight(shippingItem),
  };

  return pkg;
};

const getBestRate = (rateResponses: Array<UPS.Rating.RateResponse>): number => {
  const charges: Array<number> = rateResponses.map( r => {
    const rateValue: string = r.RatedShipment.NegotiatedRateCharges ? r.RatedShipment.NegotiatedRateCharges.TotalCharge.MonetaryValue : r.RatedShipment.TotalCharges.MonetaryValue;
    return parseFloat(rateValue);
  });

  charges.sort().reverse();
  return charges[0];
};

interface RateProviderOptions {
  accountNumber: string,
  accessLicenseNumber: string,
  user: string,
  password: string,
  development: boolean
}

export class UpsRateProvider implements CarrierService.RateProvider {

  private accountNumber: UPS.AccountNumber;
  private client: UPS.ApiClient;

  constructor(options: RateProviderOptions) {

    this.accountNumber = options.accountNumber;

    this.client = new Client({
      accountNumber: options.accountNumber,
      accessLicenseNumber: options.accessLicenseNumber,
      user: options.user,
      password: options.password,
      development: options.development,
    });
    
  }

  private buildRateRequest(packages: Array<UPS.Package>, contact: CarrierService.Contact, options: RateOptions = {}): UPS.Rating.RateRequest {

    const rateRequest: UPS.Rating.RateRequest = {
      Request: {
        RequestOption: 'Rate'
      },
      PickupType: {
        Code: PickupTypeCodeEnum.DAILY_PICKUP
      },
      Shipment: {
        Package: packages,
        ShipTo: {
          Name: contact.name || '',
          Address: {
            AddressLine: [contact.address1, contact.address2 as string, contact.address3 as string].filter( x => x ),
            City: contact.city,
            StateProvinceCode: contact.province,
            PostalCode: contact.postal_code,
            CountryCode: "US"
          }
        },
        ShipFrom: WHOLESALE_NINJAS,
        Shipper: WHOLESALE_NINJAS,
        Service: {
          Code: ServiceCodeEnum.GROUND
        },
        ShipmentRatingOptions: {
          RateChartIndicator: "1"
        },
        TaxInformationIndicator: "1"
      },
    };
  
    if(options.negotiatedRates) {
      rateRequest.CustomerClassification = {
        Code: CustomerClassificationCodeEnum.NEGOTIATED_RATES,
      };
      rateRequest.Shipment.ShipmentRatingOptions.NegotiatedRatesIndicator = "1";
  
      Object.assign(rateRequest.Shipment.Shipper, { ShipperNumber: this.accountNumber });
    }
  
    if(options.gfpRates) {
      rateRequest.Shipment.ShipmentRatingOptions.FRSShipmentIndicator = "1";
      rateRequest.Shipment.FRSPaymentInformation = {
        Type: {
          Code: "01",
        },
        AccountNumber: this.accountNumber,
        Address: {
          PostalCode: WHOLESALE_NINJAS.Address.PostalCode,
          CountryCode: WHOLESALE_NINJAS.Address.CountryCode
        }
      };
    }
  
    return rateRequest;
  }

  public async getGfpRate(packages: Array<UPS.Package>, destination: CarrierService.Contact ): Promise<UPS.Rating.RateResponse> {
    packages.forEach( p => {
      if(!p.Commodity || !p.Commodity.FreightClass) {
        p.Commodity = { FreightClass: "60" };
      }
    });
    const rateRequest: UPS.Rating.RateRequest = this.buildRateRequest( packages, destination, { negotiatedRates: true, gfpRates: true } );
    return this.client.ratingRequest(rateRequest);
  }

  public async getNegotiatedRate(packages: Array<UPS.Package>, destination: CarrierService.Contact ): Promise<UPS.Rating.RateResponse> {
    const rateRequest: UPS.Rating.RateRequest = this.buildRateRequest( packages, destination, { negotiatedRates: true, gfpRates: false } );
    return this.client.ratingRequest(rateRequest);
  }

  public async getBoxRate( shippingItems: Array<CarrierService.ShippingItem>, destination: CarrierService.Contact ): Promise<number> {
    if(!shippingItems.length) {
      return 0;
    }

    const packages: Array<UPS.Package> = shippingItems.map(packageFromOrderItemShippingItem);

    const rateResponses: Array<UPS.Rating.RateResponse> = await Promise.all([
      this.getNegotiatedRate( packages , destination ),
      this.getGfpRate( packages, destination )
    ]);

    const bestRate: number = getBestRate(rateResponses);

    return bestRate;
  }
  public async getPalletRates( _palletItems: Array<CarrierService.ShippingItem>, _destination: CarrierService.Contact ): Promise< Array<CarrierService.PalletRate> > {
    return [];
  }
}