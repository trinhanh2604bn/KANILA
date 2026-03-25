import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { take } from 'rxjs/operators';
import { Router, RouterLink } from '@angular/router';
import { CouponService, CouponWalletItem } from '../../services/coupon.service';
import { ProfileHubService } from '../../services/profile-hub.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-coupons-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './coupons-page.html',
  styleUrls: ['./coupons-page.css'],
})
export class CouponsPageComponent implements OnInit {
  summary = { total: 0, usable: 0, expiringSoon: 0, used: 0, expired: 0 };
  activeTab: 'usable' | 'expiring' | 'used' | 'expired' = 'usable';
  items: CouponWalletItem[] = [];
  loading = false;
  error = '';
  constructor(
    private readonly couponService: CouponService,
    private readonly profileHubService: ProfileHubService,
    private readonly toast: ToastService,
    private readonly router: Router
  ) {}

  get filteredItems(): CouponWalletItem[] {
    if (this.activeTab === 'usable') return this.items.filter((x) => !x.isUsed && !x.isExpired && x.couponStatus === 'active');
    if (this.activeTab === 'expiring') return this.items.filter((x) => x.expiringSoon);
    if (this.activeTab === 'used') return this.items.filter((x) => x.isUsed);
    return this.items.filter((x) => x.isExpired);
  }

  setTab(tab: 'usable' | 'expiring' | 'used' | 'expired'): void {
    this.activeTab = tab;
  }

  copyCode(code: string): void {
    navigator.clipboard.writeText(code).then(() => this.toast.success('Đã sao chép mã giảm giá.'));
  }

  useNow(code: string): void {
    this.toast.show('Đang chuyển sang checkout để dùng mã...', 'info');
    this.router.navigate(['/checkout'], { queryParams: { couponCode: code } });
  }

  private loadCoupons(): void {
    this.couponService.getMe().pipe(take(1)).subscribe({
      next: (res) => {
        this.summary = {
          total: Number(res?.summary?.total || 0),
          usable: Number(res?.summary?.usable || 0),
          expiringSoon: Number(res?.summary?.expiringSoon || 0),
          used: Number(res?.summary?.used || 0),
          expired: Number(res?.summary?.expired || 0),
        };
        this.items = Array.isArray(res?.items) ? res.items : [];
        this.loading = false;
      },
      error: () => {
        this.error = 'Không thể tải dữ liệu mã giảm giá.';
        this.loading = false;
      }
    });
  }

  ngOnInit(): void {
    this.loading = true;
    this.profileHubService.getHub().pipe(take(1)).subscribe({
      next: (hub) => {
        const expiringFromHub = Number(hub.stats?.expiringCouponCount || 0);
        if (expiringFromHub > 0) this.summary.expiringSoon = expiringFromHub;
      },
    });
    this.loadCoupons();
  }
}
