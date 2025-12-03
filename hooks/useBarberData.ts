
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
import { RecurrenceSettings } from '../components/Schedule';


// --- MOCK DATA GENERATION ---

const SERVICES_CATALOG: Service[] = [
    { id: '1', name: 'Corte de Cabelo', price: 40, duration: 30, notes: 'Estilo moderno, inclui lavagem e finalização.' },
    { id: '2', name: 'Barba', price: 25, duration: 20, notes: 'Desenho da barba com toalha quente e navalha.' },
    { id: '3', name: 'Sobrancelha', price: 15, duration: 15, notes: 'Design de sobrancelha na pinça ou cera.' },
    { id: '4', name: 'Corte + Barba', price: 60, duration: 50 },
];

const PRODUCTS_CATALOG: Product[] = [
    { id: '1', name: 'Pomada Modeladora', price: 35, quantity: 15 },
    { id: '2', name: 'Óleo para Barba', price: 25, quantity: 10 },
    { id: '3', name: 'Shampoo 2 em 1', price: 30, quantity: 8 },
    { id: '4', name: 'Gel Fixador', price: 20, quantity: 20 },
];

const CLIENTS_CATALOG: Client[] = [
    { id: 1, name: 'João Silva', age: 30, phone: '11987654321' },
    { id: 2, name: 'Carlos Pereira', age: 45, phone: '21912345678' },
    { id: 3, name: 'Lucas Martins', age: 22, phone: '31999998888' },
    { id: 4, name: 'Pedro Alves', age: 35, phone: '41988776655' },
    { id: 5, name: 'Marcos Rocha', age: 28, phone: '51977665544' },
];

const PROFESSIONALS_CATALOG: Professional[] = [
    { id: '1', name: 'Roberto Carlos', specialty: 'Barbeiro Sênior', imageUrl: 'https://i.pravatar.cc/150?u=roberto' },
    { id: '2', name: 'Fernando Lima', specialty: 'Barbeiro Júnior', imageUrl: 'https://i.pravatar.cc/150?u=fernando' },
    { id: '3', name: 'Ana Souza', specialty: 'Esteticista', imageUrl: 'https://i.pravatar.cc/150?u=ana' },
];

// Clean, robust SVG Data URI for EffiSync Logo - "S" Shape (Sync)
// Dark background rounded square with Green->Cyan Gradient Arrows forming an S
const EFFISYNC_LOGO_SVG = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Cdefs%3E%3ClinearGradient id='g1' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%234ade80'/%3E%3Cstop offset='100%25' stop-color='%2316a34a'/%3E%3C/linearGradient%3E%3ClinearGradient id='g2' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%2322d3ee'/%3E%3Cstop offset='100%25' stop-color='%230891b2'/%3E%3C/linearGradient%3E%3Cfilter id='d' x='0' y='0' width='512' height='512'%3E%3CfeDropShadow dx='0' dy='4' stdDeviation='8' flood-opacity='0.3'/%3E%3C/filter%3E%3C/defs%3E%3Crect width='512' height='512' rx='100' fill='%231f2937'/%3E%3Cpath d='M150 256c0-88.4 71.6-160 160-160h40v-40l110 75-110 75v-40h-40c-55.2 0-100 44.8-100 100h-60z' fill='url(%23g1)' filter='url(%23d)'/%3E%3Cpath d='M362 256c0 88.4-71.6 160-160 160h-40v40l-110-75 110-75v40h40c55.2 0 100-44.8 100-100h60z' fill='url(%23g2)' filter='url(%23d)'/%3E%3C/svg%3E";

