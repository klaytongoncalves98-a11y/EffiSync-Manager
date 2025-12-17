
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
    Appointment,
    AppointmentStatus,
    Service,
    Expense,
    Client,
    Professional,
    Kpis,
    HistoricalDataPoint,
    TopServiceData,
    ClientProfile,
    RevenueByServiceData,
    Settings,
    Product
} from '../types';

// --- CONSTANTS & DEFAULTS ---

const SERVICES_CATALOG: Service[] = [
    { id: '1', name: 'Corte de Cabelo', price: 40, duration: 30 },
    { id: '2', name: 'Barba', price: 25, duration: 20 },
    { id: '3', name: 'Sobrancelha', price: 15, duration: 15 },
    { id: '4', name: 'Corte + Barba', price: 60, duration: 50 },
];

const PRODUCTS_CATALOG: Product[] = [
    { id: '1', name: 'Pomada Modeladora', price: 35, quantity: 15 },
    { id: '2', name: 'Óleo para Barba', price: 25, quantity: 10 },
];

const CLIENTS_CATALOG: Client[] = [
    { id: 1, name: 'João Silva', age: 30, phone: '11987654321' },
];

const PROFESSIONALS_CATALOG: Professional[] = [
    { id: '1', name: 'Barbeiro Principal', specialty: 'Sênior' },
];

const EFFISYNC_LOGO_SVG = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Crect width='512' height='512' rx='100' fill='%231f2937'/%3E%3Cpath d='M150 256c0-88.4 71.6-160 160-160h40v-40l110 75-110 75v-40h-40c-55.2 0-100 44.8-100 100h-60z' fill='%234ade80'/%3E%3Cpath d='M362 256c0 88.4-71.6 160-160 160h-40v40l-110-75 110-75v40h40c55.2 0 100-44.8 100-100h60z' fill='%2322d3ee'/%3E%3C/svg%3E";

const INITIAL_SETTINGS: Settings = {
    monthlyGoal: 5000,
    businessHours: { start: '09:00', end: '18:00' },
    shopName: 'Minha Barbearia',
    shopAddress: 'Endereço da Barbearia',
    shopLogoUrl: EFFISYNC_LOGO_SVG,
    workingDays: [1, 2, 3, 4, 5, 6],
    specialDays: [],
    dataRetention: { period: 0, autoBackup: false },
    theme: {
        backgroundColor: '#111827',
        cardColor: '#1f2937',
        sidebarColor: '#1f2937',
        textColor: '#e5e7eb',
        secondaryTextColor: '#9ca3af',
        accentColor: '#06b6d4',
        inputColor: '#374151',
    }
};

// Helper to load from local storage
const loadFromStorage = <T>(key: string, initialValue: T): T => {
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : initialValue;
    } catch (error) {
        return initialValue;
    }
};

