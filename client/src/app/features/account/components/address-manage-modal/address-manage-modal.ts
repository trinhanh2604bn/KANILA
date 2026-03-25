import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { take } from 'rxjs/operators';
import { AddressService, AddressWritePayload, CustomerAddressDto } from '../../services/address.service';

type FormModel = {
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  ward: string;
  district: string;
  provinceOrCity: string;
  countryCode: string;
  postalCode: string;
  addressType: 'home' | 'office' | 'other';
  addressNote: string;
};

@Component({
  selector: 'app-address-manage-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './address-manage-modal.html',
  styleUrls: ['./address-manage-modal.css'],
})
export class AddressManageModalComponent implements OnChanges {
  @Input() open = false;
  @Input() initialAction: 'list' | 'add' | 'edit' = 'list';
  @Input() targetAddressId: string | null = null;
  @Output() openChange = new EventEmitter<boolean>();
  @Output() addressesChanged = new EventEmitter<void>();

  addresses: CustomerAddressDto[] = [];
  loadingList = false;
  saving = false;
  listError = '';

  mode: 'list' | 'form' = 'list';
  editingId: string | null = null;
  formError = '';
  fieldErrors: Record<string, string> = {};
  deleteConfirmId: string | null = null;

  form: FormModel = this.emptyForm();

  readonly addressTypeLabel: Record<string, string> = {
    home: 'Nhà riêng',
    office: 'Văn phòng',
    other: 'Khác',
  };

