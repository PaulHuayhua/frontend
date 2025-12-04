import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Sale } from '../interfaces/sale';

@Injectable({
  providedIn: 'root'
})
export class SaleService {

  private readonly baseUrl = `${environment.urlBackEnd}/v1/api/sale`;

  constructor(private http: HttpClient) {}

  findAll(): Observable<Sale[]> {
    return this.http.get<Sale[]>(`${this.baseUrl}`);
  }

  findById(identifier: number): Observable<Sale> {
    return this.http.get<Sale>(`${this.baseUrl}/${identifier}`);
  }

  save(sale: Sale): Observable<Sale> {
    return this.http.post<Sale>(`${this.baseUrl}/save`, sale);
  }

  update(sale: Sale): Observable<Sale> {
    return this.http.put<Sale>(`${this.baseUrl}/update`, sale);
  }

  delete(identifier: number): Observable<string> {
    return this.http.patch(`${this.baseUrl}/delete/${identifier}`, {}, { responseType: 'text' });
  }

  restore(identifier: number): Observable<string> {
    return this.http.patch(`${this.baseUrl}/restore/${identifier}`, {}, { responseType: 'text' });
  }

  complete(identifier: number): Observable<string> {
    return this.http.patch(`${this.baseUrl}/complete/${identifier}`, {}, { responseType: 'text' });
  }

  getTotalSales(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/total`);
  }

  getSalesPdfByCustomer(customerId: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/pdf/${customerId}`, {
      responseType: 'blob'
    });
  }
}