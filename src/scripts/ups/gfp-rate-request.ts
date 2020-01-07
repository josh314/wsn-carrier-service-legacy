import {
  Client,
  PackagingTypeCodeEnum,
  ServiceCodeEnum,
  PickupTypeCodeEnum,
  CustomerClassificationCodeEnum
} from 'ups/client';


const args = require('minimist')(process.argv.slice(2), { alias: { "development": ["dev", "d"] } });

const settings = require('../../../settings');

const clientSettings = Object.assign(
  { development: args.development },
  settings.ups
);

const client = new Client( clientSettings );

const packagingType: UPS.PackagingType = {
  Code: PackagingTypeCodeEnum.PACKAGE,
};

const pkg: UPS.Package = {
  PackagingType: packagingType,
  Dimensions: {
    UnitOfMeasurement: {
      Code: "IN",
      Description: "inches"
    },
    Height: "22",
    Length: "22",
    Width: "22",
  },
  PackageWeight: {
    UnitOfMeasurement: {
      Code: "LBS",
      // Description: "pounds"
    },
    Weight: "50.0"
  },
  Commodity: {
    FreightClass: "60"
  }
};

const pkgs: Array<UPS.Package> = [];
for(let i=0; i<8; i++) {
  pkgs.push(pkg);
}

const destinationAddress: UPS.Address = {
  AddressLine: [ "308 Dallam Rd" ],
  City: "Newark",
  StateProvinceCode: "DE",
  PostalCode: "19711",
  CountryCode: "US"
};

const warehouseAddress: UPS.Address = {
  AddressLine: [
    "124 Greenmount Rd",
  ],
  City: "Rising Sun",
  StateProvinceCode: "MD",
  PostalCode: "21911",
  CountryCode: "US"
};

const shipFrom: UPS.ShippingLocation = {
  Name: "Wholesale Ninjas",
  Address: warehouseAddress,
};

const shipper: UPS.Shipper = Object.assign(
  shipFrom, 
  {
    ShipperNumber: settings.ups.account
  }
);

const service: UPS.Service = {
  Code: ServiceCodeEnum.GROUND
};

const shipment: UPS.Shipment = {
  Package: pkgs,
  ShipTo: {
    Name: "Josh Dawg",
    Address: destinationAddress,
  },
  ShipFrom: {
    Name: "Wholesale Ninjas",
    Address: warehouseAddress,
  },
  Shipper: shipper,
  Service: service,
  ShipmentRatingOptions: {
    FRSShipmentIndicator: "1",
    NegotiatedRatesIndicator: "1",
    RateChartIndicator: "1"
  },
  FRSPaymentInformation: {
    Type: {
      Code: "02"
    },
    AccountNumber: settings.accountNumber,
    Address: {
      PostalCode: "21911",
      CountryCode: "US"
    }
  }
};

const body: UPS.Rating.RateRequest = {
  Request: {
    // RequestAction: "Rate",
    RequestOption: "Rate",
    SubVersion: "1801"
  },
  PickupType: {
    Code: PickupTypeCodeEnum.DAILY_PICKUP
  },
  CustomerClassification: {
    Code: CustomerClassificationCodeEnum.NEGOTIATED_RATES,
  },
  Shipment: shipment
  // ShipmentRatingOptions: ShipmentRatingOptions,
};

client.ratingRequest(body)
  .then(resp=> {
    if(!process.env.DEBUG) { // Will already print the response via debug option in the client.request function
      console.log( typeof resp === 'object' ? JSON.stringify(resp, null, 2) : resp );
    }
  })
  .catch(console.error);