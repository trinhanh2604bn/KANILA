import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [FormsModule, RouterModule, CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  // --- 1. DỮ LIỆU DANH MỤC CÓ PHÂN CẤP (NESTED CATEGORIES) ---
  categories = [
    { 
      id: 'c1', name: 'Khuôn mặt', 
      subCategories: [{ id: 'c1_1', name: 'Kem nền' }, { id: 'c1_2', name: 'Phấn phủ' }, { id: 'c1_3', name: 'Kem lót' }] 
    },
    { 
      id: 'c2', name: 'Đôi môi', 
      subCategories: [{ id: 'c2_1', name: 'Son thỏi' }, { id: 'c2_2', name: 'Son kem' }, { id: 'c2_3', name: 'Son dưỡng' }] 
    },
    { 
      id: 'c3', name: 'Đôi mắt', 
      subCategories: [{ id: 'c3_1', name: 'Phấn mắt' }, { id: 'c3_2', name: 'Kẻ mắt' }, { id: 'c3_3', name: 'Mascara' }] 
    },
    { 
      id: 'c4', name: 'Đôi má', 
      subCategories: [{ id: 'c4_1', name: 'Phấn má' }, { id: 'c4_2', name: 'Tạo khối' }, { id: 'c4_3', name: 'Highlight' }] 
    },
    { 
      id: 'c5', name: 'Set quà', 
      subCategories: [{ id: 'c5_1', name: 'Set mini' }, { id: 'c5_2', name: 'Set fullsize' }] 
    }
  ];
  
  brands = ['Dior', 'Gucci', 'MAC', 'Chanel', 'Romand', '3CE', 'Maybelline'];
  skinTypes = ['Da dầu', 'Da khô', 'Da nhạy cảm', 'Da hỗn hợp', 'Mọi loại da'];

  allProducts = [
    { id: 1, name: 'Son MAC Ruby Woo', brand: 'MAC', parentId: 'c2', subId: 'c2_1', price: 650000, sold: 120 },
    { id: 2, name: 'Phấn má hồng Romand', brand: 'Romand', parentId: 'c4', subId: 'c4_1', price: 180000, sold: 900 },
    { id: 3, name: 'Highlight Dior', brand: 'Dior', parentId: 'c4', subId: 'c4_3', price: 1200000, sold: 150 },
    { id: 4, name: 'Phấn Tạo khối 3CE', brand: '3CE', parentId: 'c4', subId: 'c4_2', price: 350000, sold: 400 },
    { id: 5, name: 'Kem Nền Dior Forever', brand: 'Dior', parentId: 'c1', subId: 'c1_1', price: 1500000, sold: 450 }
  ];
  
  filteredProducts: any[] = [];

  // --- 2. TRẠNG THÁI BỘ LỌC (STATE) ---
  selectedParentCategory: any = null; // Lưu Object danh mục cha đang chọn (Ví dụ: Đôi má)
  selectedSubCategory: string | null = null; // Lưu ID danh mục con đang chọn (Ví dụ: c4_1 - Phấn má)
  
  selectedBrands: string[] = [];
  selectedSkinTypes: string[] = [];
  selectedPrice: { label: string, min: number, max: number } | null = null;
  activeSort: string = 'popular'; 
  openDropdown: string | null = null;

  minPriceInput: number = 0;
  maxPriceInput: number = 5000000; 
  maxLimit: number = 5000000; 

  ngOnInit() {
    this.filteredProducts = [...this.allProducts];
  }

  // --- 3. HÀM XỬ LÝ DANH MỤC ---
  // Chọn danh mục lớn (Đôi má, Đôi môi...)
  selectParentCategory(cat: any) {
    this.selectedParentCategory = cat;
    this.selectedSubCategory = null; // Đổi danh mục cha thì reset danh mục con
    this.triggerApiCall();
  }

  // Chọn danh mục con (Phấn má, Highlight...)
  selectSubCategory(subId: string) {
    this.selectedSubCategory = this.selectedSubCategory === subId ? null : subId;
    this.triggerApiCall();
  }

  // Bấm vào chữ "Sản phẩm" ở Breadcrumb để quay lại xem tất cả
  resetToAllProducts() {
    this.selectedParentCategory = null;
    this.selectedSubCategory = null;
    this.triggerApiCall();
  }

  // --- 4. CÁC HÀM XỬ LÝ LỌC GIỮ NGUYÊN ---
  onMinPriceInput() {
    if (this.minPriceInput < 0) this.minPriceInput = 0;
    if (this.minPriceInput > this.maxPriceInput) this.minPriceInput = this.maxPriceInput;
    this.updatePriceLabel();
  }

  onMaxPriceInput() {
    if (this.maxPriceInput > this.maxLimit) this.maxPriceInput = this.maxLimit;
    if (this.maxPriceInput < this.minPriceInput) this.maxPriceInput = this.minPriceInput;
    this.updatePriceLabel();
  }

  updatePriceLabel() {
    this.selectedPrice = {
      label: `Giá: ${this.minPriceInput.toLocaleString('vi-VN')}đ - ${this.maxPriceInput.toLocaleString('vi-VN')}đ`,
      min: this.minPriceInput, max: this.maxPriceInput
    };
  }

  onPriceChangeDone() { this.triggerApiCall(); }

  toggleDropdown(dropdownName: string, event: Event) {
    event.stopPropagation();
    this.openDropdown = this.openDropdown === dropdownName ? null : dropdownName;
  }

  toggleBrand(brand: string) {
    const index = this.selectedBrands.indexOf(brand);
    if (index > -1) this.selectedBrands.splice(index, 1);
    else this.selectedBrands.push(brand);
    this.triggerApiCall();
  }

  toggleSkinType(type: string) {
    const index = this.selectedSkinTypes.indexOf(type);
    if (index > -1) this.selectedSkinTypes.splice(index, 1);
    else this.selectedSkinTypes.push(type);
    this.triggerApiCall();
  }

  selectSort(sortType: string) {
    this.activeSort = sortType;
    this.triggerApiCall();
  }

  removeFilter(type: string, value: any) {
    if (type === 'brand') this.selectedBrands = this.selectedBrands.filter(b => b !== value);
    else if (type === 'skin') this.selectedSkinTypes = this.selectedSkinTypes.filter(s => s !== value);
    else if (type === 'price') {
      this.selectedPrice = null; this.minPriceInput = 0; this.maxPriceInput = this.maxLimit;
    }
    this.triggerApiCall();
  }

  clearAllFilters() {
    this.selectedBrands = []; this.selectedSkinTypes = []; this.selectedPrice = null;
    this.minPriceInput = 0; this.maxPriceInput = this.maxLimit;
    this.triggerApiCall();
  }

  hasActiveFilters(): boolean {
    return this.selectedBrands.length > 0 || this.selectedSkinTypes.length > 0 || this.selectedPrice !== null;
  }

  triggerApiCall() {
    let temp = [...this.allProducts];

    // Lọc theo Danh mục Cha
    if (this.selectedParentCategory) {
      temp = temp.filter(p => p.parentId === this.selectedParentCategory.id);
    }
    // Lọc theo Danh mục Con
    if (this.selectedSubCategory) {
      temp = temp.filter(p => p.subId === this.selectedSubCategory);
    }

    if (this.selectedBrands.length > 0) temp = temp.filter(p => this.selectedBrands.includes(p.brand));
    temp = temp.filter(p => p.price >= this.minPriceInput && p.price <= this.maxPriceInput);

    if (this.activeSort === 'price_asc') temp.sort((a, b) => a.price - b.price);
    else if (this.activeSort === 'price_desc') temp.sort((a, b) => b.price - a.price);
    else if (this.activeSort === 'popular') temp.sort((a, b) => b.sold - a.sold);

    this.filteredProducts = temp;
  }

  @HostListener('document:click')
  onDocumentClick() { this.openDropdown = null; }
}