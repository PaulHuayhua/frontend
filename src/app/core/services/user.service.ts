import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../interfaces/user';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private http = inject(HttpClient);
  private apiUrl = `${environment.urlBackEnd}/v1/api/users`;

  getAll(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  findById(identifier: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${identifier}`);
  }

  findByState(state: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/state/${state}`);
  }

  save(user: User): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/save`, user);
  }

  update(user: User): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/update`, user);
  }

  deactivate(identifier: number): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/deactivate/${identifier}`, {});
  }

  restore(identifier: number): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/restore/${identifier}`, {});
  }

  findByName(name: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/name/${name}`);
  }
}