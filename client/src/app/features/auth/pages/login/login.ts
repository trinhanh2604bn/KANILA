import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { CartService } from '../../../cart/services/cart.service';
import { WishlistService } from '../../../account/services/wishlist.service';
import { ToastService } from '../../../../core/services/toast.service';
import { LoginRequest } from '../../../../core/models/auth.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule, ReactiveFormsModule ],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements OnInit {
  loginData = {
    email: '',
    password: ''
  };
  showError: boolean = false;
  loginForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private cartService: CartService,
    private wishlistService: WishlistService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onLogin() {
    this.showError = false;
    const email = this.loginData.email.trim().toLowerCase();
    const password = this.loginData.password;
    if (!email || !password) {
      this.showError = true;
      this.toast.warning('Vui lòng nhập email và mật khẩu.');
      return;
    }
    if (!this.isValidEmail(email)) {
      this.showError = true;
      this.toast.warning('Email không đúng định dạng.');
      return;
    }

    const payload: LoginRequest = { email, password };
    this.authService.login(payload).subscribe({
      next: (res) => {
        if (res.success && res?.data?.token) {
          this.authService.setToken(res.data.token);

          if (this.authService.isCustomerAccountFromToken()) {
            forkJoin({
              cart: this.cartService.mergeGuestCartOnLogin(),
              wishlist: this.wishlistService.syncWishlistState(),
            }).subscribe({
              next: () => {
                this.toast.success('Đăng nhập thành công. Giỏ hàng & yêu thích đã được đồng bộ.');
                this.router.navigate(['/home']);
              },
              error: () => {
                this.toast.warning('Đăng nhập thành công. Một số dữ liệu chưa đồng bộ — vui lòng tải lại trang.');
                this.router.navigate(['/home']);
              },
            });
            return;
          }

          this.toast.success('Đăng nhập thành công.');
          this.router.navigate(['/home']);
          return;
        }
        this.showError = true;
        this.toast.error(res.message || 'Đăng nhập thất bại.');
      },
      error: (err: any) => {
        this.showError = true;
        this.toast.error(err?.error?.message || 'Email hoặc mật khẩu không đúng.');
      }
    });
  }

  goTo(platform: string) {
    if (platform === 'google') window.open('https://mail.google.com/', '_blank');
    if (platform === 'facebook') window.open('https://www.facebook.com/', '_blank');
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
  }
}
