import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'profile', loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent) },
      { path: 'rfqs', loadComponent: () => import('./pages/rfqs/rfqs.component').then(m => m.RfqsComponent) },
      { path: 'purchase-orders', loadComponent: () => import('./pages/purchase-orders/purchase-orders.component').then(m => m.PurchaseOrdersComponent) },
      { path: 'deliveries', loadComponent: () => import('./pages/deliveries/deliveries.component').then(m => m.DeliveriesComponent) },
      { path: 'invoices', loadComponent: () => import('./pages/invoices/invoices.component').then(m => m.InvoicesComponent) },
      { path: 'invoices/:id/:year', loadComponent: () => import('./pages/invoices/invoice-detail/invoice-detail.component').then(m => m.InvoiceDetailComponent) },
      { path: 'payments', loadComponent: () => import('./pages/payments/payments.component').then(m => m.PaymentsComponent) },
      { path: 'memos', loadComponent: () => import('./pages/memos/memos.component').then(m => m.MemosComponent) }
    ]
  },
  { path: '**', redirectTo: 'dashboard' }
];
