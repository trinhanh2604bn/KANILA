import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface WishlistMeView {
  count: number;
}

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private readonly api = 'http://localhost:5000/api/wishlist/me';

  constructor(private readonly http: HttpClient) {}

  getMe(): Observable<WishlistMeView | null> {
    return this.http.get<any>(this.api).pipe(
      map((res) => (res?.data || null) as WishlistMeView),
      catchError(() => of(null))
    );
  }
}
