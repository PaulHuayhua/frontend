import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  let isLoggedIn = false;

  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    const token = localStorage.getItem('token');
    isLoggedIn = !!token;
  }
  
  if (isLoggedIn) {
    return true;
  } else {
    router.navigateByUrl('/auth/login');
    return false;
  }
};