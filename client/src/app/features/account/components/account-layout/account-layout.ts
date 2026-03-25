import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { catchError, of, take } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { ProfileHubService } from '../../services/profile-hub.service';

@Component({
  selector: 'app-account-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './account-layout.html',
  styleUrls: ['./account-layout.css'],
})
export class AccountLayoutComponent implements OnInit {
  fullName = 'Kanila Lover';
  loyaltyTier = 'Gold Member';
  loyaltyPoints = 0;
  pointsToNextTier = 0;
  nextTierName = '';
  avatarUrl = '';

  constructor(
    private readonly authService: AuthService,
    private readonly profileHubService: ProfileHubService
  ) {
    const payload = this.decodeTokenPayload();
    const fullName = String(payload?.['full_name'] || payload?.['fullName'] || payload?.['username'] || '').trim();
    if (fullName) this.fullName = fullName;
  }

  ngOnInit(): void {
    this.profileHubService.getHub().pipe(
      take(1),
      catchError(() => of(null))
    ).subscribe((hub) => {
      if (!hub) return;
      this.fullName = hub.profile?.fullName || this.fullName;
      this.avatarUrl = hub.profile?.avatarUrl || '';
      this.loyaltyTier = hub.loyalty?.tierName || this.loyaltyTier;
      this.loyaltyPoints = Number(hub.loyalty?.pointsBalance || 0);
      this.pointsToNextTier = Number(hub.loyalty?.pointsToNextTier || 0);
      this.nextTierName = hub.loyalty?.nextTierName || '';
    });
  }

  get firstName(): string {
    return this.fullName.split(/\s+/).filter(Boolean)[0] || 'Bạn';
  }

  get initials(): string {
    return (this.firstName[0] || 'K').toUpperCase();
  }

  private decodeTokenPayload(): Record<string, unknown> | null {
    const token = this.authService.getToken();
    if (!token) return null;
    try {
      const payloadPart = token.split('.')[1];
      if (!payloadPart) return null;
      const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
      return JSON.parse(atob(padded));
    } catch {
      return null;
    }
  }
}
