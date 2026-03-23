import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://localhost:5000/api/auth';

  constructor(private http: HttpClient) {}

  register(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, data);
  }

  checkEmail(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/check-email`, { email });
  }

  resetPassword(email: string, newPass: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reset-password`, { email, newPass });
  }
  
  login(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, data);
  }
}