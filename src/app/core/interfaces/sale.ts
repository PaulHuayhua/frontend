export interface Sale {
  identifier?: number;
  code?: string;
  issueDate?: string;
  paymentMethod: string;
  total?: number;
  customerIdentifier: number;
  customerName?: string;
  userIdentifier: number;
  userName?: string;
  state?: string; // 'P' = Pendiente, 'F' = Finalizada, 'C' = Cancelada
  details: SaleDetail[];
}

export interface SaleDetail {
  identifier?: number;
  amount: number;
  subtotal?: number;
  productIdentifier: number;
  productName?: string;
  productPrice?: number;
}