
export enum AppointmentStatus {
    PENDING = 'PENDING',
    COMPLETED = 'COMPLETED',
    CANCELED = 'CANCELED',
}

export interface Service {
    id: string;
    name: string;
    price: number;
    duration: number; // in minutes
    notes?: string;
}

export interface Product {
    id: string;
    name: string;
    price: number;
    quantity: number;
}

export interface Appointment {
    id: string;
    clientName: string;
    date: string; // ISO string
    services: Service[];
    status: AppointmentStatus;
    finalPrice?: number;
    notes?: string;
    professionalId?: string;
}

export interface Professional {
    id: string;
    name: string;
    specialty: string;
    imageUrl?: string;
}

export interface Client {
    id: number;
    name: string;
    age: number;
    phone: string;
}

export interface Kpis {
    totalRevenue: number;
    clientsServed: number;
    averageTicket: number;
    totalExpenses: number;
    netProfit: number;
}

export interface Expense {
    id: string;
    description: string;
    category: 'Aluguel' | 'Contas' | 'Suprimentos' | 'Marketing' | 'Imposto' | 'Salário' | 'Outros';
    amount: number;
    date: string; // ISO string
}

export interface HistoricalDataPoint {
    month: string;
    revenue: number;
    clientsServed: number;
    expenses: number;
}

export interface TopServiceData {
    name: string;
    count: number;
}

export interface RevenueByServiceData {
    name: string;
    revenue: number;
}

export interface ClientProfile extends Client {
    totalRevenue: number;
    completedServices: { serviceName: string; count: number }[];
    canceledAppointments: number;
}

export interface SpecialDay {
    date: string; // "YYYY-MM-DD"
    isClosed: boolean;
    hours?: {
        start: string; // "HH:mm"
        end: string;   // "HH:mm"
    };
}

export interface ThemeSettings {
    backgroundColor: string;
    cardColor: string;
    sidebarColor: string;
    textColor: string;
    secondaryTextColor: string;
    accentColor: string;
    inputColor: string;
}

export interface Settings {
    monthlyGoal: number;
    businessHours: {
        start: string; // "HH:mm"
        end: string;   // "HH:mm"
    };
    shopName: string;
    shopAddress: string;
    shopLogoUrl?: string;
    workingDays: number[]; // 0 for Sunday, 1 for Monday, etc.
    specialDays: SpecialDay[];
    dataRetention: {
        period: number; // months, 0 for indefinite
        autoBackup: boolean;
    };
    theme?: ThemeSettings;
}
