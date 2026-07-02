import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    loadComponent: () => import('./layouts/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent)
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'inquiry',
        loadComponent: () => import('./pages/inquiry/inquiry.component').then(m => m.InquiryComponent)
      },
      {
        path: 'sales-orders',
        loadComponent: () => import('./pages/sales-orders/sales-orders.component').then(m => m.SalesOrdersComponent)
      },
      {
        path: 'delivery',
        loadComponent: () => import('./pages/delivery/delivery.component').then(m => m.DeliveryComponent)
      },
      {
        path: 'invoices',
        loadComponent: () => import('./pages/invoices/invoices.component').then(m => m.InvoicesComponent)
      },
      {
        path: 'payments',
        loadComponent: () => import('./pages/payments/payments.component').then(m => m.PaymentsComponent)
      },
      {
        path: 'memos',
        loadComponent: () => import('./pages/memos/memos.component').then(m => m.MemosComponent)
      },
      {
        path: 'sales-summary',
        loadComponent: () => import('./pages/sales-summary/sales-summary.component').then(m => m.SalesSummaryComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
