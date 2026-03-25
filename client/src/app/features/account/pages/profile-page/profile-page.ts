import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { of } from 'rxjs';
import { catchError, take } from 'rxjs/operators';
import { AuthService } from '../../../../core/services/auth.service';
import { ProfileHubService } from '../../services/profile-hub.service';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile-page.html',
  styleUrls: ['./profile-page.css'],
})
export class ProfilePageComponent implements OnInit {
  isEditMode = false;
  saveMessage = '';
  isLoading = true;
  loadError = '';

  fullName = '';
  email = '';
  phone = '';
  gender = 'Nữ';
  dob = '';
  avatarUrl = '';

  draft = {
    fullName: '',
    email: '',
    phone: '',
    gender: '',
    dob: '',
  };

  constructor(
    private readonly authService: AuthService,
    private readonly profileHubService: ProfileHubService
  ) {
    const payload = this.decodeTokenPayload();
    const fullName = String(payload?.['full_name'] || payload?.['fullName'] || payload?.['username'] || '').trim();
    const email = String(payload?.['email'] || '').trim().toLowerCase();
    this.fullName = fullName || 'Kanila Lover';
    this.email = email || 'you@kanila.com';
    this.draft = {
      fullName: this.fullName,
      email: this.email,
      phone: '',
      gender: this.gender,
      dob: this.dob,
    };
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  toggleEdit(): void {
    this.isEditMode = true;
    this.saveMessage = '';
    this.draft = {
      fullName: this.fullName,
      email: this.email,
      phone: this.phone,
      gender: this.gender,
      dob: this.dob,
    };
  }

  cancelEdit(): void {
    this.isEditMode = false;
    this.saveMessage = '';
  }

  saveProfile(): void {
    this.profileHubService.patchProfile({
      fullName: this.draft.fullName.trim(),
      phone: this.draft.phone.trim(),
      gender: this.draft.gender,
      birthday: this.draft.dob || null,
      avatarUrl: this.avatarUrl || '',
    }).pipe(take(1)).subscribe({
      next: () => {
        this.fullName = this.draft.fullName.trim() || this.fullName;
        this.phone = this.draft.phone.trim();
        this.gender = this.draft.gender;
        this.dob = this.draft.dob;
        this.isEditMode = false;
        this.saveMessage = 'Đã cập nhật thông tin cá nhân.';
      },
      error: () => {
        this.saveMessage = 'Không thể cập nhật thông tin. Vui lòng thử lại.';
      },
    });
  }

  private loadProfile(): void {
    this.isLoading = true;
    this.loadError = '';
    this.profileHubService.getHub().pipe(
      take(1),
      catchError(() => {
        this.loadError = 'Không thể tải hồ sơ lúc này. Vui lòng thử lại.';
        return of(null);
      })
    ).subscribe((hub) => {
      if (!hub) {
        this.isLoading = false;
        return;
      }
      this.fullName = hub.profile?.fullName || this.fullName;
      this.email = hub.profile?.email || this.email;
      this.phone = hub.profile?.phone || this.phone;
      this.gender = hub.profile?.gender || this.gender;
      this.dob = hub.profile?.birthday ? String(hub.profile.birthday).slice(0, 10) : this.dob;
      this.avatarUrl = hub.profile?.avatarUrl || '';
      this.draft = {
        fullName: this.fullName,
        email: this.email,
        phone: this.phone,
        gender: this.gender,
        dob: this.dob,
      };
      this.isLoading = false;
    });
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
