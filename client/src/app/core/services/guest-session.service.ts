import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class GuestSessionService {
  private readonly key = 'kanila_guest_session_id';
  private readonly api = 'http://localhost:5000/api/guest-sessions/bootstrap';
  private cached = '';

  constructor(private readonly http: HttpClient) {}

  getGuestSessionIdSync(): string {
    if (this.cached) return this.cached;
    const existing = String(localStorage.getItem(this.key) || '').trim();
    if (existing) {
      this.cached = existing;
      return existing;
    }
    const generated = `gst_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(this.key, generated);
    this.cached = generated;
    return generated;
  }

  bootstrap(): Observable<string> {
    const guestSessionId = this.getGuestSessionIdSync();
    return this.http.post<any>(this.api, { guestSessionId }).pipe(
      map((res) => String(res?.data?.guestSessionId || guestSessionId)),
      tap((id) => {
        this.cached = id;
        localStorage.setItem(this.key, id);
      }),
      catchError(() => of(guestSessionId))
    );
  }

  buildGuestHeaders(): HttpHeaders {
    const guestSessionId = this.getGuestSessionIdSync();
    return new HttpHeaders({ 'x-guest-session-id': guestSessionId });
  }
}
