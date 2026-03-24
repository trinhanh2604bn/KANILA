/**
 * Định nghĩa cấu trúc tài khoản dựa trên Account Model
 *
 */
export interface Account {
    _id?: string;
    accountType: 'customer' | 'admin' | 'staff';
    email: string;
    phone?: string;
    username?: string;
    accountStatus: 'active' | 'inactive' | 'locked';
    emailVerifiedAt?: Date | null;
    phoneVerifiedAt?: Date | null;
    lastLoginAt?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
  }

  export interface Customer {
    _id?: string;
    accountId: string | Account;
    customerCode: string;
    firstName?: string;
    lastName?: string;
    fullName: string;
    dateOfBirth?: Date | null;
    gender?: string;
    avatarUrl?: string;
    customerStatus: 'active' | 'inactive';
    registeredAt?: Date;
  }
  

  export interface RegisterRequest {
  fullName?: string;
  full_name?: string;
  firstName?: string;
  first_name?: string;
  lastName?: string;
  last_name?: string;
  phone?: string;
  email: string;
  password: string;
}
  

  export interface LoginRequest {
    email: string;
    password: string;
  }
  

  export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    account: Account & { account_type?: 'customer' | 'admin' | 'staff' };
    customer: Customer | null;
  };
}
  

  export interface ForgotPasswordRequest {
    email: string;
  }
  
  export interface ResetPasswordRequest {
    email: string;
    otpCode: string; 
    newPassword: string;
  }