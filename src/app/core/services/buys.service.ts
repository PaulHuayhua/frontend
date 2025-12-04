import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Buy } from '../interfaces/buy';

@Injectable({
  providedIn: 'root'
})
export class BuysService {

  private readonly baseUrl = `${environment.urlBackEnd}/v1/api/buy`;

  constructor(private http: HttpClient) {}

  findAll(): Observable<Buy[]> {
    return this.http.get<Buy[]>(`${this.baseUrl}`);
  }

  findById(identifier: number): Observable<Buy> {
    return this.http.get<Buy>(`${this.baseUrl}/${identifier}`);
  }

  findByStatus(status: string): Observable<Buy[]> {
    return this.http.get<Buy[]>(`${this.baseUrl}/status/${status}`);
  }

  save(buy: Buy): Observable<Buy> {
    return this.http.post<Buy>(`${this.baseUrl}/save`, buy);
  }

  update(buy: Buy): Observable<Buy> {
    return this.http.put<Buy>(`${this.baseUrl}/update`, buy);
  }

  softDelete(identifier: number): Observable<Buy> {
    return this.http.patch<Buy>(`${this.baseUrl}/delete/${identifier}`, {});
  }

  restore(identifier: number): Observable<Buy> {
    return this.http.patch<Buy>(`${this.baseUrl}/restore/${identifier}`, {});
  }

  reportPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/pdf/${id}`, {
      responseType: 'blob'
    });
  }

  getCount(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/count`);
  }
}