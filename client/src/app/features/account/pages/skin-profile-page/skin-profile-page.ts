import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { take } from 'rxjs/operators';
import { RecommendationService, RecommendedProductView } from '../../../../core/services/recommendation.service';
import { RecommendationProductBlockComponent } from '../../../recommendations/components/recommendation-product-block/recommendation-product-block';
import { ProfileHubService } from '../../services/profile-hub.service';

@Component({
  selector: 'app-skin-profile-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RecommendationProductBlockComponent],
  templateUrl: './skin-profile-page.html',
  styleUrls: ['./skin-profile-page.css'],
})
export class SkinProfilePageComponent implements OnInit {
  saveMessage = '';
  skinTypeSelections: string[] = [];
  skinTone = '';
  eyeColor = '';
  skinConcerns: string[] = [];
  ingredientPreferences: string[] = [];
  favoriteBrands: string[] = [];
  brandSearch = '';
  skinStep = 1;
  recommendedProducts: RecommendedProductView[] = [];
  recommendationLoading = false;
  recommendationError = '';
  readonly skinTypeOptions = ['Da dầu', 'Da khô', 'Da hỗn hợp', 'Da nhạy cảm'];
  readonly toneOptions = ['Tông tối', 'Tông trung bình', 'Tông sáng', 'Không chắc'];
  readonly eyeColorOptions = ['Nâu đậm', 'Nâu nhạt', 'Đen', 'Xám', 'Xanh', 'Không chắc'];
  readonly concernOptions = ['Mụn', 'Thiếu ẩm', 'Lỗ chân lông to', 'Xỉn màu', 'Đỏ rát', 'Lão hóa'];
  readonly ingredientOptions = ['Vegan', 'Paraben-free', 'Fragrance-free', 'Gluten-free'];
  readonly brandOptions = ['3CE', 'Innisfree', 'Cocoon', 'Maybelline', 'L’Oréal', 'Laneige', 'Bioderma', 'Klairs'];

  constructor(private readonly profileHubService: ProfileHubService, private readonly recommendationService: RecommendationService, private readonly router: Router) {}

  ngOnInit(): void {
    this.profileHubService.getHub().pipe(take(1)).subscribe({
      next: (hub) => {
        this.skinTypeSelections = Array.isArray(hub.skinProfile?.skinType) ? hub.skinProfile.skinType : [];
        this.skinTone = hub.skinProfile?.skinTone || '';
        this.eyeColor = hub.skinProfile?.eyeColor || '';
        this.skinConcerns = Array.isArray(hub.skinProfile?.concerns) ? hub.skinProfile.concerns : [];
        this.ingredientPreferences = Array.isArray(hub.skinProfile?.ingredientPreferences) ? hub.skinProfile.ingredientPreferences : [];
        this.favoriteBrands = Array.isArray(hub.skinProfile?.favoriteBrands) ? hub.skinProfile.favoriteBrands : [];
        this.loadRecommendations();
      },
    });
  }

  updateSkinProfile(): void {
    this.profileHubService.patchSkinProfile({
      skinType: this.skinTypeSelections, skinTone: this.skinTone, eyeColor: this.eyeColor,
      concerns: this.skinConcerns, ingredientPreferences: this.ingredientPreferences, favoriteBrands: this.favoriteBrands,
    }).pipe(take(1)).subscribe({ next: () => { this.saveMessage = 'Đã cập nhật hồ sơ làn da.'; this.loadRecommendations(); } });
  }

  viewRecommendedProducts(): void { this.router.navigate(['/catalog'], { queryParams: { personalized: '1' } }); }
  nextSkinStep(): void { this.skinStep = Math.min(3, this.skinStep + 1); }
  prevSkinStep(): void { this.skinStep = Math.max(1, this.skinStep - 1); }
  toggleSkinType(option: string): void { this.skinTypeSelections = this.toggle(this.skinTypeSelections, option); }
  toggleConcern(option: string): void { this.skinConcerns = this.toggle(this.skinConcerns, option); }
  toggleIngredient(option: string): void { this.ingredientPreferences = this.toggle(this.ingredientPreferences, option); }
  removeIngredient(option: string): void { this.ingredientPreferences = this.ingredientPreferences.filter((x) => x !== option); }
  addBrand(brand: string): void { const b = brand.trim(); if (b && !this.favoriteBrands.includes(b)) this.favoriteBrands = [...this.favoriteBrands, b]; this.brandSearch = ''; }
  removeBrand(brand: string): void { this.favoriteBrands = this.favoriteBrands.filter((x) => x !== brand); }

  get filteredBrandOptions(): string[] {
    const keyword = this.brandSearch.trim().toLowerCase();
    return this.brandOptions.filter((x) => !this.favoriteBrands.includes(x)).filter((x) => !keyword || x.toLowerCase().includes(keyword)).slice(0, 6);
  }

  private loadRecommendations(): void {
    this.recommendationLoading = true;
    this.recommendationService.getMyRecommendations('', 6, 'profile_page').pipe(take(1)).subscribe({
      next: (items) => { this.recommendedProducts = items; this.recommendationLoading = false; },
      error: () => { this.recommendationLoading = false; this.recommendationError = 'Không thể tải gợi ý cá nhân hóa.'; },
    });
  }

  private toggle(list: string[], value: string): string[] { return list.includes(value) ? list.filter((x) => x !== value) : [...list, value]; }
}
