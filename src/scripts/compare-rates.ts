import { UpsRateProvider } from 'ups/rate-provider';
import { PackagingTypeCodeEnum } from 'ups/client';

const settings = require('../../settings');

const providerOptions = Object.assign(
  { development: true },
  settings.ups
);

const rateProvider = new UpsRateProvider(providerOptions);

const destination: CarrierService.Contact = {
  address1: "308 Dallam Rd",
  city: "Newark",
  province: "DE",
  postal_code: "19711",
  country: "US"
};

const pkg: UPS.Package = {
  PackagingType: {
    Code: PackagingTypeCodeEnum.PACKAGE,
  },
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

const packages: Array<UPS.Package>= Array.from({length:8}).map(x => pkg);

rateProvider.getGfpRate( packages, destination )
  .then(resp=> {
    // if(!process.env.DEBUG) { // Will already print the response via debug option in the client.request function
    //   console.log( typeof resp === 'object' ? JSON.stringify(resp, null, 2) : resp );
    // }
  })
  .catch(console.error);