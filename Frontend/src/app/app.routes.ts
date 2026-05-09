import { Routes } from '@angular/router';
import { adminAuthGuard } from './core/guards/admin-auth.guard';

export const routes: Routes = [
  {
    path: 'admin/login',
    loadComponent: () =>
      import('./features/admin/login/login.component').then(m => m.LoginComponent)
  },

  {
    path: 'admin/dashboard',
    canActivate: [adminAuthGuard],
    loadComponent: () =>
      import('./features/admin/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },

  {
    path: 'admin/create-qr',
    canActivate: [adminAuthGuard],
    loadComponent: () =>
      import('./features/admin/create-qr/create-qr.component').then(m => m.CreateQrComponent)
  },

  {
    path: 'admin/qr-list',
    canActivate: [adminAuthGuard],
    loadComponent: () =>
      import('./features/admin/qr-list/qr-list.component').then(m => m.QrListComponent)
  },

  {
    path: 'admin/qr/:id',
    canActivate: [adminAuthGuard],
    loadComponent: () =>
      import('./features/admin/qr-details/qr-details.component').then(m => m.QrDetailsComponent)
  },

  {
    path: 'admin/warranty-records',
    canActivate: [adminAuthGuard],
    loadComponent: () =>
      import('./features/admin/warranty-records/warranty-records.component').then(
        m => m.WarrantyRecords
      )
  },

  {
    path: 'admin/warranty/:qrId',
    canActivate: [adminAuthGuard],
    loadComponent: () =>
      import('./features/admin/warranty-detail/warranty-detail.component').then(
        m => m.WarrantyDetail
      )
  },

  /*
    New main public QR scan route.
    New generated QR links should open:
    /qr/:qrId
  */
  {
    path: 'qr/:qrId',
    loadComponent: () =>
      import('./features/public/activate/activate.component').then(m => m.ActivateComponent)
  },

  /*
    Old route kept for backward compatibility.
    If old QR stickers were generated with /activate/:qrId, they still work.
  */
  {
    path: 'activate/:qrId',
    loadComponent: () =>
      import('./features/public/activate/activate.component').then(m => m.ActivateComponent)
  },

  {
    path: 'warranty/:qrId',
    loadComponent: () =>
      import('./features/public/warranty/warranty.component').then(m => m.WarrantyComponent)
  },

  {
    path: 'warranty-success/:qrId',
    loadComponent: () =>
      import('./features/public/warranty-success/warranty-success.component').then(
        m => m.WarrantySuccessComponent
      )
  },

  {
    path: 'verify-otp/:qrId',
    loadComponent: () =>
      import('./features/public/verify-otp/verify-otp.component').then(m => m.VerifyOtpComponent)
  },

  {
    path: 'register/:qrId',
    loadComponent: () =>
      import('./features/public/register/register.component').then(m => m.RegisterComponent)
  },

  {
    path: 'emergency/:qrId',
    loadComponent: () =>
      import('./features/public/emergency/emergency.component').then(m => m.EmergencyComponent)
  },

  {
    path: 'blocked/:qrId',
    loadComponent: () =>
      import('./features/public/blocked/blocked.component').then(m => m.BlockedComponent)
  },

  {
    path: 'blocked',
    loadComponent: () =>
      import('./features/public/blocked/blocked.component').then(m => m.BlockedComponent)
  },

  {
    path: '',
    redirectTo: 'admin/login',
    pathMatch: 'full'
  },

  {
    path: '**',
    redirectTo: 'admin/login'
  }
];