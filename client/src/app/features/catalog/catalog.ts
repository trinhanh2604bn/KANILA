import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-catalog',
  imports: [FormsModule, RouterModule, CommonModule],
  templateUrl: './catalog.html',
  styleUrl: './catalog.css',
})
export class Catalog implements OnInit {
  isSalePage: boolean = false;
  isScrolled: boolean = false;

  categories = [
    { id: 'c1', slug: 'face', name: 'Khuôn mặt', subCategories: [{ id: 'c1_1', name: 'Kem nền' }, { id: 'c1_2', name: 'Phấn phủ' }, { id: 'c1_3', name: 'Kem lót' }] },
    { id: 'c2', slug: 'lips', name: 'Đôi môi', subCategories: [{ id: 'c2_1', name: 'Son thỏi' }, { id: 'c2_2', name: 'Son kem' }, { id: 'c2_3', name: 'Son dưỡng' }] },
    { id: 'c3', slug: 'eyes', name: 'Đôi mắt', subCategories: [{ id: 'c3_1', name: 'Phấn mắt' }, { id: 'c3_2', name: 'Kẻ mắt' }, { id: 'c3_3', name: 'Mascara' }] },
    { id: 'c4', slug: 'cheeks', name: 'Đôi má', subCategories: [{ id: 'c4_1', name: 'Phấn má' }, { id: 'c4_2', name: 'Tạo khối' }, { id: 'c4_3', name: 'Highlight' }] },
    { id: 'c5', slug: 'gifts', name: 'Set quà', subCategories: [{ id: 'c5_1', name: 'Set mini' }, { id: 'c5_2', name: 'Set fullsize' }] }
  ];

  brands = ['Dior', 'Gucci', 'MAC', 'Chanel', 'Romand', '3CE', 'Maybelline'];
  skinTypes = ['Da dầu', 'Da khô', 'Da nhạy cảm', 'Da hỗn hợp', 'Mọi loại da'];

  allProducts = [
    { id: 1, name: 'Son MAC Ruby Woo', brand: 'MAC', parentId: 'c2', subId: 'c2_1', skinType: 'Mọi loại da', price: 550000, oldPrice: 650000, isSale: true, sold: 1200 },
    { id: 2, name: 'Phấn má hồng Romand', brand: 'Romand', parentId: 'c4', subId: 'c4_1', skinType: 'Mọi loại da', price: 180000, oldPrice: null, isSale: false, sold: 900 },
    { id: 3, name: 'Highlight Dior Backstage', brand: 'Dior', parentId: 'c4', subId: 'c4_3', skinType: 'Da hỗn hợp', price: 950000, oldPrice: 1200000, isSale: true, sold: 150 },
    { id: 4, name: 'Phấn Tạo khối 3CE', brand: '3CE', parentId: 'c4', subId: 'c4_2', skinType: 'Da dầu', price: 350000, oldPrice: null, isSale: false, sold: 400 },
    { id: 5, name: 'Kem Nền Dior Forever', brand: 'Dior', parentId: 'c1', subId: 'c1_1', skinType: 'Da dầu', price: 1500000, oldPrice: null, isSale: false, sold: 450 },
    { id: 6, name: 'Son Kem Gucci Rouge', brand: 'Gucci', parentId: 'c2', subId: 'c2_2', skinType: 'Da khô', price: 990000, oldPrice: 1100000, isSale: true, sold: 300 },
    { id: 7, name: 'Phấn Phủ Chanel', brand: 'Chanel', parentId: 'c1', subId: 'c1_2', skinType: 'Da nhạy cảm', price: 1850000, oldPrice: null, isSale: false, sold: 85 },
    { id: 8, name: 'Mascara Maybelline', brand: 'Maybelline', parentId: 'c3', subId: 'c3_3', skinType: 'Mọi loại da', price: 150000, oldPrice: null, isSale: false, sold: 2500 },
    { id: 9, name: 'Son Dưỡng Dior Addict', brand: 'Dior', parentId: 'c2', subId: 'c2_3', skinType: 'Mọi loại da', price: 850000, oldPrice: null, isSale: false, sold: 500 },
    { id: 10, name: 'Kẻ mắt nước MAC', brand: 'MAC', parentId: 'c3', subId: 'c3_2', skinType: 'Da dầu', price: 450000, oldPrice: 550000, isSale: true, sold: 120 }
  ];

