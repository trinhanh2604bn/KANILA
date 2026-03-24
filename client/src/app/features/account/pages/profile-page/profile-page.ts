import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { of } from 'rxjs';
import { catchError, take } from 'rxjs/operators';
import { AuthService } from '../../../../core/services/auth.service';
import { RecommendationService, RecommendedProductView } from '../../../../core/services/recommendation.service';
import { RecommendationProductBlockComponent } from '../../../recommendations/components/recommendation-product-block/recommendation-product-block';
import { ProfileHubService } from '../../services/profile-hub.service';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive, RecommendationProductBlockComponent],
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

  skinType = 'Da hỗn hợp';
  skinTypeSelections: string[] = [];
  skinTone = '';
  eyeColor = '';
  skinConcerns: string[] = [];
  ingredientPreferences: string[] = [];
  favoriteBrands: string[] = [];
  brandSearch = '';
  skinStep = 1;

  loyaltyTier = 'Gold Member';
  loyaltyPoints = 1250;

  orderCount = 0;
  wishlistCount = 0;
  couponCount = 0;
  addressCount = 1;
  pendingOrderCount = 0;
  avatarUrl = '';
  defaultAddressText = 'Chưa có địa chỉ mặc định';
  defaultAddressName = '';
  defaultAddressPhone = '';
  pointsToNextTier = 0;
  nextTierName = '';
  hasPassword = true;
  linkedProviders: Array<{ provider: string; email: string; linkedAt: string | null }> = [];
  recommendedProducts: RecommendedProductView[] = [];
  recommendationLoading = false;
  recommendationError = '';
  readonly skinTypeOptions = ['Da dầu', 'Da khô', 'Da hỗn hợp', 'Da nhạy cảm'];
  readonly toneOptions = ['Tông tối', 'Tông trung bình', 'Tông sáng', 'Không chắc'];
  readonly eyeColorOptions = ['Nâu đậm', 'Nâu nhạt', 'Đen', 'Xám', 'Xanh', 'Không chắc'];
  readonly concernOptions = ['Mụn', 'Thiếu ẩm', 'Lỗ chân lông to', 'Xỉn màu', 'Đỏ rát', 'Lão hóa'];
  readonly ingredientOptions = ['Vegan', 'Paraben-free', 'Fragrance-free', 'Gluten-free'];
  readonly brandOptions = ['3CE', 'Innisfree', 'Cocoon', 'Maybelline', 'L’Oréal', 'Laneige', 'Bioderma', 'Klairs'];

  draft = {
    fullName: '',
    email: '',
    phone: '',
    gender: '',
    dob: '',
  };

  constructor(
    private readonly authService: AuthService,
    private readonly profileHubService: ProfileHubService,
    private readonly recommendationService: RecommendationService,
    private readonly router: Router
  ) {
    const payload = this.decodeTokenPayload();
    const fullName = String(payload?.['full_name'] || payload?.['fullName'] || payload?.['username'] || '').trim();
    const email = String(payload?.['email'] || '').trim().toLowerCase();
    this.fullName = fullName || 'Kanila Lover';
    this.email = email || 'you@kanila.com';
    this.phone = '';
    this.draft = {
      fullName: this.fullName,
      email: this.email,
      phone: this.phone,
      gender: this.gender,
      dob: this.dob,
    };
  }

  ngOnInit(): void {
    this.loadRealProfileData();
  }

  get firstName(): string {
    return this.fullName.split(/\s+/).filter(Boolean)[0] || 'Bạn';
  }

  get initials(): string {
    return (this.firstName[0] || 'K').toUpperCase();
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
    this.draft = {
      fullName: this.fullName,
      email: this.email,
      phone: this.phone,
      gender: this.gender,
      dob: this.dob,
    };
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
        setTimeout(() => {
          if (this.saveMessage) this.saveMessage = '';
        }, 2200);
      },
      error: () => {
        this.saveMessage = 'Không thể cập nhật thông tin. Vui lòng thử lại.';
      },
    });
  }

  updateSkinProfile(): void {
    this.profileHubService.patchSkinProfile({
      skinType: this.skinTypeSelections,
      skinTone: this.skinTone,
      eyeColor: this.eyeColor,
      concerns: this.skinConcerns,
      ingredientPreferences: this.ingredientPreferences,
      favoriteBrands: this.favoriteBrands,
    }).pipe(take(1)).subscribe({
      next: () => {
        this.saveMessage = 'Kanila đã cập nhật hồ sơ làn da của bạn.';
        this.loadRecommendations();
        setTimeout(() => {
          if (this.saveMessage) this.saveMessage = '';
        }, 2200);
      },
      error: () => {
        this.saveMessage = 'Không thể cập nhật hồ sơ làn da.';
      },
    });
  }

  private loadRealProfileData(): void {
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

      this.loyaltyTier = hub.loyalty?.tierName || this.loyaltyTier;
      this.loyaltyPoints = Number(hub.loyalty?.pointsBalance || 0);
      this.pointsToNextTier = Number(hub.loyalty?.pointsToNextTier || 0);
      this.nextTierName = hub.loyalty?.nextTierName || '';

      this.orderCount = Number(hub.stats?.orderCount || 0);
      this.pendingOrderCount = Number(hub.stats?.processingOrderCount || 0);
      this.wishlistCount = Number(hub.stats?.wishlistCount || 0);
      this.couponCount = Number(hub.stats?.couponCount || 0);
      this.addressCount = Number(hub.stats?.addressCount || 0);

      this.defaultAddressText = hub.defaultAddress?.fullAddress || this.defaultAddressText;
      this.defaultAddressName = hub.defaultAddress?.recipientName || '';
      this.defaultAddressPhone = hub.defaultAddress?.phone || '';

      this.skinTypeSelections = Array.isArray(hub.skinProfile?.skinType) ? hub.skinProfile.skinType : [];
      this.skinTone = hub.skinProfile?.skinTone || '';
      this.eyeColor = hub.skinProfile?.eyeColor || '';
      this.skinConcerns = Array.isArray(hub.skinProfile?.concerns) ? hub.skinProfile.concerns : this.skinConcerns;
      this.ingredientPreferences = Array.isArray(hub.skinProfile?.ingredientPreferences) ? hub.skinProfile.ingredientPreferences : [];
      this.favoriteBrands = Array.isArray(hub.skinProfile?.favoriteBrands) ? hub.skinProfile.favoriteBrands : [];

      this.hasPassword = hub.security?.hasPassword !== false;
      this.linkedProviders = Array.isArray(hub.security?.linkedProviders) ? hub.security.linkedProviders : [];

      this.draft = {
        fullName: this.fullName,
        email: this.email,
        phone: this.phone,
        gender: this.gender,
        dob: this.dob,
      };
      this.isLoading = false;
      this.loadRecommendations();
    });
  }

  viewRecommendedProducts(): void {
    this.router.navigate(['/catalog'], { queryParams: { personalized: '1' } });
  }

  private loadRecommendations(): void {
    this.recommendationLoading = true;
    this.recommendationError = '';
    this.recommendationService.getMyRecommendations('', 6, 'profile_page').pipe(take(1)).subscribe({
      next: (items) => {
        this.recommendedProducts = items;
        this.recommendationLoading = false;
      },
      error: () => {
        this.recommendationLoading = false;
        this.recommendationError = 'Không thể tải gợi ý cá nhân hóa.';
      },
    });
  }

  nextSkinStep(): void {
    this.skinStep = Math.min(3, this.skinStep + 1);
  }

  prevSkinStep(): void {
    this.skinStep = Math.max(1, this.skinStep - 1);
  }

  toggleSkinType(option: string): void {
    this.skinTypeSelections = this.toggleInList(this.skinTypeSelections, option);
  }

  toggleConcern(option: string): void {
    this.skinConcerns = this.toggleInList(this.skinConcerns, option);
  }

  toggleIngredient(option: string): void {
    this.ingredientPreferences = this.toggleInList(this.ingredientPreferences, option);
  }

  removeIngredient(option: string): void {
    this.ingredientPreferences = this.ingredientPreferences.filter((x) => x !== option);
  }

  addBrand(brand: string): void {
    const normalized = brand.trim();
    if (!normalized) return;
    if (!this.favoriteBrands.includes(normalized)) {
      this.favoriteBrands = [...this.favoriteBrands, normalized];
    }
    this.brandSearch = '';
  }

  removeBrand(brand: string): void {
    this.favoriteBrands = this.favoriteBrands.filter((x) => x !== brand);
  }

  get filteredBrandOptions(): string[] {
    const keyword = this.brandSearch.trim().toLowerCase();
    return this.brandOptions
      .filter((x) => !this.favoriteBrands.includes(x))
      .filter((x) => !keyword || x.toLowerCase().includes(keyword))
      .slice(0, 6);
  }

  private toggleInList(list: string[], value: string): string[] {
    return list.includes(value)
      ? list.filter((x) => x !== value)
      : [...list, value];
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
