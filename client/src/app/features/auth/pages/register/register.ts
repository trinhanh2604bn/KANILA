import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-register',
  imports: [FormsModule, CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register implements OnInit {
  registerForm!: FormGroup;
  isSubmitting = false;
  submitError = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.registerForm = this.fb.group({
      fullName: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern('^0[0-9]{9}$')]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    });
  }

  get isPasswordMismatch() {
    const pass = this.registerForm.get('password')?.value;
    const confirm = this.registerForm.get('confirmPassword')?.value;
    return confirm && pass !== confirm;
  }
  onRegister() {
    this.submitError = '';

    if (this.registerForm.invalid || this.isPasswordMismatch) {
      this.submitError = 'Vui lòng nhập đầy đủ thông tin hợp lệ.';
      return;
    }

    this.isSubmitting = true;

    const userData = {
      full_name: this.registerForm.value.fullName.trim(),
      email: this.registerForm.value.email.trim().toLowerCase(),
      phone: this.registerForm.value.phone.trim(),
      password: this.registerForm.value.password
    };

    this.authService.register(userData).subscribe({
      next: (res) => {
        // Dùng toast sẽ chuyên nghiệp hơn alert
        this.toast.success('Đăng ký thành công!');
        this.router.navigate(['/auth/login']);
      },
      error: (err) => {
        this.isSubmitting = false;

        // 1. Lấy message gốc từ Backend để debug (xem trong Console)
        const serverMessage = err?.error?.message || '';
        console.error('Đăng ký thất bại:', serverMessage);

        // 2. Kiểm tra mã lỗi cụ thể (Thường Backend trả về 409 cho Conflict/Tồn tại)
        if (err.status === 409 || serverMessage.includes('already exists')) {
          this.submitError = 'Email này đã được sử dụng. Vui lòng thử email khác.';
        }
        else if (err.status === 400) {
          // Nếu là lỗi 400, hãy hiển thị đúng message từ server (ví dụ: "Email sai định dạng")
          this.submitError = serverMessage || 'Dữ liệu không hợp lệ, vui lòng kiểm tra lại.';
        }
        else {
          this.submitError = 'Hệ thống đang bận, vui lòng thử lại sau.';
        }
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }

}
