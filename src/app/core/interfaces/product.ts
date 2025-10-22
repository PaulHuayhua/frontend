export interface Product {
    identifier?: number;
    code?: string;
    name: string;
    description: string;
    volumeWeight?: number;
    unitMeasure?: string;
    stock: number;
    price: number;
    expirationDate?: Date;
    category: string;
    registrationDate?: Date;
    state?: string;
}
