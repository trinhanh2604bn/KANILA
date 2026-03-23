import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css'
})
export class ForgotPassword {
  step = 1;
  email = '';
  otp: string = '';
  newPass = '';
  confirmPass = '';
  
  emailNotFound = false;
  otpError: boolean = false;
   isMismatch = false;
   otpSuccess: boolean = false;



  constructor(private router: Router, private authService: AuthService) {}

  sendEmail() {
    if (!this.email) return;

    this.authService.checkEmail(this.email).subscribe({
      next: (res) => {
        if (res.exists) {
          this.step = 2; 
          this.emailNotFound = false;
        } else {
          this.emailNotFound = true; 
        }
      },
      error: (err) => {
        this.emailNotFound = true;
        console.error("Lỗi kết nối Server:", err);
      }
    });
  }

  onOtpChange() {
    if (this.otp.length < 6) {
      this.otpError = false;
      this.otpSuccess = false;
      return;
    }

    if (this.otp === '999999') {
      this.otpSuccess = true;
      this.otpError = false;
    } else {
      this.otpSuccess = false;
    }
  }

  verifyOtp() {
    if (this.otp === '999999') {
      this.step = 3;
      this.otpError = false;
    } else {
      this.otpError = true;
      this.otpSuccess = false;
    }
  }

  reload() { 
    window.location.reload();
  }

  onConfirmChange() {
    if (!this.confirmPass) {
      this.isMismatch = false; 
    } else {
      this.isMismatch = this.newPass !== this.confirmPass;
    }
  }

  submitReset() {
    if (this.newPass.length < 8) {
      alert("Mật khẩu yêu cầu tối thiểu 8 ký tự!");
      return;
    }
    if (this.isMismatch || !this.newPass || !this.confirmPass) return;

    this.authService.resetPassword(this.email, this.newPass).subscribe({
      next: (res) => {
        alert("Bạn đã đặt lại mật khẩu thành công");
        this.router.navigate(['/auth/login']); 
      },
      error: (err) => {
        alert("Có lỗi xảy ra trong quá trình đặt lại mật khẩu. Vui lòng thử lại!");
      }
    });
  }
}

