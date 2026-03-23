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

  // TÔI ĐÃ THÊM THUỘC TÍNH 'slug' VÀO ĐÂY ĐỂ HIỂN THỊ LÊN URL CHO ĐẸP (VD: face, lips)
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

  minPriceInput: number = 0;
  maxPriceInput: number = 5000000; 
  maxLimit: number = 5000000; 

  // NHÚNG THÊM Router ĐỂ CẬP NHẬT URL
  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    // 1. Lắng nghe thay đổi đường dẫn chính (/shop hay /sale)
    this.route.url.subscribe(urlSegments => {
      this.isSalePage = (urlSegments.length > 0 && urlSegments[0].path === 'sale');
    });

    // 2. Lắng nghe tham số Query trên URL (vd: ?category=face&sub=c1_1)
    this.route.queryParams.subscribe(params => {
      const categorySlug = params['category'];
      const subCategoryId = params['sub'];

      // Khôi phục Danh mục cha từ URL
      if (categorySlug) {
        this.selectedParentCategory = this.categories.find(c => c.slug === categorySlug) || null;
      } else {
        this.selectedParentCategory = null;
      }

      // Khôi phục Danh mục con từ URL
      if (subCategoryId) {
        this.selectedSubCategory = subCategoryId;
      } else {
        this.selectedSubCategory = null;
      }

      // Gọi hàm lọc để hiển thị sản phẩm tương ứng
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

  // --- CÁC HÀM XỬ LÝ CLICK GIỜ SẼ CẬP NHẬT URL THAY VÌ CHỈ ĐỔI BIẾN LOCAL ---

  selectParentCategory(cat: any) {
    // Đẩy tham số category lên URL (xóa sub category nếu có)
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { category: cat.slug, sub: null },
      queryParamsHandling: 'merge' // Giữ lại các tham số khác nếu có
    });
  }

  selectSubCategory(subId: string) {
    // Khi click lại vào danh mục con đang chọn thì bỏ chọn
    const newSubId = this.selectedSubCategory === subId ? null : subId;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { sub: newSubId },
      queryParamsHandling: 'merge'
    });
  }

  resetToAllProducts() {
    // Xóa param category và sub khỏi URL
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { category: null, sub: null },
      queryParamsHandling: 'merge'
    });
  }

  // --- LOGIC LỌC DỮ LIỆU ---
  applyLocalFilters() {
    let temp = [...this.allProducts];
    if (this.isSalePage) temp = temp.filter(p => p.isSale === true);
    if (this.selectedSubCategory) temp = temp.filter(p => p.subId === this.selectedSubCategory);
    else if (this.selectedParentCategory) temp = temp.filter(p => p.parentId === this.selectedParentCategory.id);
    if (this.selectedBrands.length > 0) temp = temp.filter(p => this.selectedBrands.includes(p.brand));
    if (this.selectedSkinTypes.length > 0) temp = temp.filter(p => this.selectedSkinTypes.includes(p.skinType));
    temp = temp.filter(p => p.price >= this.minPriceInput && p.price <= this.maxPriceInput);
    if (this.activeSort === 'price_asc') temp.sort((a, b) => a.price - b.price);
    else if (this.activeSort === 'price_desc') temp.sort((a, b) => b.price - a.price);
    else if (this.activeSort === 'popular') temp.sort((a, b) => b.sold - a.sold);
    else if (this.activeSort === 'hot_deal') temp.sort((a, b) => b.sold - a.sold).filter(p => p.sold > 500); 
    this.filteredProducts = temp;
  }

  // Các hàm còn lại giữ nguyên
  onMinPriceInput() { if (this.minPriceInput < 0) this.minPriceInput = 0; if (this.minPriceInput > this.maxPriceInput) this.minPriceInput = this.maxPriceInput; this.updatePriceLabel(); }
  onMaxPriceInput() { if (this.maxPriceInput > this.maxLimit) this.maxPriceInput = this.maxLimit; if (this.maxPriceInput < this.minPriceInput) this.maxPriceInput = this.minPriceInput; this.updatePriceLabel(); }
  updatePriceLabel() { this.selectedPrice = { label: `Giá: ${this.minPriceInput.toLocaleString('vi-VN')}đ - ${this.maxPriceInput.toLocaleString('vi-VN')}đ`, min: this.minPriceInput, max: this.maxPriceInput }; }
  onPriceChangeDone() { this.applyLocalFilters(); }
  toggleDropdown(dropdownName: string, event: Event) { event.stopPropagation(); this.openDropdown = this.openDropdown === dropdownName ? null : dropdownName; }
  toggleBrand(brand: string) { const index = this.selectedBrands.indexOf(brand); if (index > -1) this.selectedBrands.splice(index, 1); else this.selectedBrands.push(brand); this.applyLocalFilters(); }
  toggleSkinType(type: string) { const index = this.selectedSkinTypes.indexOf(type); if (index > -1) this.selectedSkinTypes.splice(index, 1); else this.selectedSkinTypes.push(type); this.applyLocalFilters(); }
  selectSort(sortType: string) { this.activeSort = sortType; this.applyLocalFilters(); }
  removeFilter(type: string, value: any) { if (type === 'brand') this.selectedBrands = this.selectedBrands.filter(b => b !== value); else if (type === 'skin') this.selectedSkinTypes = this.selectedSkinTypes.filter(s => s !== value); else if (type === 'price') { this.selectedPrice = null; this.minPriceInput = 0; this.maxPriceInput = this.maxLimit; } this.applyLocalFilters(); }
  clearAllFilters() { this.selectedBrands = []; this.selectedSkinTypes = []; this.selectedPrice = null; this.minPriceInput = 0; this.maxPriceInput = this.maxLimit; this.applyLocalFilters(); }
  hasActiveFilters(): boolean { return this.selectedBrands.length > 0 || this.selectedSkinTypes.length > 0 || this.selectedPrice !== null; }

  @HostListener('document:click')
  onDocumentClick() { this.openDropdown = null; }
}

