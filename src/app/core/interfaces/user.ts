export interface User {
  identifier: number;
  code: string;
  name: string;
  email: string;
  cell_phone?: string;
  role: 'Administrador' | 'Empleado';
  registrationDate: string;
  lastAccess?: string;
  state: 'A' | 'I';
}