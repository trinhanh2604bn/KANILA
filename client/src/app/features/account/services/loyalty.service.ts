import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface LoyaltyView {
  points_balance: number;
  tier_name: string;
}

@Injectable({ providedIn: 'root' })
export class LoyaltyService {
  private readonly api = 'http://localhost:5000/api/loyalty/me';

  constructor(private readonly http: HttpClient) {}

  getMe(): Observable<LoyaltyView | null> {
    return this.http.get<any>(this.api).pipe(
      map((res) => (res?.data || null) as LoyaltyView),
      catchError(() => of(null))
    );
  }
}
