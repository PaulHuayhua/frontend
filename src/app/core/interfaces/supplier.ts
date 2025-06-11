export interface Supplier {
  identifier?: number;           
  name: string;                  
  company: string;
  supply_type: string;
  address: string;
  email_business: string;        
  cellular: string;              
  ruc: string;                   
  state: 'A' | 'I';              
}