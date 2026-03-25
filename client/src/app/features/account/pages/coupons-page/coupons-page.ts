import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { take } from 'rxjs/operators';
import { CouponService } from '../../services/coupon.service';
import { ProfileHubService } from '../../services/profile-hub.service';

@Component({
  selector: 'app-coupons-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './coupons-page.html',
  styleUrls: ['./coupons-page.css'],
})
export class CouponsPageComponent implements OnInit {
  couponCount = 0;
  expiringCouponCount = 0;
  items: Array<{ _id: string; redemptionStatus: string; redeemedAt?: string; couponId?: { couponCode?: string; couponStatus?: string } | null }> = [];
  loading = false;
  error = '';
  constructor(private readonly couponService: CouponService, private readonly profileHubService: ProfileHubService) {}
  ngOnInit(): void {
    this.loading = true;
    this.profileHubService.getHub().pipe(take(1)).subscribe({
      next: (hub) => this.expiringCouponCount = Number(hub.stats?.expiringCouponCount || 0),
    });
    this.couponService.getMe().pipe(take(1)).subscribe({
      next: (res) => {
        this.couponCount = Number(res?.count || 0);
        this.items = Array.isArray(res?.items) ? res.items : [];
        this.loading = false;
      },
      error: () => {
        this.error = 'Không thể tải dữ liệu mã giảm giá.';
        this.loading = false;
      }
    });
  }
}