  filteredProducts: any[] = [];

  selectedParentCategory: any = null;
  selectedSubCategory: string | null = null;
  selectedBrands: string[] = [];
  selectedSkinTypes: string[] = [];
  selectedPrice: { label: string, min: number, max: number } | null = null;
  activeSort: string = 'popular';
  openDropdown: string | null = null;

  selectedBrandFromHeader: string | null = null;

  minPriceInput: number = 0;
  maxPriceInput: number = 5000000;
  maxLimit: number = 5000000;

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.route.url.subscribe(urlSegments => {
      this.isSalePage = (urlSegments.length > 0 && urlSegments[0].path === 'sale');
    });

    this.route.queryParams.subscribe(params => {
      const categorySlug = params['category'];
      const subCategoryId = params['sub'];
      const rawBrandQuery = params['brand']; // Lấy tên thương hiệu từ URL (nguyên bản)

      // --- GIẢI PHÁP 1: CHUẨN HÓA CHỮ HOA/THƯỜNG TỪ URL ---
      let brandQuery = null;
      if (rawBrandQuery) {
        // Tìm xem trong mảng brands gốc có chữ nào giống y hệt không (bỏ qua hoa/thường)
        const matchedBrand = this.brands.find(b => b.toLowerCase() === rawBrandQuery.toLowerCase());
        // Nếu tìm thấy, dùng chữ chuẩn (VD: 'Dior'). Nếu không, dùng chữ gốc từ URL.
        brandQuery = matchedBrand ? matchedBrand : rawBrandQuery;
      }

      if (!categorySlug && !subCategoryId && !brandQuery) {
        this.selectedBrands = [];
        this.selectedSkinTypes = [];
        this.selectedPrice = null;
        this.minPriceInput = 0;
        this.maxPriceInput = this.maxLimit;
        this.selectedBrandFromHeader = null;
        this.selectedParentCategory = null;
        this.selectedSubCategory = null;
      } else {

        if (brandQuery) {
          this.selectedBrandFromHeader = brandQuery;
          this.selectedBrands = [brandQuery];
        } else {
          if (this.selectedBrandFromHeader) {
              this.selectedBrands = this.selectedBrands.filter(b => b !== this.selectedBrandFromHeader);
          }
          this.selectedBrandFromHeader = null;
        }

        if (categorySlug) {
          this.selectedParentCategory = this.categories.find(c => c.slug === categorySlug) || null;
        } else {
          this.selectedParentCategory = null;
        }

        if (subCategoryId) {
          this.selectedSubCategory = subCategoryId;
        } else {
          this.selectedSubCategory = null;
        }
      }

      this.applyLocalFilters();
    });
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 100;
  }

  getSubCategoryName(): string {
    if (this.selectedParentCategory && this.selectedSubCategory) {
      const sub = this.selectedParentCategory.subCategories.find((s: any) => s.id === this.selectedSubCategory);
      return sub ? sub.name : '';
    }
    return '';
  }

  selectParentCategory(cat: any) {
    const newCatSlug = this.selectedParentCategory?.id === cat.id ? null : cat.slug;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { category: newCatSlug, sub: null },
      queryParamsHandling: 'merge'
    });
  }

  selectSubCategory(subId: string) {
    const newSubId = this.selectedSubCategory === subId ? null : subId;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { sub: newSubId },
      queryParamsHandling: 'merge'
    });
  }

  resetToAllProducts() {
    this.selectedBrands = [];
    this.selectedSkinTypes = [];
    this.selectedPrice = null;
    this.minPriceInput = 0;
    this.maxPriceInput = this.maxLimit;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { category: null, sub: null, brand: null },
      queryParamsHandling: 'merge'
    });
  }

  clearCategoryFilter() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { category: null, sub: null },
      queryParamsHandling: 'merge'
    });
  }

  clearBrandFilter() {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { brand: null },
      queryParamsHandling: 'merge'
    });
  }

  applyLocalFilters() {
    let temp = [...this.allProducts];

    if (this.isSalePage) temp = temp.filter(p => p.isSale === true);

    if (this.selectedSubCategory) temp = temp.filter(p => p.subId === this.selectedSubCategory);
    else if (this.selectedParentCategory) temp = temp.filter(p => p.parentId === this.selectedParentCategory.id);

    // --- GIẢI PHÁP 2: LỌC MẠNH TAY KHÔNG PHÂN BIỆT HOA THƯỜNG ---
    if (this.selectedBrands.length > 0) {
      // Ép mảng điều kiện lọc về dạng chữ thường
      const lowerSelectedBrands = this.selectedBrands.map(b => b.toLowerCase());
      // Lọc sản phẩm (ép tên brand sản phẩm về chữ thường để so sánh)
      temp = temp.filter(p => lowerSelectedBrands.includes(p.brand.toLowerCase()));
    }

    if (this.selectedSkinTypes.length > 0) temp = temp.filter(p => this.selectedSkinTypes.includes(p.skinType));

    temp = temp.filter(p => p.price >= this.minPriceInput && p.price <= this.maxPriceInput);

    if (this.activeSort === 'price_asc') temp.sort((a, b) => a.price - b.price);
    else if (this.activeSort === 'price_desc') temp.sort((a, b) => b.price - a.price);
    else if (this.activeSort === 'popular') temp.sort((a, b) => b.sold - a.sold);
    else if (this.activeSort === 'hot_deal') temp.sort((a, b) => b.sold - a.sold).filter(p => p.sold > 500);

    this.filteredProducts = temp;
  }

  onMinPriceInput() { if (this.minPriceInput < 0) this.minPriceInput = 0; if (this.minPriceInput > this.maxPriceInput) this.minPriceInput = this.maxPriceInput; this.updatePriceLabel(); }
  onMaxPriceInput() { if (this.maxPriceInput > this.maxLimit) this.maxPriceInput = this.maxLimit; if (this.maxPriceInput < this.minPriceInput) this.maxPriceInput = this.minPriceInput; this.updatePriceLabel(); }
  updatePriceLabel() { this.selectedPrice = { label: `Giá: ${this.minPriceInput.toLocaleString('vi-VN')}đ - ${this.maxPriceInput.toLocaleString('vi-VN')}đ`, min: this.minPriceInput, max: this.maxPriceInput }; }
  onPriceChangeDone() { this.applyLocalFilters(); }
  toggleDropdown(dropdownName: string, event: Event) { event.stopPropagation(); this.openDropdown = this.openDropdown === dropdownName ? null : dropdownName; }
  toggleBrand(brand: string) { const index = this.selectedBrands.indexOf(brand); if (index > -1) this.selectedBrands.splice(index, 1); else this.selectedBrands.push(brand); this.applyLocalFilters(); }
  toggleSkinType(type: string) { const index = this.selectedSkinTypes.indexOf(type); if (index > -1) this.selectedSkinTypes.splice(index, 1); else this.selectedSkinTypes.push(type); this.applyLocalFilters(); }
  selectSort(sortType: string) { this.activeSort = sortType; this.applyLocalFilters(); }
  removeFilter(type: string, value: any) { if (type === 'brand') this.selectedBrands = this.selectedBrands.filter(b => b !== value); else if (type === 'skin') this.selectedSkinTypes = this.selectedSkinTypes.filter(s => s !== value); else if (type === 'price') { this.selectedPrice = null; this.minPriceInput = 0; this.maxPriceInput = this.maxLimit; } this.applyLocalFilters(); }

  clearAllFilters() {
    this.selectedSkinTypes = [];
    this.selectedPrice = null;
    this.minPriceInput = 0;
    this.maxPriceInput = this.maxLimit;
    if (this.selectedBrandFromHeader) {
        this.selectedBrands = [this.selectedBrandFromHeader];
    } else {
        this.selectedBrands = [];
    }
    this.applyLocalFilters();
  }

  hasActiveFilters(): boolean {
    const hasOtherBrands = this.selectedBrands.filter(b => b !== this.selectedBrandFromHeader).length > 0;
    return hasOtherBrands || this.selectedSkinTypes.length > 0 || this.selectedPrice !== null;
  }

  @HostListener('document:click')
  onDocumentClick() { this.openDropdown = null; }
}