const INITIAL_SETTINGS: Settings = {
    monthlyGoal: 8000,
    businessHours: { start: '09:00', end: '18:00' },
    shopName: 'EffiSync Manager',
    shopAddress: '123 Rua Principal, Cidade, Estado',
    shopLogoUrl: EFFISYNC_LOGO_SVG,
    workingDays: [1, 2, 3, 4, 5, 6], // Monday to Saturday
    specialDays: [],
    dataRetention: { period: 0, autoBackup: false },
    theme: {
        backgroundColor: '#111827', // gray-900
        cardColor: '#1f2937', // gray-800
        sidebarColor: '#1f2937', // gray-800
        textColor: '#e5e7eb', // gray-200
        secondaryTextColor: '#9ca3af', // gray-400
        accentColor: '#06b6d4', // cyan-500 (EffiSync Brand Color)
        inputColor: '#374151', // gray-700
    }
};

const generateMonthlyData = () => {
    let appointments: Appointment[] = [];
    let expenses: Expense[] = [];
    const today = new Date();

    for (let i = 11; i >= 0; i--) {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const year = date.getFullYear();
        const month = date.getMonth();

        // Generate Expenses for the month
        expenses.push(
            { id: `rent-${i}`, description: 'Aluguel do Salão', category: 'Aluguel', amount: 1500 + Math.random() * 100, date: new Date(year, month, 1).toISOString() },
            { id: `bills-${i}`, description: 'Contas (Luz, Água)', category: 'Contas', amount: 250 + Math.random() * 50, date: new Date(year, month, 5).toISOString() },
            { id: `supplies-${i}`, description: 'Suprimentos (Shampoo, Cera)', category: 'Suprimentos', amount: 300 + Math.random() * 150, date: new Date(year, month, 10).toISOString() },
            { id: `salary-${i}`, description: 'Salário Funcionários', category: 'Salário', amount: 2500, date: new Date(year, month, 28).toISOString() }
        );

        // Generate Appointments for the month
        const appointmentsInMonth = 50 + Math.floor(Math.random() * 20); // 50-70 appointments/month
        for (let j = 0; j < appointmentsInMonth; j++) {
            const day = Math.floor(Math.random() * 28) + 1;
            const hour = 9 + Math.floor(Math.random() * 9); // 9am to 5pm
            const appointmentDate = new Date(year, month, day, hour);
            const client = CLIENTS_CATALOG[Math.floor(Math.random() * CLIENTS_CATALOG.length)];
            
            // Bias towards single services but allow combos
            const serviceIndex = Math.random() < 0.2 ? 3 : Math.floor(Math.random() * 3);
            const service = SERVICES_CATALOG[serviceIndex];
            
            const isPast = appointmentDate < today;
            const status = isPast 
                ? (Math.random() > 0.1 ? AppointmentStatus.COMPLETED : AppointmentStatus.CANCELED) // 10% cancellation rate
                : AppointmentStatus.PENDING;
            
            appointments.push({
                id: `app-${i}-${j}`,
                clientName: client.name,
                date: appointmentDate.toISOString(),
                services: [service],
                status: status,
                finalPrice: status === AppointmentStatus.COMPLETED ? service.price : undefined,
                professionalId: PROFESSIONALS_CATALOG[Math.floor(Math.random() * PROFESSIONALS_CATALOG.length)].id
            });
        }
    }
    // Add a couple of appointments for the current day for demonstration
    appointments.push({ id: 'today-1', clientName: 'Lucas Martins', date: new Date().toISOString(), services: [SERVICES_CATALOG[3]], status: AppointmentStatus.PENDING, notes: 'Cliente pediu para aparar um pouco mais nas laterais.', professionalId: '1' });

    return { appointments, expenses };
};

// Helper to load from local storage
const loadFromStorage = <T>(key: string, initialValue: T): T => {
    try {
        const item = window.localStorage.getItem(key);
        return item ? JSON.parse(item) : initialValue;
    } catch (error) {
        console.error(`Error loading ${key} from localStorage`, error);
        return initialValue;
    }
};

