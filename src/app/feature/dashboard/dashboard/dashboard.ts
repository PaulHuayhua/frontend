import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, LOCALE_ID } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import { Router } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { forkJoin } from 'rxjs';
import localeEs from '@angular/common/locales/es-PE';

// Services
import { SaleService } from '../../../core/services/sale.service';
import { ProductService } from '../../../core/services/product.service';
import { BuysService } from '../../../core/services/buys.service';
import { CustomerService } from '../../../core/services/customer';
import { SupplierService } from '../../../core/services/supplier.service';
import { Auth } from '../../../core/services/auth';

// Interfaces
import { Sale } from '../../../core/interfaces/sale';
import { Product } from '../../../core/interfaces/product';
import { Buy } from '../../../core/interfaces/buy';
import { Supplier } from '../../../core/interfaces/supplier';
import { Customer } from '../../../core/interfaces/customer';

// Pipes
import { PenCurrencyPipe } from '../../../core/pipes/pen-currency.pipe';
import { FriendlyDatePipe } from '../../../core/pipes/friendly-date.pipe';

// Directives
import { HasRoleDirective } from '../../../core/directives/has-role';

registerLocaleData(localeEs);
Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    PenCurrencyPipe,
    FriendlyDatePipe,
    HasRoleDirective
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'es-PE' }
  ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('salesChart') salesChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('productsChart') productsChartRef!: ElementRef<HTMLCanvasElement>;

  // Usuario y rol
  userRole: string | null = null;
  isAdmin: boolean = false;

  // Estadísticas generales
  totalSales: number = 0;
  totalProducts: number = 0;
  totalBuys: number = 0;
  totalBuysAmount: number = 0;
  salesGrowth: number = 0;

  // Datos calculados
  averageSale: number = 0;
  averageBuy: number = 0;
  totalStockValue: number = 0;
  topProductsTotal: number = 0;

  // Datos recientes
  recentSales: Sale[] = [];
  recentBuys: Buy[] = [];
  lowStockProducts: Product[] = [];
  topSuppliers: Supplier[] = [];
  
  // Data para lookup
  private suppliersMap: Map<number, Supplier> = new Map();
  private productsMap: Map<number, Product> = new Map();
  private allProducts: Product[] = [];

  // Fecha actual
  currentDate: Date = new Date();

  // Charts
  private salesChart?: Chart;
  private productsChart?: Chart;

  constructor(
    private router: Router,
    private saleService: SaleService,
    private productService: ProductService,
    private buysService: BuysService,
    private customerService: CustomerService,
    private supplierService: SupplierService,
    private authService: Auth
  ) {}

  ngOnInit(): void {
    // Obtener rol del usuario
    this.userRole = this.authService.getUserRole();
    this.isAdmin = this.userRole === 'Administrador';
    
    console.log('👤 Usuario logueado:', { rol: this.userRole, esAdmin: this.isAdmin });
    
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    // Usar un intervalo para verificar cuando los gráficos estén disponibles
    let attempts = 0;
    const maxAttempts = 10;
    
    const checkChartsInterval = setInterval(() => {
      attempts++;
      console.log(`🔍 Intento ${attempts}/${maxAttempts} - Buscando gráficos...`);
      
      if (this.salesChartRef && this.productsChartRef) {
        console.log('✅ Gráficos encontrados! Inicializando...');
        clearInterval(checkChartsInterval);
        this.initCharts();
      } else if (attempts >= maxAttempts) {
        console.error('❌ No se pudieron encontrar los gráficos después de', maxAttempts, 'intentos');
        clearInterval(checkChartsInterval);
      }
    }, 500);
  }

  /**
   * Carga todos los datos del dashboard según el rol
   */
  private loadDashboardData(): void {
    if (this.isAdmin) {
      // Admin: cargar todo
      forkJoin({
        sales: this.saleService.findAll(),
        products: this.productService.findAll(),
        customers: this.customerService.findAll(),
        buys: this.buysService.findAll(),
        suppliers: this.supplierService.findAll()
      }).subscribe({
        next: (data) => {
          console.log('📊 Datos cargados (Admin):', {
            ventas: data.sales.length,
            productos: data.products.length,
            clientes: data.customers.length,
            compras: data.buys.length,
            proveedores: data.suppliers.length
          });

          // Guardar datos para lookup
          this.allProducts = data.products;
          data.products.forEach(p => this.productsMap.set(p.identifier!, p));
          data.suppliers.forEach(s => this.suppliersMap.set(s.identifier, s));

          // Procesar datos
          this.processSalesData(data.sales);
          this.processProductsData(data.products);
          this.processBuysData(data.buys);
          this.processSuppliersData(data.suppliers);
          
          // Actualizar gráficos
          setTimeout(() => {
            this.updateCharts(data.sales, data.buys, data.products);
          }, 200);
        },
        error: (error) => {
          console.error('❌ Error al cargar datos del dashboard:', error);
        }
      });
    } else {
      // Empleado: solo ventas, productos y clientes
      forkJoin({
        sales: this.saleService.findAll(),
        products: this.productService.findAll(),
        customers: this.customerService.findAll()
      }).subscribe({
        next: (data) => {
          console.log('📊 Datos cargados (Empleado):', {
            ventas: data.sales.length,
            productos: data.products.length,
            clientes: data.customers.length
          });

          // Guardar datos para lookup
          this.allProducts = data.products;
          data.products.forEach(p => this.productsMap.set(p.identifier!, p));

          // Procesar datos
          this.processSalesData(data.sales);
          this.processProductsData(data.products);
          
          // Actualizar gráficos (sin compras)
          setTimeout(() => {
            this.updateCharts(data.sales, [], data.products);
          }, 200);
        },
        error: (error) => {
          console.error('❌ Error al cargar datos del dashboard:', error);
        }
      });
    }
  }

  /**
   * Procesa datos de ventas
   */
  private processSalesData(sales: Sale[]): void {
    const activeSales = sales.filter(s => s.state !== 'C');
    
    this.totalSales = activeSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
    this.averageSale = activeSales.length > 0 ? this.totalSales / activeSales.length : 0;

    // Calcular crecimiento
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const currentMonthSales = activeSales
      .filter(s => {
        const date = new Date(s.issueDate || '');
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((sum, s) => sum + (s.total || 0), 0);

    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    const previousMonthSales = activeSales
      .filter(s => {
        const date = new Date(s.issueDate || '');
        return date.getMonth() === previousMonth && date.getFullYear() === previousYear;
      })
      .reduce((sum, s) => sum + (s.total || 0), 0);

    this.salesGrowth = previousMonthSales > 0 
      ? ((currentMonthSales - previousMonthSales) / previousMonthSales) * 100 
      : (currentMonthSales > 0 ? 100 : 0);

    // Últimas 5 ventas
    this.recentSales = activeSales
      .sort((a, b) => new Date(b.issueDate || '').getTime() - new Date(a.issueDate || '').getTime())
      .slice(0, 5);
  }

  /**
   * Procesa datos de productos
   */
  private processProductsData(products: Product[]): void {
    const activeProducts = products.filter(p => p.state === 'A');
    this.totalProducts = activeProducts.length;
    this.totalStockValue = activeProducts.reduce((sum, p) => sum + (p.stock * p.price), 0);

    this.lowStockProducts = activeProducts
      .filter(p => p.stock < 10)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 5);
  }

  /**
   * Procesa datos de compras (solo Admin)
   */
  private processBuysData(buys: Buy[]): void {
    console.log('🛒 Procesando compras:', buys.length, 'total');
    
    const activeBuys = buys.filter(b => b.status !== 'C');
    console.log('🛒 Compras activas:', activeBuys.length);
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthBuys = activeBuys.filter(buy => {
      const buyDate = new Date(buy.buysDate || '');
      return buyDate.getMonth() === currentMonth && buyDate.getFullYear() === currentYear;
    });

    console.log('🛒 Compras del mes actual:', monthBuys.length);

    this.totalBuys = monthBuys.length;
    this.totalBuysAmount = monthBuys.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    this.averageBuy = activeBuys.length > 0 
      ? activeBuys.reduce((sum, b) => sum + (b.totalPrice || 0), 0) / activeBuys.length 
      : 0;

    this.recentBuys = activeBuys
      .sort((a, b) => new Date(b.buysDate || '').getTime() - new Date(a.buysDate || '').getTime())
      .slice(0, 5);
      
    console.log('🛒 Últimas compras:', this.recentBuys.length);
  }

  /**
   * Procesa datos de proveedores (solo Admin)
   */
  private processSuppliersData(suppliers: Supplier[]): void {
    console.log('🏢 Procesando proveedores:', suppliers.length, 'total');
    const activeSuppliers = suppliers.filter(s => s.state === 'A');
    console.log('🏢 Proveedores activos:', activeSuppliers.length);
    this.topSuppliers = activeSuppliers.slice(0, 4);
  }

  /**
   * Obtiene el nombre del proveedor por ID
   */
  getSupplierName(supplierId: number): string {
    const supplier = this.suppliersMap.get(supplierId);
    return supplier?.company || 'Proveedor';
  }

  /**
   * Inicializa los gráficos
   */
  private initCharts(): void {
    console.log('✅ Inicializando gráficos...');
    this.createSalesAndBuysChart();
    this.createProductsChart();
  }

  /**
   * Crea el gráfico combinado de ventas y compras
   */
  private createSalesAndBuysChart(): void {
    if (!this.salesChartRef) return;

    const ctx = this.salesChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    // Dataset de ventas (siempre visible)
    const datasets: any[] = [
      {
        label: 'Ventas (S/)',
        data: [0, 0, 0, 0, 0, 0],
        borderColor: '#6d2423',
        backgroundColor: 'rgba(109, 36, 35, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#EAD585',
        pointBorderColor: '#6d2423',
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2
      }
    ];

    // Dataset de compras (solo para Admin)
    if (this.isAdmin) {
      datasets.push({
        label: 'Compras (S/)',
        data: [0, 0, 0, 0, 0, 0],
        borderColor: '#EAD585',
        backgroundColor: 'rgba(234, 213, 133, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#6d2423',
        pointBorderColor: '#EAD585',
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2
      });
    }

    this.salesChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.getLastSixMonthsLabels(),
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: '#333',
              font: { size: 11, weight: 'bold' },
              padding: 10,
              usePointStyle: true
            }
          },
          tooltip: {
            backgroundColor: '#6d2423',
            titleColor: '#EAD585',
            bodyColor: '#fff',
            borderColor: '#EAD585',
            borderWidth: 1,
            padding: 8,
            displayColors: true
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: '#666',
              font: { size: 10 },
              callback: function(value) {
                return 'S/ ' + value.toLocaleString('es-PE');
              }
            },
            grid: { color: 'rgba(0, 0, 0, 0.05)' }
          },
          x: {
            ticks: { color: '#666', font: { size: 10 } },
            grid: { display: false }
          }
        }
      }
    });
  }

  /**
   * Crea el gráfico de productos con nombres reales
   */
  private createProductsChart(): void {
    if (!this.productsChartRef) return;

    const ctx = this.productsChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.productsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Producto 1', 'Producto 2', 'Producto 3', 'Producto 4', 'Producto 5'],
        datasets: [{
          label: 'Unidades Vendidas',
          data: [0, 0, 0, 0, 0],
          backgroundColor: [
            'rgba(109, 36, 35, 0.8)',
            'rgba(234, 213, 133, 0.8)',
            'rgba(109, 36, 35, 0.6)',
            'rgba(234, 213, 133, 0.6)',
            'rgba(109, 36, 35, 0.4)'
          ],
          borderColor: [
            '#6d2423',
            '#EAD585',
            '#6d2423',
            '#EAD585',
            '#6d2423'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#6d2423',
            titleColor: '#EAD585',
            bodyColor: '#fff',
            borderColor: '#EAD585',
            borderWidth: 1,
            padding: 8
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: '#666', font: { size: 10 }, stepSize: 1 },
            grid: { color: 'rgba(0, 0, 0, 0.05)' }
          },
          x: {
            ticks: { color: '#666', font: { size: 10 } },
            grid: { display: false }
          }
        }
      }
    });
  }

  /**
   * Obtiene las etiquetas de los últimos 6 meses
   */
  private getLastSixMonthsLabels(): string[] {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const labels: string[] = [];
    const currentDate = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      labels.push(months[date.getMonth()]);
    }
    
    return labels;
  }

  /**
   * Actualiza los gráficos con datos reales
   */
  private updateCharts(sales: Sale[], buys: Buy[], products: Product[]): void {
    console.log('📈 Actualizando gráficos...');
    
    // Actualizar gráfico de ventas y compras
    if (this.salesChart) {
      const monthlySales = this.calculateMonthlySales(sales);
      console.log('📈 Ventas mensuales:', monthlySales);
      
      this.salesChart.data.datasets[0].data = monthlySales;

      // Solo actualizar compras si es Admin
      if (this.isAdmin && buys.length > 0) {
        const monthlyBuys = this.calculateMonthlyBuys(buys);
        console.log('📈 Compras mensuales:', monthlyBuys);
        
        if (this.salesChart.data.datasets[1]) {
          this.salesChart.data.datasets[1].data = monthlyBuys;
        }
      }

      this.salesChart.update();
      console.log('✅ Gráfico de ventas/compras actualizado');
    } else {
      console.warn('⚠️ salesChart no está disponible');
    }

    // Actualizar gráfico de productos con nombres reales
    if (this.productsChart) {
      const topProducts = this.calculateTopProductsWithNames(sales);
      this.topProductsTotal = topProducts.data.reduce((a, b) => a + b, 0);
      console.log('📊 Top productos:', topProducts);

      this.productsChart.data.labels = topProducts.labels;
      this.productsChart.data.datasets[0].data = topProducts.data;
      this.productsChart.update();
      console.log('✅ Gráfico de productos actualizado');
    } else {
      console.warn('⚠️ productsChart no está disponible');
    }
  }

  /**
   * Calcula ventas mensuales de los últimos 6 meses
   */
  private calculateMonthlySales(sales: Sale[]): number[] {
    const monthlySales = new Array(6).fill(0);
    const currentDate = new Date();

    sales.forEach(sale => {
      if (sale.state === 'C') return;
      
      const saleDate = new Date(sale.issueDate || '');
      
      for (let i = 0; i < 6; i++) {
        const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        
        if (saleDate.getMonth() === targetDate.getMonth() && 
            saleDate.getFullYear() === targetDate.getFullYear()) {
          monthlySales[5 - i] += sale.total || 0;
          break;
        }
      }
    });

    return monthlySales;
  }

  /**
   * Calcula compras mensuales de los últimos 6 meses
   */
  private calculateMonthlyBuys(buys: Buy[]): number[] {
    const monthlyBuys = new Array(6).fill(0);
    const currentDate = new Date();

    buys.forEach(buy => {
      if (buy.status === 'C') return;
      
      const buyDate = new Date(buy.buysDate || '');
      
      for (let i = 0; i < 6; i++) {
        const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        
        if (buyDate.getMonth() === targetDate.getMonth() && 
            buyDate.getFullYear() === targetDate.getFullYear()) {
          monthlyBuys[5 - i] += buy.totalPrice || 0;
          break;
        }
      }
    });

    return monthlyBuys;
  }

  /**
   * Calcula productos más vendidos con nombres reales
   */
  private calculateTopProductsWithNames(sales: Sale[]): { labels: string[], data: number[] } {
    const productSales = new Map<number, { name: string, amount: number }>();

    sales.forEach(sale => {
      if (sale.state === 'C') return;
      
      sale.details?.forEach(detail => {
        const productId = detail.productIdentifier;
        const product = this.productsMap.get(productId);
        const productName = product?.name || detail.productName || `Producto ${productId}`;
        
        const current = productSales.get(productId) || { name: productName, amount: 0 };
        current.amount += detail.amount;
        productSales.set(productId, current);
      });
    });

    const sortedProducts = Array.from(productSales.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    if (sortedProducts.length === 0) {
      return { labels: ['Sin datos'], data: [0] };
    }

    return {
      labels: sortedProducts.map(p => p.name),
      data: sortedProducts.map(p => p.amount)
    };
  }

  /**
   * Navega a una ruta específica
   */
  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}