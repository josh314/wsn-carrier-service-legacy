import * as rp from 'request-promise';

interface ClientSettings {
  accountNumber: UPS.AccountNumber,
  accessLicenseNumber: UPS.AccessLicenseNumber, // The Access Key
  user: UPS.User,
  password: UPS.Password,
}

type Endpoint = 'Rate' | 'AV';

export class Client implements UPS.ApiClient {
  private accountNumber: UPS.AccountNumber;
  private accessLicenseNumber: UPS.AccessLicenseNumber; // The Access Key
  private user: UPS.User;
  private password: UPS.Password;
  private baseUrl: string;


  constructor(settings: ClientSettings) {
    this.accountNumber = settings.accountNumber;
    this.accessLicenseNumber = settings.accessLicenseNumber;
    this.user = settings.user;
    this.password = settings.password;

    this.baseUrl = process.env.NODE_ENV === 'development' ? 'https://wwwcie.ups.com/rest' : 'https://onlinetools.ups.com/rest';
  }

  public async request(endpoint: Endpoint, body: UPS.ApiRequestBody): Promise<UPS.ApiResponse> {
    if(process.env.DEBUG) {
      console.log('Api Request:');
      console.log( JSON.stringify(body, null, 2) );
    }

    const req: rp.Options = {
      method: 'POST',
      uri: `${this.baseUrl}/${endpoint}`,
      headers: {
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: body,
      json: true,
    };
    const apiResp = await rp(req);


    if(process.env.DEBUG) {
      console.log('UPS Response:');
      try {
        console.log(JSON.stringify(apiResp, null, 2));
      }
      catch(e) {
        console.log(apiResp);
      }
    }

    return apiResp;
  }

  public ratingRequest(request: UPS.Rating.RateRequest): UPS.Rating.Response {

    const resp: UPS.Rating.Response = {};
    return resp;
  }
}