import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  imports: [FormsModule, CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register implements OnInit {
  registerForm!: FormGroup;

  constructor(private fb: FormBuilder, private router: Router, private authService: AuthService) {}

  ngOnInit() {
    this.registerForm = this.fb.group({
      fullName: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern('^0[0-9]{9}$')]],
      email: ['', [Validators.required, Validators.pattern('^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,4}$')]],
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
    if (this.registerForm.invalid || this.isPasswordMismatch) {
      alert("Bạn phải nhập đủ thông tin để đăng ký!");
      return;
    }

    const userData = this.registerForm.value;

    this.authService.register(userData).subscribe({
      next: (res) => {
        alert("Đăng ký thành công!");
        this.router.navigate(['/auth/login']); // Chuyển sang Đăng nhập
      },
      error: (err) => {
        // Hiển thị lỗi từ Backend (ví dụ: email đã tồn tại)
        alert("Lỗi đăng ký: " + (err.error.message || "Không thể kết nối đến server."));
      }
    });
  }
}