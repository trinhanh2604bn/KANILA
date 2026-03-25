import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface ShadeOption {
  name: string;
  hex: string;
}

interface ApiEnvelope<T> {
  success?: boolean;
  message?: string;
  data?: T;
}

@Injectable({ providedIn: 'root' })
export class CatalogFilterOptionsService {
  private readonly apiBase = 'http://localhost:5000/api/catalog';

  constructor(private readonly http: HttpClient) {}

  getShadeOptions(): Observable<ShadeOption[]> {
    return this.http.get<ApiEnvelope<ShadeOption[]>>(`${this.apiBase}/shades`).pipe(
      map((res) => res.data ?? [])
    );
  }

  /**
   * Returns raw backend values (e.g. `oily`, `dry`, …).
   * Labels are mapped on the frontend for UI.
   */
  getSkinTypeValues(): Observable<string[]> {
    return this.http.get<ApiEnvelope<Array<{ value: string }>>>(`${this.apiBase}/skin-types`).pipe(
      map((res) => (res.data ?? []).map((x) => x.value).filter(Boolean))
    );
  }
}

