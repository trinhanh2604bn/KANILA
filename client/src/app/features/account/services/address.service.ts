import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface CustomerAddressDto {
  _id: string;
  recipient_name: string;
  phone: string;
  address_line_1: string;
  address_line_2?: string;
  ward?: string;
  district?: string;
  city: string;
  country_code?: string;
  postal_code?: string;
  address_type?: 'home' | 'office' | 'other';
  address_note?: string;
  is_default_shipping?: boolean;
  is_default_billing?: boolean;
}

export interface AddressWritePayload {
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  ward?: string;
  district?: string;
  provinceOrCity: string;
  countryCode?: string;
  postalCode?: string;
  addressType?: 'home' | 'office' | 'other';
  addressNote?: string;
  isDefaultShipping?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AddressService {
  private readonly api = 'http://localhost:5000/api/account/addresses';

  constructor(private readonly http: HttpClient) {}

  list(): Observable<CustomerAddressDto[]> {
    return this.http.get<any>(this.api).pipe(map((res) => (Array.isArray(res?.data) ? res.data : []) as CustomerAddressDto[]));
  }

  create(payload: AddressWritePayload): Observable<CustomerAddressDto> {
    return this.http.post<any>(this.api, this.toBody(payload)).pipe(map((res) => res?.data as CustomerAddressDto));
  }

  update(id: string, payload: Partial<AddressWritePayload>): Observable<CustomerAddressDto> {
    return this.http.patch<any>(`${this.api}/${id}`, this.toBodyPartial(payload)).pipe(map((res) => res?.data as CustomerAddressDto));
  }

  setDefault(id: string): Observable<void> {
    return this.http.patch<any>(`${this.api}/${id}/default`, {}).pipe(map(() => void 0));
  }

  remove(id: string): Observable<void> {
    return this.http.delete<any>(`${this.api}/${id}`).pipe(map(() => void 0));
  }

  static formatFullAddress(a: Pick<CustomerAddressDto, 'address_line_1' | 'address_line_2' | 'ward' | 'district' | 'city' | 'country_code'>): string {
    const line1 = [a.address_line_1, a.address_line_2].filter(Boolean).join(', ');
    const country =
      String(a.country_code || '')
        .trim()
        .toUpperCase() === 'VN'
        ? 'Việt Nam'
        : String(a.country_code || '').trim();
    const tail = [a.ward, a.district, a.city, country].filter(Boolean);
    const parts = [line1 || a.address_line_1, ...tail].filter(Boolean);
    return parts.join(', ');
  }

  private toBody(p: AddressWritePayload): Record<string, unknown> {
    return {
      recipient_name: p.recipientName.trim(),
      phone: p.phone.trim(),
      address_line_1: p.addressLine1.trim(),
      address_line_2: (p.addressLine2 || '').trim(),
      ward: (p.ward || '').trim(),
      district: (p.district || '').trim(),
      city: p.provinceOrCity.trim(),
      country_code: (p.countryCode || 'VN').trim().toUpperCase() || 'VN',
      postal_code: (p.postalCode || '').trim(),
      address_type: p.addressType || 'home',
      address_note: (p.addressNote || '').trim(),
      is_default_shipping: !!p.isDefaultShipping,
    };
  }

  private toBodyPartial(p: Partial<AddressWritePayload>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    if (p.recipientName !== undefined) out['recipient_name'] = p.recipientName.trim();
    if (p.phone !== undefined) out['phone'] = p.phone.trim();
    if (p.addressLine1 !== undefined) out['address_line_1'] = p.addressLine1.trim();
    if (p.addressLine2 !== undefined) out['address_line_2'] = p.addressLine2.trim();
    if (p.ward !== undefined) out['ward'] = p.ward.trim();
    if (p.district !== undefined) out['district'] = p.district.trim();
    if (p.provinceOrCity !== undefined) out['city'] = p.provinceOrCity.trim();
    if (p.countryCode !== undefined) out['country_code'] = p.countryCode.trim().toUpperCase();
    if (p.postalCode !== undefined) out['postal_code'] = p.postalCode.trim();
    if (p.addressType !== undefined) out['address_type'] = p.addressType;
    if (p.addressNote !== undefined) out['address_note'] = p.addressNote.trim();
    if (p.isDefaultShipping !== undefined) out['is_default_shipping'] = !!p.isDefaultShipping;
    return out;
  }
}
