export interface Customer {
  identifier?: number;
  code?: string;
  firstName: string;
  lastName: string;
  documentType: 'DNI' | 'CE' | 'RUC';
  documentNumber: string;
  cellphone: string;
  email: string;
  birthDate: string; 
  gender: 'M' | 'F';
  registrationDate?: string;
  state?: 'A' | 'I';
}
