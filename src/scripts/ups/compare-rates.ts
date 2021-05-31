import { UpsRateProvider } from 'ups/rate-provider';
import { PackagingTypeCodeEnum } from 'ups/client';



const args = require('minimist')(process.argv.slice(2), { alias: { "development": ["dev", "d"] } });

const settings = require('../../../settings');

const providerOptions = Object.assign(
  { development: args.development },
  settings.ups
);

const rateProvider = new UpsRateProvider(providerOptions);

const destination: CarrierService.Contact = {
  address1: "308 Dallam Rd",
  city: "Newark",
  province: "DE",
  postal_code: "19712",
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
    Weight: "40.0"
  }
};

const _packages: Array<UPS.Package>= Array.from({length:1}).map(_ => pkg);

// const packages: Array<UPS.Package> =  [
//   {
//     "PackagingType": {
//       "Code": PackagingTypeCodeEnum.PACKAGE
//     },
//     "Dimensions": {
//       "UnitOfMeasurement": {
//         "Code": "IN"
//       },
//       "Height": "22",
//       "Length": "22",
//       "Width": "22"
//     },
//     "PackageWeight": {
//       "UnitOfMeasurement": {
//         "Code": "LBS"
//       },
//       "Weight": "40"
//     }
//   },
//   {
//     "PackagingType": {
//       "Code": PackagingTypeCodeEnum.PACKAGE
//     },
//     "Dimensions": {
//       "UnitOfMeasurement": {
//         "Code": "IN"
//       },
//       "Height": "22",
//       "Length": "22",
//       "Width": "22"
//     },
//     "PackageWeight": {
//       "UnitOfMeasurement": {
//         "Code": "LBS"
//       },
//       "Weight": "45"
//     }
//   },
//   {
//     "PackagingType": {
//       "Code": PackagingTypeCodeEnum.PACKAGE
//     },
//     "Dimensions": {
//       "UnitOfMeasurement": {
//         "Code": "IN"
//       },
//       "Height": "22",
//       "Length": "22",
//       "Width": "22"
//     },
//     "PackageWeight": {
//       "UnitOfMeasurement": {
//         "Code": "LBS"
//       },
//       "Weight": "40"
//     }
//   },
//   {
//     "PackagingType": {
//       "Code": PackagingTypeCodeEnum.PACKAGE
//     },
//     "Dimensions": {
//       "UnitOfMeasurement": {
//         "Code": "IN"
//       },
//       "Height": "22",
//       "Length": "22",
//       "Width": "22"
//     },
//     "PackageWeight": {
//       "UnitOfMeasurement": {
//         "Code": "LBS"
//       },
//       "Weight": "45"
//     }
//   },
//   {
//     "PackagingType": {
//       "Code": PackagingTypeCodeEnum.PACKAGE
//     },
//     "Dimensions": {
//       "UnitOfMeasurement": {
//         "Code": "IN"
//       },
//       "Height": "22",
//       "Length": "22",
//       "Width": "22"
//     },
//     "PackageWeight": {
//       "UnitOfMeasurement": {
//         "Code": "LBS"
//       },
//       "Weight": "40"
//     }
//   },
//   {
//     "PackagingType": {
//       "Code": PackagingTypeCodeEnum.PACKAGE
//     },
//     "Dimensions": {
//       "UnitOfMeasurement": {
//         "Code": "IN"
//       },
//       "Height": "22",
//       "Length": "22",
//       "Width": "22"
//     },
//     "PackageWeight": {
//       "UnitOfMeasurement": {
//         "Code": "LBS"
//       },
//       "Weight": "45"
//     }
//   },
//   {
//     "PackagingType": {
//       "Code": PackagingTypeCodeEnum.PACKAGE
//     },
//     "Dimensions": {
//       "UnitOfMeasurement": {
//         "Code": "IN"
//       },
//       "Height": "22",
//       "Length": "22",
//       "Width": "22"
//     },
//     "PackageWeight": {
//       "UnitOfMeasurement": {
//         "Code": "LBS"
//       },
//       "Weight": "45"
//     }
//   },
//   {
//     "PackagingType": {
//       "Code": PackagingTypeCodeEnum.PACKAGE
//     },
//     "Dimensions": {
//       "UnitOfMeasurement": {
//         "Code": "IN"
//       },
//       "Height": "22",
//       "Length": "22",
//       "Width": "22"
//     },
//     "PackageWeight": {
//       "UnitOfMeasurement": {
//         "Code": "LBS"
//       },
//       "Weight": "40"
//     }
//   }
// ];

const shippingItems: Array<CarrierService.ShippingItem> =
[
  {
    "packagingType": "package",
    "shipsByFreight": false,
    "weight": 40,
    "weightUnits": "pounds",
    "height": 22,
    "heightUnits": "inches",
    "length": 22,
    "lengthUnits": "inches",
    "width": 22,
    "widthUnits": "inches"
  },
  {
    "packagingType": "package",
    "shipsByFreight": false,
    "weight": 45,
    "weightUnits": "pounds",
    "height": 22,
    "heightUnits": "inches",
    "length": 22,
    "lengthUnits": "inches",
    "width": 22,
    "widthUnits": "inches"
  },
  {
    "packagingType": "package",
    "shipsByFreight": false,
    "weight": 40,
    "weightUnits": "pounds",
    "height": 22,
    "heightUnits": "inches",
    "length": 22,
    "lengthUnits": "inches",
    "width": 22,
    "widthUnits": "inches"
  },
  {
    "packagingType": "package",
    "shipsByFreight": false,
    "weight": 45,
    "weightUnits": "pounds",
    "height": 22,
    "heightUnits": "inches",
    "length": 22,
    "lengthUnits": "inches",
    "width": 22,
    "widthUnits": "inches"
  },
  {
    "packagingType": "package",
    "shipsByFreight": false,
    "weight": 40,
    "weightUnits": "pounds",
    "height": 22,
    "heightUnits": "inches",
    "length": 22,
    "lengthUnits": "inches",
    "width": 22,
    "widthUnits": "inches"
  },
  {
    "packagingType": "package",
    "shipsByFreight": false,
    "weight": 45,
    "weightUnits": "pounds",
    "height": 22,
    "heightUnits": "inches",
    "length": 22,
    "lengthUnits": "inches",
    "width": 22,
    "widthUnits": "inches"
  },
  {
    "packagingType": "package",
    "shipsByFreight": false,
    "weight": 45,
    "weightUnits": "pounds",
    "height": 22,
    "heightUnits": "inches",
    "length": 22,
    "lengthUnits": "inches",
    "width": 22,
    "widthUnits": "inches"
  },
  {
    "packagingType": "package",
    "shipsByFreight": false,
    "weight": 40,
    "weightUnits": "pounds",
    "height": 22,
    "heightUnits": "inches",
    "length": 22,
    "lengthUnits": "inches",
    "width": 22,
    "widthUnits": "inches"
  }
];


// rateProvider.getGfpRate( packages, destination )
// rateProvider.getNegotiatedRate( packages, destination )
rateProvider.getBoxRates( shippingItems, destination)
  .then(resp=> {
    if(!process.env.DEBUG) { // Will already print the response via debug option in the client.request function
      console.log( typeof resp === 'object' ? JSON.stringify(resp, null, 2) : resp );
    }
  })
  .catch(console.error);