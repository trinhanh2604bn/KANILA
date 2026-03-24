import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { take } from 'rxjs/operators';
import { ProfileHubService } from '../../services/profile-hub.service';

@Component({
  selector: 'app-change-password-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './change-password-modal.html',
  styleUrls: ['./change-password-modal.css'],
})
export class ChangePasswordModalComponent implements OnChanges {
  @Input() open = false;
  @Input() hasPassword = true;
  @Output() openChange = new EventEmitter<boolean>();
  @Output() passwordChanged = new EventEmitter<void>();

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  showCurrent = false;
  showNew = false;
  showConfirm = false;

  submitting = false;
  formError = '';
  fieldErrors: Record<string, string> = {};

  constructor(private readonly profileHub: ProfileHubService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open']?.currentValue === true) {
      this.resetForm();
    }
  }

  close(): void {
    this.open = false;
    this.openChange.emit(false);
    this.resetForm();
  }

  toggle(which: 'current' | 'new' | 'confirm'): void {
    if (which === 'current') this.showCurrent = !this.showCurrent;
    if (which === 'new') this.showNew = !this.showNew;
    if (which === 'confirm') this.showConfirm = !this.showConfirm;
  }

  submit(): void {
    this.formError = '';
    this.fieldErrors = {};
    if (!this.hasPassword) {
      this.formError = 'Tài khoản chưa thiết lập mật khẩu đăng nhập.';
      return;
    }
    if (!this.currentPassword.trim()) this.fieldErrors['currentPassword'] = 'Vui lòng nhập mật khẩu hiện tại.';
    if (!this.newPassword) this.fieldErrors['newPassword'] = 'Vui lòng nhập mật khẩu mới.';
    if (!this.confirmPassword) this.fieldErrors['confirmPassword'] = 'Vui lòng xác nhận mật khẩu mới.';
    if (this.newPassword && this.confirmPassword && this.newPassword !== this.confirmPassword) {
      this.fieldErrors['confirmPassword'] = 'Mật khẩu xác nhận không khớp.';
    }
    if (Object.keys(this.fieldErrors).length) return;

    if (this.newPassword.length < 8) {
      this.fieldErrors['newPassword'] = 'Mật khẩu mới cần ít nhất 8 ký tự, gồm chữ và số.';
      return;
    }
    if (!/[A-Za-zÀ-ỹ]/.test(this.newPassword) || !/[0-9]/.test(this.newPassword)) {
      this.fieldErrors['newPassword'] = 'Mật khẩu mới cần có ít nhất một chữ cái và một chữ số.';
      return;
    }
    if (this.newPassword === this.currentPassword) {
      this.fieldErrors['newPassword'] = 'Mật khẩu mới phải khác mật khẩu hiện tại.';
      return;
    }

    this.submitting = true;
    this.profileHub
      .changePassword({
        currentPassword: this.currentPassword,
        newPassword: this.newPassword,
        confirmPassword: this.confirmPassword,
      })
      .pipe(take(1))
      .subscribe({
        next: () => {
          this.submitting = false;
          this.passwordChanged.emit();
          this.close();
        },
        error: (err) => {
          this.submitting = false;
          const msg = err?.error?.message || 'Không thể đổi mật khẩu. Vui lòng thử lại.';
          this.formError = msg;
        },
      });
  }

  private resetForm(): void {
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.showCurrent = false;
    this.showNew = false;
    this.showConfirm = false;
    this.formError = '';
    this.fieldErrors = {};
    this.submitting = false;
  }
}
