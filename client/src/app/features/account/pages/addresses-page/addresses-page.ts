import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { take } from 'rxjs/operators';
import { AddressManageModalComponent } from '../../components/address-manage-modal/address-manage-modal';
import { AddressService, CustomerAddressDto } from '../../services/address.service';
import { ProfileHubService } from '../../services/profile-hub.service';

@Component({
  selector: 'app-addresses-page',
  standalone: true,
  imports: [CommonModule, AddressManageModalComponent],
  templateUrl: './addresses-page.html',
  styleUrls: ['./addresses-page.css'],
})
export class AddressesPageComponent implements OnInit {
  addressModalOpen = false;
  modalAction: 'list' | 'add' | 'edit' = 'list';
  modalTargetAddressId: string | null = null;
  addresses: CustomerAddressDto[] = [];
  loading = false;
  error = '';
  savingDefaultId = '';
  deletingId = '';
  confirmDeleteId: string | null = null;
  addressCount = 0;
  defaultAddressId: string | null = null;
  defaultAddressText = 'Chưa có địa chỉ mặc định';
  defaultAddressName = '';
  defaultAddressPhone = '';
  fromCheckout = false;
  returnUrl = '/checkout';

  constructor(
    private readonly profileHubService: ProfileHubService,
    private readonly addressService: AddressService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.fromCheckout = this.route.snapshot.queryParamMap.get('from') === 'checkout';
    this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/checkout';
    this.loadAddresses();
  }

  get hasSavedAddress(): boolean {
    return this.addressCount > 0;
  }

  openAddressModal(action: 'list' | 'add' | 'edit' = 'list', addressId: string | null = null): void {
    this.modalAction = action;
    this.modalTargetAddressId = addressId;
    this.addressModalOpen = true;
  }

  onAddressModalOpen(v: boolean): void {
    this.addressModalOpen = v;
    if (!v) {
      this.modalAction = 'list';
      this.modalTargetAddressId = null;
    }
  }

  onAddressesChanged(): void {
    this.loadAddresses();
  }

  setDefaultOptimistic(addressId: string): void {
    const prev = this.addresses.map((x) => ({ ...x }));
    this.savingDefaultId = addressId;
    this.addresses = this.addresses.map((a) => ({ ...a, is_default_shipping: a._id === addressId }));
    this.addressService.setDefault(addressId).pipe(take(1)).subscribe({
      next: () => {
        this.savingDefaultId = '';
        this.syncSummaryFromList();
      },
      error: (err) => {
        this.addresses = prev;
        this.savingDefaultId = '';
        this.error = err?.error?.message || 'Không thể đặt địa chỉ mặc định.';
      },
    });
  }

  askDelete(addressId: string): void {
    this.confirmDeleteId = addressId;
  }

  cancelDelete(): void {
    this.confirmDeleteId = null;
  }

  deleteAddress(addressId: string): void {
    this.deletingId = addressId;
    this.addressService.remove(addressId).pipe(take(1)).subscribe({
      next: () => {
        this.confirmDeleteId = null;
        this.deletingId = '';
        this.loadAddresses();
      },
      error: (err) => {
        this.error = err?.error?.message || 'Không thể xóa địa chỉ.';
        this.deletingId = '';
      },
    });
  }

  chooseForCheckout(address: CustomerAddressDto): void {
    const go = () => {
      this.router.navigateByUrl(`${this.returnUrl}?addressId=${encodeURIComponent(address._id)}`);
    };
    if (address.is_default_shipping) {
      go();
      return;
    }
    this.addressService.setDefault(address._id).pipe(take(1)).subscribe({
      next: () => go(),
      error: () => go(),
    });
  }

  displayAddress(a: CustomerAddressDto): string {
    return AddressService.formatFullAddress(a);
  }

  private loadAddresses(): void {
    this.loading = true;
    this.error = '';
    this.addressService.list().pipe(take(1)).subscribe({
      next: (rows) => {
        this.addresses = rows;
        this.loading = false;
        this.syncSummaryFromList();
      },
      error: () => {
        this.loading = false;
        this.error = 'Không thể tải danh sách địa chỉ.';
        this.refreshAddressSummaryFallback();
      },
    });
  }

  private syncSummaryFromList(): void {
    this.addressCount = this.addresses.length;
    const da = this.addresses.find((x) => x.is_default_shipping) || this.addresses[0] || null;
    if (da) {
      this.defaultAddressId = String(da._id || '');
      this.defaultAddressText = AddressService.formatFullAddress(da);
      this.defaultAddressName = da.recipient_name || '';
      this.defaultAddressPhone = da.phone || '';
    } else {
      this.defaultAddressId = null;
      this.defaultAddressText = 'Chưa có địa chỉ mặc định';
      this.defaultAddressName = '';
      this.defaultAddressPhone = '';
    }
  }

  private refreshAddressSummaryFallback(): void {
    this.profileHubService.getHub().pipe(take(1)).subscribe({
      next: (hub) => {
        this.addressCount = Number(hub.stats?.addressCount || 0);
        const da = hub.defaultAddress;
        if (da) {
          this.defaultAddressId = String(da.addressId || '');
          this.defaultAddressText = da.fullAddress || '';
          this.defaultAddressName = da.recipientName || '';
          this.defaultAddressPhone = da.phone || '';
        }
      },
    });
  }
}
