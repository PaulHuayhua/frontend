export interface User {
  identifier: number;
  name: string;
  email: string;
  rol: 'Administrador' | 'Empleado';
  registration_date: string;
  state: 'A' | 'I';
}

export interface LoginRequest {
  name: string;        // antes era 'email'
  password: string;
}

export interface LoginResponse {
  token: string;
  rol: 'Administrador' | 'Empleado';
  name: string;
}
