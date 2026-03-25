import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { of } from 'rxjs';
import { catchError, take } from 'rxjs/operators';

import { Product } from '../../../../core/models/product.model';
import { AuthService } from '../../../../core/services/auth.service';
import { RecommendationService } from '../../../../core/services/recommendation.service';
import { ProductCardComponent } from '../../../home/pages/components/product-card/product-card';

@Component({
  selector: 'app-me-recommendations-page',
  standalone: true,
  imports: [CommonModule, RouterModule, ProductCardComponent],
  templateUrl: './me-recommendations-page.html',
  styleUrls: ['./me-recommendations-page.css'],
})
export class MeRecommendationsPageComponent implements OnInit {
  isLoading = true;
  error = '';
  products: Product[] = [];
  skeletonItems: number[] = Array.from({ length: 20 }, (_, i) => i);

  readonly title = 'DÀNH RIÊNG CHO BẠN';
  readonly subtitle = 'Dựa trên hồ sơ làn da và sở thích chăm sóc da của bạn';

  constructor(
    private readonly authService: AuthService,
    private readonly recommendationService: RecommendationService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.isLoading = false;
      this.error = 'Vui lòng đăng nhập để xem gợi ý cá nhân hóa.';
      return;
    }

    this.load();
  }

  private load(): void {
    this.isLoading = true;
    this.error = '';

    this.recommendationService
      .getMyAllRecommendations(20)
      .pipe(
        take(1),
        catchError(() => of([] as Product[]))
      )
      .subscribe((rows) => {
        this.products = rows;
        this.isLoading = false;
        if (!rows.length) this.error = 'Hiện chưa có gợi ý phù hợp. Hãy thử lại sau.';
      });
  }

  trackById(_index: number, p: Product): string {
    return p._id;
  }

  goToProfile(): void {
    this.router.navigate(['/account/skin-profile']);
  }
}

