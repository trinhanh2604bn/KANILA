import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/auth/login']);
  }
  const type = authService.getAccountTypeFromToken();
  if (type === 'admin' || type === 'super_admin') return true;
  return router.createUrlTree(['/home']);
};
