import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface OrderSummaryView {
  total_orders: number;
  pending_orders: number;
}

@Injectable({ providedIn: 'root' })
export class AccountOrderService {
  private readonly api = 'http://localhost:5000/api/orders/me/summary';

  constructor(private readonly http: HttpClient) {}

  getSummary(): Observable<OrderSummaryView | null> {
    return this.http.get<any>(this.api).pipe(
      map((res) => (res?.data || null) as OrderSummaryView),
      catchError(() => of(null))
    );
  }
}