export const useBarberData = (userIdentifier: string = '') => {
    // Prefix for multi-user storage
    const prefix = userIdentifier ? `local_${userIdentifier.replace(/[^a-zA-Z0-9]/g, '_')}` : 'guest';

    const [services, setServices] = useState<Service[]>(() => loadFromStorage(`${prefix}_services`, SERVICES_CATALOG));
    const [products, setProducts] = useState<Product[]>(() => loadFromStorage(`${prefix}_products`, PRODUCTS_CATALOG));
    const [appointments, setAppointments] = useState<Appointment[]>(() => loadFromStorage(`${prefix}_appointments`, []));
    const [expenses, setExpenses] = useState<Expense[]>(() => loadFromStorage(`${prefix}_expenses`, []));
    const [clients, setClients] = useState<Client[]>(() => loadFromStorage(`${prefix}_clients`, CLIENTS_CATALOG));
    const [professionals, setProfessionals] = useState<Professional[]>(() => loadFromStorage(`${prefix}_professionals`, PROFESSIONALS_CATALOG));
    const [settings, setSettings] = useState<Settings>(() => loadFromStorage(`${prefix}_settings`, INITIAL_SETTINGS));
    const [selectedMonth, setSelectedMonth] = useState(new Date());

    // Effect to reload data when the user switches
    useEffect(() => {
        setServices(loadFromStorage(`${prefix}_services`, SERVICES_CATALOG));
        setProducts(loadFromStorage(`${prefix}_products`, PRODUCTS_CATALOG));
        setAppointments(loadFromStorage(`${prefix}_appointments`, []));
        setExpenses(loadFromStorage(`${prefix}_expenses`, []));
        setClients(loadFromStorage(`${prefix}_clients`, CLIENTS_CATALOG));
        setProfessionals(loadFromStorage(`${prefix}_professionals`, PROFESSIONALS_CATALOG));
        setSettings(loadFromStorage(`${prefix}_settings`, INITIAL_SETTINGS));
    }, [prefix]);

    // Save data to storage on any change
    useEffect(() => {
        if (!prefix || prefix === 'guest') return;
        localStorage.setItem(`${prefix}_services`, JSON.stringify(services));
        localStorage.setItem(`${prefix}_products`, JSON.stringify(products));
        localStorage.setItem(`${prefix}_appointments`, JSON.stringify(appointments));
        localStorage.setItem(`${prefix}_expenses`, JSON.stringify(expenses));
        localStorage.setItem(`${prefix}_clients`, JSON.stringify(clients));
        localStorage.setItem(`${prefix}_professionals`, JSON.stringify(professionals));
        localStorage.setItem(`${prefix}_settings`, JSON.stringify(settings));
    }, [prefix, services, products, appointments, expenses, clients, professionals, settings]);

    // --- COMPUTED KPI LOGIC ---
    const isSameMonth = (d1: Date, d2: Date) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();

    const filteredAppointments = useMemo(() => appointments.filter(a => isSameMonth(new Date(a.date), selectedMonth)), [appointments, selectedMonth]);
    const filteredExpenses = useMemo(() => expenses.filter(e => isSameMonth(new Date(e.date), selectedMonth)), [expenses, selectedMonth]);

    const kpis = useMemo<Kpis>(() => {
        const completed = filteredAppointments.filter(a => a.status === AppointmentStatus.COMPLETED);
        const revenue = completed.reduce((sum, app) => sum + (app.finalPrice || 0), 0);
        const expenseTotal = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        return {
            totalRevenue: revenue,
            clientsServed: completed.length,
            averageTicket: completed.length > 0 ? revenue / completed.length : 0,
            totalExpenses: expenseTotal,
            netProfit: revenue - expenseTotal
        };
    }, [filteredAppointments, filteredExpenses]);

    const topServices = useMemo<TopServiceData[]>(() => {
        const counts: Record<string, number> = {};
        filteredAppointments.filter(a => a.status === AppointmentStatus.COMPLETED).forEach(a => {
            a.services.forEach(s => counts[s.name] = (counts[s.name] || 0) + 1);
        });
        return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count).slice(0, 3);
    }, [filteredAppointments]);

    const revenueByService = useMemo<RevenueByServiceData[]>(() => {
        const rev: Record<string, number> = {};
        filteredAppointments.filter(a => a.status === AppointmentStatus.COMPLETED).forEach(a => {
            a.services.forEach(s => rev[s.name] = (rev[s.name] || 0) + s.price);
        });
        return Object.entries(rev).map(([name, revenue]) => ({ name, revenue })).sort((a,b) => b.revenue - a.revenue);
    }, [filteredAppointments]);

    const historicalData = useMemo<HistoricalDataPoint[]>(() => {
        const data: HistoricalDataPoint[] = [];
        const today = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const mApps = appointments.filter(a => isSameMonth(new Date(a.date), d) && a.status === AppointmentStatus.COMPLETED);
            const mExps = expenses.filter(e => isSameMonth(new Date(e.date), d));
            data.push({
                month: d.toLocaleString('pt-BR', { month: 'short' }),
                revenue: mApps.reduce((sum, a) => sum + (a.finalPrice || 0), 0),
                clientsServed: mApps.length,
                expenses: mExps.reduce((sum, e) => sum + e.amount, 0)
            });
        }
        return data;
    }, [appointments, expenses]);

    const clientProfiles = useMemo<ClientProfile[]>(() => {
        return clients.map(c => {
            const apps = appointments.filter(a => a.clientName === c.name);
            const comp = apps.filter(a => a.status === AppointmentStatus.COMPLETED);
            const serviceCounts: Record<string, number> = {};
            comp.forEach(a => a.services.forEach(s => serviceCounts[s.name] = (serviceCounts[s.name] || 0) + 1));
            
            return {
                ...c,
                totalRevenue: comp.reduce((sum, a) => sum + (a.finalPrice || 0), 0),
                completedServices: Object.entries(serviceCounts).map(([serviceName, count]) => ({ serviceName, count })),
                canceledAppointments: apps.filter(a => a.status === AppointmentStatus.CANCELED).length
            };
        });
    }, [clients, appointments]);

    // --- ACTIONS ---
    const updateSettings = useCallback((s: Settings) => setSettings(s), []);
    const addService = (s: Omit<Service, 'id'>) => setServices(p => [...p, { ...s, id: Date.now().toString() }]);
    const updateService = (s: Service) => setServices(p => p.map(x => x.id === s.id ? s : x));
    const deleteService = (id: string) => setServices(p => p.filter(x => x.id !== id));
    
    const addAppointment = (a: Omit<Appointment, 'id' | 'status'>) => {
        setAppointments(p => [...p, { ...a, id: Date.now().toString(), status: AppointmentStatus.PENDING }]);
        return { created: 1, skipped: 0 };
    };

    const updateAppointmentStatus = (id: string, status: AppointmentStatus, price?: number) => {
        setAppointments(p => p.map(a => a.id === id ? { ...a, status, finalPrice: status === AppointmentStatus.COMPLETED ? price : undefined } : a));
    };

    const addClient = (c: Omit<Client, 'id'>) => setClients(p => [...p, { ...c, id: Date.now() }]);
    const deleteClient = (id: number) => setClients(p => p.filter(c => c.id !== id));
    
    const addExpense = (e: Omit<Expense, 'id'>) => setExpenses(p => [...p, { ...e, id: Date.now().toString() }]);
    const deleteExpense = (id: string) => setExpenses(p => p.filter(e => e.id !== id));

    const resetAllData = () => {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(prefix)) localStorage.removeItem(key);
        });
        window.location.reload();
    };

    return {
        services, products, appointments, expenses, clients, professionals, settings,
        filteredAppointments, filteredExpenses, kpis, topServices, revenueByService,
        clientProfiles, historicalData, selectedMonth, setSelectedMonth,
        actions: {
            updateSettings, addService, updateService, deleteService,
            addAppointment, updateAppointmentStatus, addClient, deleteClient,
            addExpense, deleteExpense, resetAllData,
            updateAppointment: (a: Appointment) => setAppointments(p => p.map(x => x.id === a.id ? a : x)),
            addProduct: (p: any) => setProducts(x => [...x, { ...p, id: Date.now().toString() }]),
            updateProduct: (p: any) => setProducts(x => x.map(y => y.id === p.id ? p : y)),
            deleteProduct: (id: string) => setProducts(x => x.filter(y => y.id !== id)),
            sellProduct: (id: string, clientName: string, quantity: number) => {
                setProducts(prev => prev.map(p => p.id === id ? { ...p, quantity: p.quantity - quantity } : p));
            },
            addProfessional: (p: any) => setProfessionals(x => [...x, { ...p, id: Date.now().toString() }]),
            updateProfessional: (p: any) => setProfessionals(x => x.map(y => y.id === p.id ? p : y)),
            deleteProfessional: (id: string) => setProfessionals(x => x.filter(y => y.id !== id)),
        }
    };
};
