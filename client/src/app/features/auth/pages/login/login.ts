import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { CartService } from '../../../cart/services/cart.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule, ReactiveFormsModule ],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements OnInit {
  [x: string]: any;
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

    this.authService.login(this.loginData).subscribe({
      next: (res: any) => {
        if (res.success) {
          localStorage.setItem('token', res.data.token);
          this.cartService.syncGuestCartAfterLogin().subscribe(() => {
            this.toast.success('Giỏ hàng của bạn đã được đồng bộ.');
          });
          this.router.navigate(['/home']); 
        }
      },
      error: (err: any) => {
        this.showError = true; 
        console.error('Login failed:', err);
      }
    });
  }

  goTo(platform: string) {
    if (platform === 'google') window.open('https://mail.google.com/', '_blank');
    if (platform === 'facebook') window.open('https://www.facebook.com/', '_blank');
  }
}
