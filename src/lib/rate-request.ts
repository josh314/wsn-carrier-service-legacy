export interface RateRequestBody {
  rate: RateRequest
}
export interface RateRequest {
  origin: Location,
  destination: Location,
  items: Array<OrderItem>,
  currency: string,
  locale: string
}
export interface Location {
  country: string | null,
  postal_code: string | null,
  province: string | null,
  city: string | null,
  name: string | null,
  address1: string | null,
  address2: string | null,
  address3: string | null,
  phone: string | null,
  fax: string | null,
  email: string | null,
  address_type: string | null,
  company_name: string | null
}
export interface OrderItem {
  name: string | null,
  sku: string | null,
  quantity: number,
  grams: number,
  price: number,
  vendor: string | null,
  requires_shipping: boolean,
  taxable: boolean,
  fulfillment_service: string | null,
  properties: string | null,
  product_id: number,
  variant_id: number
}
