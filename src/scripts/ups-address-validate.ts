import { Client } from '../lib/ups/client';

const settings = require('../../settings');

const accessLicenseNumber: UPS.AccessLicenseNumber = settings.ups.accessLicenseNumber;
const user = settings.ups.user;
const password = settings.ups.password;

const clientSettings = Object.assign( 
  { development: true }, 
  settings.ups
);

const client = new Client( clientSettings );

const body: UPS.AV.AddressValidationRequestBody = {
  AccessRequest: {
    AccessLicenseNumber: accessLicenseNumber,
    UserId: user,
    Password: password
  },
  AddressValidationRequest: {
    Request: {
      RequestAction: 'AV',
    },
    Address: {
      City: 'Newark',
      StateProvinceCode: 'DE',
      PostalCode: '19711',
      CountryCode: 'US',
    },
  }
};


client.request('AV', body)
  .then(resp=> {
    if(!process.env.DEBUG) { // Will already print the response via debug option in the client.request function
      console.log( typeof resp === 'object' ? JSON.stringify(resp, null, 2) : resp );
    }
  })
  .catch(console.error);