import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ProfileHubView {
  profile: {
    customerId: string;
    fullName: string;
    email: string;
    phone: string;
    gender: string;
    birthday: string | null;
    avatarUrl: string;
  };
  loyalty: {
    tierName: string;
    pointsBalance: number;
    nextTierName: string | null;
    pointsToNextTier: number;
  };
  stats: {
    orderCount: number;
    processingOrderCount: number;
    wishlistCount: number;
    couponCount: number;
    expiringCouponCount: number;
    addressCount: number;
  };
  defaultAddress: {
    addressId: string;
    recipientName: string;
    phone: string;
    fullAddress: string;
    isDefault: boolean;
  } | null;
  skinProfile: {
    skinType: string[];
    skinTone: string;
    eyeColor: string;
    concerns: string[];
    ingredientPreferences: string[];
    favoriteBrands: string[];
  };
  security: {
    hasPassword: boolean;
    linkedProviders: Array<{ provider: string; email: string; linkedAt: string | null }>;
  };
}

@Injectable({ providedIn: 'root' })
export class ProfileHubService {
  private readonly api = 'http://localhost:5000/api/account';

  constructor(private readonly http: HttpClient) {}

  getHub(): Observable<ProfileHubView> {
    return this.http.get<any>(`${this.api}/profile-hub`).pipe(map((res) => res?.data as ProfileHubView));
  }

  patchProfile(payload: {
    fullName?: string;
    phone?: string;
    gender?: string;
    birthday?: string | null;
    avatarUrl?: string;
  }): Observable<void> {
    return this.http.patch<any>(`${this.api}/profile`, payload).pipe(map(() => void 0));
  }

  patchSkinProfile(payload: {
    skinType?: string[];
    skinTone?: string;
    eyeColor?: string;
    concerns?: string[];
    ingredientPreferences?: string[];
    favoriteBrands?: string[];
  }): Observable<void> {
    const body = {
      skin_type: payload.skinType,
      skin_tone: payload.skinTone,
      eye_color: payload.eyeColor,
      concerns: payload.concerns,
      ingredient_preferences: payload.ingredientPreferences,
      favorite_brands: payload.favoriteBrands,
    };
    return this.http.patch<any>(`${this.api}/skin-profile`, body).pipe(map(() => void 0));
  }

  getSkinProfile(): Observable<{
    skin_type: string[];
    skin_tone: string;
    eye_color: string;
    concerns: string[];
    ingredient_preferences: string[];
    favorite_brands: string[];
  }> {
    return this.http.get<any>(`${this.api}/skin-profile`).pipe(map((res) => res?.data || {}));
  }
}
