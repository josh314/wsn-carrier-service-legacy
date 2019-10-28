
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

  public getBoxRate( boxItems: Array< CarrierService.DressedOrderItem >, destination: CarrierService.Contact ): number {
    return 0;
  }
  public getPalletRates( palletItems: Array< CarrierService.DressedOrderItem >, destination: CarrierService.Contact ): Array< CarrierService.PalletRate > {
    return [];
  }
}