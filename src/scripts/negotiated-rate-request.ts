import { 
  Client,
  CustomerClassificationCodeEnum,
  PackagingTypeCodeEnum,
  ServiceCodeEnum,
  PickupTypeCodeEnum
} from 'ups/client';


const settings = require('../../settings');

const client = new Client(settings.ups);

const packagingType: UPS.PackagingType = {
  Code: PackagingTypeCodeEnum.PACKAGE,
};

const pkgs: Array<UPS.Package> = [
  {
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
      Weight: "20.0"
    }
  },
  {
    PackagingType: packagingType,
    Dimensions: {
      UnitOfMeasurement: {
        Code: "IN",
        Description: "inches"
      },
      Height: "16",
      Length: "14",
      Width: "12",
    },
    PackageWeight: {
      UnitOfMeasurement: {
        Code: "LBS",
        // Description: "pounds"
      },
      Weight: "1"
    }
  },
  {
    PackagingType: packagingType,
    Dimensions: {
      UnitOfMeasurement: {
        Code: "IN",
        Description: "inches"
      },
      Height: "12",
      Length: "10",
      Width: "6",
    },
    PackageWeight: {
      UnitOfMeasurement: {
        Code: "LBS",
        // Description: "pounds"
      },
      Weight: "1"
    }
  },
];

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
    NegotiatedRatesIndicator: "1",
    RateChartIndicator: "1"
  }
};

const body: UPS.Rating.RateRequest = {
  Request: {
    // RequestAction: "Rate",
    RequestOption: "Rate",
  },
  PickupType: {
    Code: PickupTypeCodeEnum.DAILY_PICKUP
  },
  CustomerClassification: {
    Code: CustomerClassificationCodeEnum.NEGOTIATED_RATES,
  },
  Shipment: shipment,
};

client.ratingRequest(body)
  .then(resp=> {
    if(!process.env.DEBUG) { // Will already print the response via debug option in the client.request function
      console.log( typeof resp === 'object' ? JSON.stringify(resp, null, 2) : resp );
    }
  })
  .catch(console.error);