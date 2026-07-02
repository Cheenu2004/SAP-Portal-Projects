import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { DashboardResponse } from '../../core/models/api-models';
import { ToastService } from '../../shared/toast/toast.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, MatCardModule, MatIconModule, MatButtonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  dashboardData: DashboardResponse['d'] | null = null;
  doughnutChart: any;
  barChart: any;

  poFulfillmentRate = 0;
  invoiceRate = 0;
  paymentRate = 0;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    const vendorId = this.authService.getVendorId();
    if (vendorId) {
      this.apiService.getDashboard(vendorId).subscribe({
        next: (res) => {
        this.dashboardData = res.d;
        
        // Calculate fulfillment metrics safely
        if (this.dashboardData.WfTotalPo > 0) {
          this.poFulfillmentRate = Math.min(100, Math.round((this.dashboardData.WfTotalDelivery / this.dashboardData.WfTotalPo) * 100));
          this.invoiceRate = Math.min(100, Math.round((this.dashboardData.WfTotalInvoice / this.dashboardData.WfTotalPo) * 100));
        }

        const totalPay = this.dashboardData.WfTotalPayment;
        const pendingPay = parseFloat(this.dashboardData.WfPendingPayment) || 0;
        const sumPay = totalPay + pendingPay;
        if (sumPay > 0) {
          this.paymentRate = Math.round((totalPay / sumPay) * 100);
        }

        this.initCharts();
      },
        error: (err) => {
          this.toast.error('Failed to load dashboard data');
          console.error(err);
        }
      });
    }
  }

  refresh() {
    this.dashboardData = null;
    if (this.doughnutChart) this.doughnutChart.destroy();
    if (this.barChart) this.barChart.destroy();
    this.loadData();
  }

  initCharts() {
    if (!this.dashboardData) return;

    setTimeout(() => {
      // Doughnut Chart
      const ctx1 = document.getElementById('doughnutChart') as HTMLCanvasElement;
      if (ctx1) {
        this.doughnutChart = new Chart(ctx1, {
          type: 'doughnut',
          data: {
            labels: ['Purchase Orders', 'Total Deliveries', 'Invoices'],
            datasets: [{
              data: [
                this.dashboardData!.WfTotalPo,
                this.dashboardData!.WfTotalDelivery,
                this.dashboardData!.WfTotalInvoice
              ],
              backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'],
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'bottom' }
            },
            cutout: '70%'
          }
        });
      }

      // Bar Chart for Financials
      const ctx2 = document.getElementById('barChart') as HTMLCanvasElement;
      if (ctx2) {
        this.barChart = new Chart(ctx2, {
          type: 'bar',
          data: {
            labels: ['Total Payments', 'Pending Payment'],
            datasets: [{
              label: 'Amount (INR)',
              data: [
                this.dashboardData!.WfTotalPayment,
                parseFloat(this.dashboardData!.WfPendingPayment)
              ],
              backgroundColor: ['#3b82f6', '#e63946'],
              borderRadius: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false }
            },
            scales: {
              y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
              x: { grid: { display: false } }
            }
          }
        });
      }
    }, 100);
  }
}
