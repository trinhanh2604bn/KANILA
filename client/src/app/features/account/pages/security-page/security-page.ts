import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { take } from 'rxjs/operators';
import { ToastService } from '../../../../core/services/toast.service';
import { ChangePasswordModalComponent } from '../../components/change-password-modal/change-password-modal';
import { ProfileHubService } from '../../services/profile-hub.service';

@Component({
  selector: 'app-security-page',
  standalone: true,
  imports: [CommonModule, ChangePasswordModalComponent],
  templateUrl: './security-page.html',
  styleUrls: ['./security-page.css'],
})
export class SecurityPageComponent implements OnInit {
  hasPassword = true;
  linkedProviders: Array<{ provider: string; email: string; linkedAt: string | null }> = [];
  passwordModalOpen = false;
  loading = false;
  busyProvider = '';
  error = '';

  constructor(private readonly profileHubService: ProfileHubService, private readonly toast: ToastService) {}

  ngOnInit(): void {
    this.loadSecurityStatus();
  }

  openChangePasswordModal(): void { this.passwordModalOpen = true; }
  onPasswordModalOpen(v: boolean): void { this.passwordModalOpen = v; }
  onPasswordChanged(): void {
    this.toast.success('Đã cập nhật mật khẩu thành công.');
    this.loadSecurityStatus();
  }

  unlinkProvider(provider: string): void {
    this.busyProvider = provider;
    this.error = '';
    this.profileHubService.unlinkProvider(provider).pipe(take(1)).subscribe({
      next: () => {
        this.linkedProviders = this.linkedProviders.filter((x) => x.provider !== provider);
        this.busyProvider = '';
        this.toast.success('Đã gỡ liên kết nhà cung cấp.');
      },
      error: (err) => {
        this.busyProvider = '';
        this.error = err?.error?.message || 'Không thể gỡ liên kết nhà cung cấp.';
      }
    });
  }

  private loadSecurityStatus(): void {
    this.loading = true;
    this.error = '';
    this.profileHubService.getSecurityStatus().pipe(take(1)).subscribe({
      next: (security) => {
        this.hasPassword = security?.hasPassword !== false;
        this.linkedProviders = Array.isArray(security?.linkedProviders) ? security.linkedProviders : [];
        this.loading = false;
      },
      error: () => {
        this.error = 'Không thể tải trạng thái bảo mật.';
        this.loading = false;
      },
    });
  }
}