  constructor(private readonly addressService: AddressService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open']?.currentValue === true) {
      this.mode = 'list';
      this.editingId = null;
      this.loadList(() => {
        if (this.initialAction === 'add') {
          this.startAdd();
          return;
        }
        if (this.initialAction === 'edit' && this.targetAddressId) {
          const matched = this.addresses.find((x) => x._id === this.targetAddressId);
          if (matched) this.startEdit(matched);
        }
      });
    }
  }

  close(): void {
    this.open = false;
    this.openChange.emit(false);
    this.resetUi();
  }

  loadList(onLoaded?: () => void): void {
    this.loadingList = true;
    this.listError = '';
    this.addressService
      .list()
      .pipe(take(1))
      .subscribe({
        next: (rows) => {
          this.addresses = rows;
          this.loadingList = false;
          onLoaded?.();
        },
        error: () => {
          this.loadingList = false;
          this.listError = 'Không thể tải danh sách địa chỉ.';
        },
      });
  }

  startAdd(): void {
    this.mode = 'form';
    this.editingId = null;
    this.form = this.emptyForm();
    this.formError = '';
    this.fieldErrors = {};
    this.deleteConfirmId = null;
  }

  startEdit(a: CustomerAddressDto): void {
    this.mode = 'form';
    this.editingId = a._id;
    this.form = {
      recipientName: a.recipient_name || '',
      phone: a.phone || '',
      addressLine1: a.address_line_1 || '',
      addressLine2: a.address_line_2 || '',
      ward: a.ward || '',
      district: a.district || '',
      provinceOrCity: a.city || '',
      countryCode: (a.country_code || 'VN').toUpperCase(),
      postalCode: a.postal_code || '',
      addressType: (a.address_type as FormModel['addressType']) || 'home',
      addressNote: a.address_note || '',
    };
    this.formError = '';
    this.fieldErrors = {};
    this.deleteConfirmId = null;
  }

  backToList(): void {
    this.mode = 'list';
    this.editingId = null;
    this.formError = '';
    this.fieldErrors = {};
    this.loadList();
  }

  validateForm(): boolean {
    this.fieldErrors = {};
    if (!this.form.recipientName.trim()) this.fieldErrors['recipientName'] = 'Vui lòng nhập họ tên.';
    if (!this.form.phone.trim()) this.fieldErrors['phone'] = 'Vui lòng nhập số điện thoại.';
    else if (!/^[\d+\-\s()]{9,}$/.test(this.form.phone.trim())) {
      this.fieldErrors['phone'] = 'Số điện thoại không hợp lệ.';
    }
    if (!this.form.addressLine1.trim()) this.fieldErrors['addressLine1'] = 'Vui lòng nhập địa chỉ.';
    if (!this.form.provinceOrCity.trim()) this.fieldErrors['provinceOrCity'] = 'Vui lòng nhập tỉnh/thành phố.';
    return Object.keys(this.fieldErrors).length === 0;
  }

  submitForm(): void {
    if (!this.validateForm()) return;
    this.saving = true;
    this.formError = '';

    const baseFields: AddressWritePayload = {
      recipientName: this.form.recipientName,
      phone: this.form.phone,
      addressLine1: this.form.addressLine1,
      addressLine2: this.form.addressLine2,
      ward: this.form.ward,
      district: this.form.district,
      provinceOrCity: this.form.provinceOrCity,
      countryCode: this.form.countryCode,
      postalCode: this.form.postalCode,
      addressType: this.form.addressType,
      addressNote: this.form.addressNote,
      isDefaultShipping: false,
    };

    if (this.editingId) {
      this.addressService
        .update(this.editingId, {
          recipientName: baseFields.recipientName,
          phone: baseFields.phone,
          addressLine1: baseFields.addressLine1,
          addressLine2: baseFields.addressLine2,
          ward: baseFields.ward,
          district: baseFields.district,
          provinceOrCity: baseFields.provinceOrCity,
          countryCode: baseFields.countryCode,
          postalCode: baseFields.postalCode,
          addressType: baseFields.addressType,
          addressNote: baseFields.addressNote,
        })
        .pipe(take(1))
        .subscribe({
          next: () => {
            this.saving = false;
            this.addressesChanged.emit();
            this.backToList();
          },
          error: (err) => {
            this.saving = false;
            this.formError = err?.error?.message || 'Không thể cập nhật địa chỉ.';
          },
        });
    } else {
      this.addressService
        .create(baseFields)
        .pipe(take(1))
        .subscribe({
          next: () => {
            this.saving = false;
            this.addressesChanged.emit();
            this.backToList();
          },
          error: (err) => {
            this.saving = false;
            this.formError = err?.error?.message || 'Không thể thêm địa chỉ.';
          },
        });
    }
  }

  setDefault(id: string): void {
    this.saving = true;
    this.addressService
      .setDefault(id)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.saving = false;
          this.addressesChanged.emit();
          this.loadList();
        },
        error: (err) => {
          this.saving = false;
          this.listError = err?.error?.message || 'Không thể đặt địa chỉ mặc định.';
        },
      });
  }

  confirmDelete(id: string): void {
    this.deleteConfirmId = id;
  }

  cancelDelete(): void {
    this.deleteConfirmId = null;
  }

  deleteAddress(id: string): void {
    this.saving = true;
    this.addressService
      .remove(id)
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.saving = false;
          this.deleteConfirmId = null;
          this.addressesChanged.emit();
          this.loadList();
        },
        error: (err) => {
          this.saving = false;
          this.listError = err?.error?.message || 'Không thể xóa địa chỉ.';
        },
      });
  }

  displayLine(a: CustomerAddressDto): string {
    return AddressService.formatFullAddress(a);
  }

  trackById(_i: number, a: CustomerAddressDto): string {
    return a._id;
  }

  private emptyForm(): FormModel {
    return {
      recipientName: '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      ward: '',
      district: '',
      provinceOrCity: '',
      countryCode: 'VN',
      postalCode: '',
      addressType: 'home',
      addressNote: '',
    };
  }

  private resetUi(): void {
    this.mode = 'list';
    this.editingId = null;
    this.addresses = [];
    this.listError = '';
    this.formError = '';
    this.fieldErrors = {};
    this.deleteConfirmId = null;
    this.form = this.emptyForm();
  }
}
