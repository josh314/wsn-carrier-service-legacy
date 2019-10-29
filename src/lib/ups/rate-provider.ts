import { Client } from "ups/client";

export class UpsRateProvider implements CarrierService.RateProvider {

  private client: UPS.ApiClient;

  constructor() {
    this.client = new Client({
      accountNumber: process.env.UPS_ACCOUNT_NUMBER!,
      accessLicenseNumber: process.env.UPS_ACCESS_KEY!,
      user: process.env.UPS_USER!,
      password: process.env.UPS_PASSWORD!
    });
  }

  public async getBoxRate( boxItems: Array<CarrierService.DressedOrderItem>, destination: CarrierService.Contact ): Promise<number> {
    return 0;
  }
  public async getPalletRates( palletItems: Array<CarrierService.DressedOrderItem>, destination: CarrierService.Contact ): Promise< Array<CarrierService.PalletRate> > {
    return [];
  }
}