// Custom Hook to manage persistent state
function usePersistentState<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    // We initialize state lazy-ly. However, if the key changes (user switch), we need to update the state.
    // The initial useState call only runs on mount.
    const [state, setState] = useState<T>(() => loadFromStorage(key, initialValue));

    // Effect to reload data when key changes (e.g. user login/logout)
    useEffect(() => {
        setState(loadFromStorage(key, initialValue));
    }, [key]); // Depend on key to reload

    useEffect(() => {
        try {
            window.localStorage.setItem(key, JSON.stringify(state));
        } catch (error) {
            console.error(`Error saving ${key} to localStorage`, error);
        }
    }, [key, state]);

    return [state, setState];
}

export const useBarberData = (currentUserEmail: string = '') => {
    
    // Create a prefix based on the user email (sanitized) to isolate data
    // If no email (guest/legacy), use 'effisync' default prefix
    const safeEmail = currentUserEmail ? currentUserEmail.replace(/[^a-zA-Z0-9]/g, '_') : '';
    const prefix = safeEmail ? `user_${safeEmail}` : 'effisync';

    // Determine initial data: try localStorage first, otherwise generate mock data
    const initialData = useMemo(() => {
        const hasData = window.localStorage.getItem(`${prefix}_appointments`);
        if (hasData) {
            return { appointments: [], expenses: [] }; // Will be loaded by usePersistentState
        }
        return generateMonthlyData();
    }, [prefix]);

    // Use Persistent State Hook for Catalogs and Data with Dynamic Keys
    const [services, setServices] = usePersistentState<Service[]>(`${prefix}_services`, SERVICES_CATALOG);
    const [products, setProducts] = usePersistentState<Product[]>(`${prefix}_products`, PRODUCTS_CATALOG);
    const [appointments, setAppointments] = usePersistentState<Appointment[]>(`${prefix}_appointments`, initialData.appointments.length ? initialData.appointments : []);
    const [expenses, setExpenses] = usePersistentState<Expense[]>(`${prefix}_expenses`, initialData.expenses.length ? initialData.expenses : []);
    const [clients, setClients] = usePersistentState<Client[]>(`${prefix}_clients`, CLIENTS_CATALOG);
    const [professionals, setProfessionals] = usePersistentState<Professional[]>(`${prefix}_professionals`, PROFESSIONALS_CATALOG);
    
    // Settings has custom initialization logic
    const [settings, setSettings] = useState<Settings>(INITIAL_SETTINGS);

    // Load Settings Effect with Auto-Repair and Prefix
    useEffect(() => {
        const settingsKey = `${prefix}_settings`;
        const loaded = loadFromStorage(settingsKey, INITIAL_SETTINGS);
        
        // AUTO-REPAIR LOGIC for LOGO:
        // FIX: Removed the check for 'isDefaultName' to prevent overriding user-uploaded logos.
        // We only reset if the logo is completely missing or is the old broken base64 format.
        const isMissingLogo = !loaded.shopLogoUrl;
        const isOldBase64 = loaded.shopLogoUrl && loaded.shopLogoUrl.includes('base64') && !loaded.shopLogoUrl.includes('svg+xml');

        const shouldForceUpdate = isMissingLogo || isOldBase64;

        let finalSettings = loaded;

        if (shouldForceUpdate) {
            finalSettings = {
                ...loaded,
                shopLogoUrl: EFFISYNC_LOGO_SVG,
                theme: loaded.theme || INITIAL_SETTINGS.theme
            };
        }

        if (!finalSettings.theme) {
            finalSettings = { ...finalSettings, theme: INITIAL_SETTINGS.theme };
        }
        if (!finalSettings.theme?.sidebarColor) {
             finalSettings = { ...finalSettings, theme: { ...INITIAL_SETTINGS.theme, ...finalSettings.theme! } };
        }
        setSettings(finalSettings);
    }, [prefix]);
    
    const [selectedMonth, setSelectedMonth] = useState(new Date());

    // Settings Persistence Effect
    useEffect(() => {
        localStorage.setItem(`${prefix}_settings`, JSON.stringify(settings));
    }, [settings, prefix]);

    // --- DATA RETENTION POLICY ENFORCEMENT ---
    useEffect(() => {
        const period = settings.dataRetention?.period;
        if (period && period > 0) {
            const cutoffDate = new Date();
            cutoffDate.setMonth(cutoffDate.getMonth() - period);
            
            let hasChanges = false;

            const filteredAppointments = appointments.filter(app => {
                const appDate = new Date(app.date);
                return appDate >= cutoffDate || app.status === AppointmentStatus.PENDING;
            });

            const filteredExpenses = expenses.filter(exp => {
                const expDate = new Date(exp.date);
                return expDate >= cutoffDate;
            });

            if (filteredAppointments.length !== appointments.length) {
                setAppointments(filteredAppointments);
                hasChanges = true;
            }

            if (filteredExpenses.length !== expenses.length) {
                setExpenses(filteredExpenses);
                hasChanges = true;
            }

            if (hasChanges) {
                console.log(`[Data Retention] Cleaned data older than ${period} months.`);
            }
        }
    }, [settings.dataRetention?.period, appointments.length, expenses.length]);


    // --- Computed Values (KPIs, etc.) ---
    const isSameMonth = (d1: Date, d2: Date) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();

    const filteredAppointments = useMemo(() => 
        appointments.filter(a => isSameMonth(new Date(a.date), selectedMonth)),
    [appointments, selectedMonth]);

    const filteredExpenses = useMemo(() =>
        expenses.filter(e => isSameMonth(new Date(e.date), selectedMonth)),
    [expenses, selectedMonth]);


    const kpis = useMemo<Kpis>(() => {
        const completedAppointments = filteredAppointments.filter(a => a.status === AppointmentStatus.COMPLETED);
        const totalRevenue = completedAppointments.reduce((sum, app) => sum + (app.finalPrice || 0), 0);
        const clientsServed = completedAppointments.length;
        const averageTicket = clientsServed > 0 ? totalRevenue / clientsServed : 0;
        const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        const netProfit = totalRevenue - totalExpenses;
        return { totalRevenue, clientsServed, averageTicket, totalExpenses, netProfit };
    }, [filteredAppointments, filteredExpenses]);

    const topServices = useMemo<TopServiceData[]>(() => {
        const serviceCounts: { [key: string]: number } = {};
        filteredAppointments
            .filter(a => a.status === AppointmentStatus.COMPLETED)
            .forEach(a => {
                a.services.forEach(s => {
                    serviceCounts[s.name] = (serviceCounts[s.name] || 0) + 1;
                });
            });

        return Object.entries(serviceCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 3);
    }, [filteredAppointments]);
    
    const historicalData = useMemo<HistoricalDataPoint[]>(() => {
        const data: HistoricalDataPoint[] = [];
        const today = new Date();
        for (let i = 11; i >= 0; i--) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const monthStr = date.toLocaleString('default', { month: 'short' });
            
            const monthAppointments = appointments.filter(a => isSameMonth(new Date(a.date), date));
            const monthExpenses = expenses.filter(e => isSameMonth(new Date(e.date), date));

            const revenue = monthAppointments
                .filter(a => a.status === AppointmentStatus.COMPLETED)
                .reduce((sum, a) => sum + (a.finalPrice || 0), 0);
                
            const clientsServed = monthAppointments.filter(a => a.status === AppointmentStatus.COMPLETED).length;
            
            const totalExpenses = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

            data.push({ month: monthStr, revenue, clientsServed, expenses: totalExpenses });
        }
        return data;
    }, [appointments, expenses]);
    
     const revenueByService = useMemo<RevenueByServiceData[]>(() => {
        const serviceRevenue: { [key: string]: number } = {};
        
        services.forEach(service => {
            serviceRevenue[service.name] = 0;
        });

        filteredAppointments
            .filter(a => a.status === AppointmentStatus.COMPLETED)
            .forEach(a => {
                a.services.forEach(s => {
                    serviceRevenue[s.name] = (serviceRevenue[s.name] || 0) + s.price;
                });
            });

        return Object.entries(serviceRevenue)
            .map(([name, revenue]) => ({ name, revenue }))
            .sort((a, b) => b.revenue - a.revenue);
    }, [filteredAppointments, services]);

    const clientProfiles = useMemo<ClientProfile[]>(() => {
        return clients.map(client => {
            const clientAppointments = appointments.filter(a => a.clientName === client.name);
            const completed = clientAppointments.filter(a => a.status === AppointmentStatus.COMPLETED);
            
            const totalRevenue = completed.reduce((sum, a) => sum + (a.finalPrice || 0), 0);
            
            const serviceCounts: { [key: string]: number } = {};
            completed.forEach(a => {
                a.services.forEach(s => {
                    serviceCounts[s.name] = (serviceCounts[s.name] || 0) + 1;
                });
            });
            const completedServices = Object.entries(serviceCounts).map(([serviceName, count]) => ({ serviceName, count }));
            
            const canceledAppointments = clientAppointments.filter(a => a.status === AppointmentStatus.CANCELED).length;

            return {
                ...client,
                totalRevenue,
                completedServices,
                canceledAppointments
            };
        }).sort((a, b) => b.totalRevenue - a.totalRevenue);
    }, [clients, appointments]);


    // Actions
    const updateSettings = useCallback((newSettings: Settings) => {
        setSettings(newSettings);
    }, []);

    const addService = useCallback((service: Omit<Service, 'id'>) => {
        setServices(prev => [...prev, { ...service, id: Date.now().toString() }]);
    }, [setServices]);

    const updateService = useCallback((updatedService: Service) => {
        setServices(prev => prev.map(s => s.id === updatedService.id ? updatedService : s));
    }, [setServices]);

    const deleteService = useCallback((serviceId: string) => {
        setServices(prev => prev.filter(s => s.id !== serviceId));
    }, [setServices]);

    const addProduct = useCallback((product: Omit<Product, 'id'>) => {
        setProducts(prev => [...prev, { ...product, id: Date.now().toString() }]);
    }, [setProducts]);

    const updateProduct = useCallback((updatedProduct: Product) => {
        setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    }, [setProducts]);

    const deleteProduct = useCallback((productId: string) => {
        setProducts(prev => prev.filter(p => p.id !== productId));
    }, [setProducts]);

    const sellProduct = useCallback((productId: string, clientName: string, quantity: number) => {
        const product = products.find(p => p.id === productId);
        if (!product) return;

        if (product.quantity < quantity) {
            alert('Estoque insuficiente!');
            return;
        }

        // 1. Decrease Stock
        const updatedProduct = { ...product, quantity: product.quantity - quantity };
        updateProduct(updatedProduct);

        // 2. Create Transaction (Recorded as a Completed Appointment)
        // This ensures the sale appears in Reports, Dashboard, and Client History automatically.
        const totalValue = product.price * quantity;
        const transactionService: Service = {
            id: `prod-sale-${productId}`,
            name: `${product.name} (Qtd: ${quantity})`,
            price: totalValue,
            duration: 0
        };

        const saleRecord: Appointment = {
            id: `sale-${Date.now()}`,
            clientName: clientName,
            date: new Date().toISOString(),
            status: AppointmentStatus.COMPLETED,
            services: [transactionService],
            finalPrice: totalValue,
            professionalId: 'admin', // Or current user if available, using 'admin' as generic system sale
            notes: 'Venda de Produto'
        };

        setAppointments(prev => [...prev, saleRecord]);

    }, [products, updateProduct, setAppointments]);
    
    const isSlotAvailable = useCallback((
        targetDate: Date,
        professionalId: string,
        duration: number,
        allAppointments: Appointment[],
        currentSettings: Settings
    ): boolean => {
        // 1. Check if it's a working day
        const dayOfWeek = targetDate.getUTCDay();
        if (!currentSettings.workingDays.includes(dayOfWeek)) {
            return false;
        }

        // 2. Check for special closed days
        const dateString = targetDate.toISOString().split('T')[0];
        const specialDay = currentSettings.specialDays.find(d => d.date === dateString);
        if (specialDay?.isClosed) {
            return false;
        }

        // 3. Check if time is within business hours (regular or special)
        const businessHours = (specialDay && !specialDay.isClosed && specialDay.hours)
            ? specialDay.hours
            : currentSettings.businessHours;
        const [startHour, startMinute] = businessHours.start.split(':').map(Number);
        const [endHour, endMinute] = businessHours.end.split(':').map(Number);

        const targetStartTime = targetDate.getTime();
        const targetEndTime = targetStartTime + duration * 60 * 1000;

        const dayStart = new Date(targetDate);
        dayStart.setHours(startHour, startMinute, 0, 0);
        const dayEnd = new Date(targetDate);
        dayEnd.setHours(endHour, endMinute, 0, 0);

        if (targetStartTime < dayStart.getTime() || targetEndTime > dayEnd.getTime()) {
            return false;
        }

        // 4. Check for conflicts with other appointments for the same professional
        const professionalAppointmentsOnDay = allAppointments.filter(app =>
            app.professionalId === professionalId &&
            new Date(app.date).toISOString().split('T')[0] === dateString
        );

        return !professionalAppointmentsOnDay.some(app => {
            const existingStart = new Date(app.date).getTime();
            const existingDuration = app.services.reduce((sum, s) => sum + s.duration, 0);
            const existingEnd = existingStart + existingDuration * 60 * 1000;

            // Check for overlap: (StartA < EndB) and (EndA > StartB)
            return targetStartTime < existingEnd && targetEndTime > existingStart;
        });
    }, []);


    const addAppointment = useCallback((appointment: Omit<Appointment, 'id' | 'status'>, recurrence: RecurrenceSettings) => {
        const newAppointments: Appointment[] = [];
        const initialAppointment = { ...appointment, id: Date.now().toString(), status: AppointmentStatus.PENDING };
        newAppointments.push(initialAppointment);

        let created = 1;
        let skipped = 0;

        if (recurrence.type !== 'none' && recurrence.count > 0) {
            let lastDate = new Date(appointment.date);
            const duration = appointment.services.reduce((sum, s) => sum + s.duration, 0);

            for (let i = 0; i < recurrence.count; i++) {
                const nextDate = new Date(lastDate);
                if (recurrence.type === 'daily') {
                    nextDate.setDate(nextDate.getDate() + 1);
                } else if (recurrence.type === 'weekly') {
                    nextDate.setDate(nextDate.getDate() + 7);
                } else if (recurrence.type === 'biweekly') {
                    nextDate.setDate(nextDate.getDate() + 15);
                } else if (recurrence.type === 'twenty_days') {
                    nextDate.setDate(nextDate.getDate() + 20);
                } else if (recurrence.type === 'monthly') {
                    nextDate.setMonth(nextDate.getMonth() + 1);
                }

                // Check availability of the future slot
                if (isSlotAvailable(nextDate, appointment.professionalId, duration, [...appointments, ...newAppointments], settings)) {
                    newAppointments.push({
                        ...appointment,
                        id: `${Date.now().toString()}-${i}`,
                        date: nextDate.toISOString(),
                        status: AppointmentStatus.PENDING,
                    });
                    created++;
                } else {
                    skipped++;
                }
                lastDate = nextDate;
            }
        }
        
        setAppointments(prev => [...prev, ...newAppointments]);
        return { created, skipped };

    }, [appointments, settings, isSlotAvailable, setAppointments]);


    const updateAppointment = useCallback((updatedAppointment: Appointment) => {
        setAppointments(prev => prev.map(a => a.id === updatedAppointment.id ? updatedAppointment : a));
    }, [setAppointments]);

    const updateAppointmentStatus = useCallback((appointmentId: string, status: AppointmentStatus, finalPrice?: number) => {
        setAppointments(prev => prev.map(a => a.id === appointmentId ? { ...a, status, finalPrice: status === AppointmentStatus.COMPLETED ? finalPrice : undefined } : a));
    }, [setAppointments]);
    
    const addClient = useCallback((client: Omit<Client, 'id'>) => {
        const newId = clients.length > 0 ? Math.max(...clients.map(c => c.id)) + 1 : 1;
        setClients(prev => [...prev, { ...client, id: newId }]);
    }, [clients, setClients]);

    const deleteClient = useCallback((clientId: number) => {
        const clientToDelete = clients.find(c => c.id === clientId);
        if (!clientToDelete) return;

        // Also remove appointments associated with this client to maintain data integrity
        setAppointments(prev => prev.filter(a => a.clientName !== clientToDelete.name));
        
        // Remove the client
        setClients(prev => prev.filter(c => c.id !== clientId));
    }, [clients, setAppointments, setClients]);

    const addExpense = useCallback((expense: Omit<Expense, 'id'>) => {
        setExpenses(prev => [...prev, { ...expense, id: Date.now().toString() }]);
    }, [setExpenses]);
    
    const updateExpense = useCallback((updatedExpense: Expense) => {
        setExpenses(prev => prev.map(e => e.id === updatedExpense.id ? updatedExpense : e));
    }, [setExpenses]);
    
    const deleteExpense = useCallback((expenseId: string) => {
        setExpenses(prev => prev.filter(e => e.id !== expenseId));
    }, [setExpenses]);

    const addProfessional = useCallback((professional: Omit<Professional, 'id'>) => {
        setProfessionals(prev => [...prev, { ...professional, id: Date.now().toString() }]);
    }, [setProfessionals]);

    const updateProfessional = useCallback((updatedProfessional: Professional) => {
        setProfessionals(prev => prev.map(p => p.id === updatedProfessional.id ? updatedProfessional : p));
    }, [setProfessionals]);

    const deleteProfessional = useCallback((professionalId: string) => {
        setProfessionals(prev => prev.filter(p => p.id !== professionalId));
    }, [setProfessionals]);

    const resetAllData = useCallback(() => {
        // 1. Clear Local Storage keys related to the app AND the current user prefix
        localStorage.removeItem(`${prefix}_services`);
        localStorage.removeItem(`${prefix}_products`);
        localStorage.removeItem(`${prefix}_appointments`);
        localStorage.removeItem(`${prefix}_expenses`);
        localStorage.removeItem(`${prefix}_clients`);
        localStorage.removeItem(`${prefix}_professionals`);
        localStorage.removeItem(`${prefix}_settings`);

        // 2. Reset State to Initial/Empty Values (Factory Reset)
        setAppointments([]);
        setExpenses([]);
        // For static catalogs, we reset to the default values so the app remains usable
        setServices(SERVICES_CATALOG);
        setProducts(PRODUCTS_CATALOG);
        setClients(CLIENTS_CATALOG);
        setProfessionals(PROFESSIONALS_CATALOG);
        setSettings(INITIAL_SETTINGS);
    }, [setAppointments, setExpenses, setServices, setProducts, setClients, setProfessionals, setSettings, prefix]);

    return {
        // Full Data
        services,
        products,
        appointments,
        expenses,
        clients,
        professionals,
        settings,
        // Monthly Filtered Data
        filteredAppointments,
        filteredExpenses,
        kpis,
        topServices,
        revenueByService,
        // Other Data
        clientProfiles,
        historicalData,
        // State
        selectedMonth,
        setSelectedMonth,
        // Actions
        actions: {
            updateSettings,
            addService,
            updateService,
            deleteService,
            addProduct,
            updateProduct,
            deleteProduct,
            sellProduct,
            addAppointment,
            updateAppointment,
            updateAppointmentStatus,
            addClient,
            deleteClient,
            addExpense,
            updateExpense,
            deleteExpense,
            addProfessional,
            updateProfessional,
            deleteProfessional,
            resetAllData,
        }
    };
};
