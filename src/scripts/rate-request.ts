import { Client, PackagingTypeCodeEnum, ServiceCodeEnum } from 'ups/client';


const settings = require('../../settings');

const accessLicenseNumber: UPS.AccessLicenseNumber = settings.ups.accessLicenseNumber;
const user = settings.ups.user;
const password = settings.ups.password;

const client = new Client(settings.ups);

const packagingType: UPS.PackagingType = {
  Code: PackagingTypeCodeEnum.PACKAGE,
};

const weight: UPS.Weight = {
  UnitOfMeasurement: {
    Code: "LBS",
    // Description: "pounds"
  },
  Weight: "20.0"
};

const dimensions: UPS.Dimensions = {
  UnitOfMeasurement: {
    Code: "IN",
    Description: "inches"
  },
  Height: "18",
  Length: "18",
  Width: "18",
};

const pkg: UPS.Package = {
  PackagingType: packagingType,
  Dimensions: dimensions,
  PackageWeight: weight
};

const homeAddress: UPS.Address = {
  AddressLine: [ "308 Dallam Rd" ],
  City: "Newark",
  StateProvinceCode: "DE",
  PostalCode: "19711",
  CountryCode: "US"
};

const shipTo: UPS.ShippingLocation = {
  Name: "Josh Dawg",
  Address: homeAddress
}

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
}

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
  Package: [ pkg, pkg ],
  ShipTo: {
    Name: "Josh Dawg",
    Address: homeAddress,
  },
  ShipFrom: {
    Name: "Wholesale Ninjas",
    Address: warehouseAddress,
  },
  Shipper: shipper,
  Service: service,
};

const body: UPS.Rating.RateRequest = {
  Request: {
    // RequestAction: "Rate",
    RequestOption: "Rate",
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