
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Appointment, Service, AppointmentStatus, Client, Professional, Settings, Kpis } from '../types';
import { CalendarIcon, PlusIcon, CheckIcon, CancelIcon, FileTextIcon, EditIcon, CloseIcon, UserIcon, LightbulbIcon, ChevronLeftIcon, ChevronRightIcon } from './icons';
import Modal from './Modal';
import Tooltip from './Tooltip';
import { getAIAnalytics } from '../services/geminiService';


interface ScheduleProps {
    appointments: Appointment[];
    services: Service[];
    clients: Client[];
    professionals: Professional[];
    actions: {
        addAppointment: (appointment: Omit<Appointment, 'id' | 'status'>, recurrence: RecurrenceSettings) => { created: number, skipped: number };
        updateAppointment: (appointment: Appointment) => void;
        updateAppointmentStatus: (appointmentId: string, status: AppointmentStatus, finalPrice?: number) => void;
    };
    showNotification: (message: string) => void;
    professionalFilter: string | null;
    setProfessionalFilter: (id: string | null) => void;
    settings: Settings;
}

export interface RecurrenceSettings {
    type: 'none' | 'daily' | 'weekly' | 'biweekly' | 'twenty_days' | 'monthly';
    count: number;
}

const formatPhoneNumber = (phone: string) => {
    const cleaned = ('' + phone).replace(/\D/g, '');
    if (cleaned.length === 11) {
        const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/);
        if (match) {
            return `(${match[1]}) ${match[2]}-${match[3]}`;
        }
    }
     if (cleaned.length === 10) {
        const match = cleaned.match(/^(\d{2})(\d{4})(\d{4})$/);
        if (match) {
            return `(${match[1]}) ${match[2]}-${match[3]}`;
        }
    }
    return phone;
};

const AppointmentForm: React.FC<{
    appointment?: Appointment | null;
    allAppointments: Appointment[];
    services: Service[];
    clients: Client[];
    professionals: Professional[];
    selectedDate: string;
    onSave: (appointment: Omit<Appointment, 'id' | 'status'> | Appointment, recurrence: RecurrenceSettings) => void;
    onClose: () => void;
    settings: Settings;
}> = ({ appointment, allAppointments, services, clients, professionals, selectedDate, onSave, onClose, settings }) => {
    
    const [appointmentDate, setAppointmentDate] = useState(appointment ? new Date(appointment.date).toISOString().split('T')[0] : selectedDate);
    const [selectedServices, setSelectedServices] = useState<Service[]>(appointment?.services || []);
    const [notes, setNotes] = useState(appointment?.notes || '');
    const [professionalId, setProfessionalId] = useState<string>(appointment?.professionalId || professionals[0]?.id || '');
    const [selectedTime, setSelectedTime] = useState<string | null>(appointment ? new Date(appointment.date).toTimeString().substring(0, 5) : null);

    const [recurrence, setRecurrence] = useState<RecurrenceSettings>({ type: 'none', count: 4 });

    const initialClient = useMemo(() => appointment ? clients.find(c => c.name === appointment.clientName) : null, [clients, appointment]);
    const [searchQuery, setSearchQuery] = useState(initialClient?.name || '');
    const [selectedClient, setSelectedClient] = useState<Client | null>(initialClient);
    const [filteredClients, setFilteredClients] = useState<Client[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const [showComboSuggestion, setShowComboSuggestion] = useState(false);
    const comboService = useMemo(() => services.find(s => s.name === 'Corte + Barba'), [services]);

    // Handle Click Outside to close suggestions
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Debounce Logic for Client Search
    useEffect(() => {
        const timer = setTimeout(() => {
            // Optimization: If the query matches the currently selected client, don't reopen suggestions
            // This prevents the list from popping up immediately after selection
            if (selectedClient && searchQuery === selectedClient.name) {
                return;
            }

            if (searchQuery) {
                const filtered = clients.filter(client =>
                    client.name.toLowerCase().includes(searchQuery.toLowerCase())
                );
                setFilteredClients(filtered);
                // Only show suggestions if we are actually searching/filtering
                setShowSuggestions(true);
            } else {
                setFilteredClients([]);
                setShowSuggestions(false);
            }
        }, 300); // 300ms debounce delay

        return () => clearTimeout(timer);
    }, [searchQuery, clients, selectedClient]);

    useEffect(() => {
        const hasHaircut = selectedServices.some(s => s.name === 'Corte de Cabelo');
        const hasBeard = selectedServices.some(s => s.name === 'Barba');
        const hasCombo = selectedServices.some(s => s.name === 'Corte + Barba');

        if (hasHaircut && hasBeard && !hasCombo && comboService) {
            setShowComboSuggestion(true);
        } else {
            setShowComboSuggestion(false);
        }
    }, [selectedServices, comboService]);

    const isShopClosedOnSelectedDate = useMemo(() => {
        if (!appointmentDate) return false;

        const specialDay = settings.specialDays.find(d => d.date === appointmentDate);
        if (specialDay) {
            return specialDay.isClosed;
        }
        
        // Create date in UTC to avoid timezone issues when getting the day of the week
        const dateObj = new Date(appointmentDate + 'T00:00:00');
        const dayOfWeek = dateObj.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.

        const isWorkingDay = settings.workingDays.includes(dayOfWeek);

        return !isWorkingDay;
    }, [appointmentDate, settings.workingDays, settings.specialDays]);


    const availableSlots = useMemo(() => {
        if (!professionalId || selectedServices.length === 0 || isShopClosedOnSelectedDate) {
            return [];
        }
        
        const specialDay = settings.specialDays.find(d => d.date === appointmentDate);
        const businessHours = (specialDay && !specialDay.isClosed && specialDay.hours) 
            ? specialDay.hours 
            : settings.businessHours;

        const [startHour, startMinute] = businessHours.start.split(':').map(Number);
        const [endHour, endMinute] = businessHours.end.split(':').map(Number);
        
        const SLOT_INCREMENT_MINUTES = 15;
        const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);

        const professionalAppointments = allAppointments.filter(
            app => app.professionalId === professionalId && app.date.startsWith(appointmentDate) && app.id !== appointment?.id
        );

        const busySlots = professionalAppointments.map(app => {
            const start = new Date(app.date).getTime();
            const duration = app.services.reduce((sum, s) => sum + s.duration, 0);
            const end = start + duration * 60 * 1000;
            return { start, end };
        });

        const slots = [];
        const dayStart = new Date(`${appointmentDate}T00:00:00`);
        
        for (let hour = startHour; hour < endHour; hour++) {
            for (let minute = (hour === startHour ? startMinute : 0); minute < 60; minute += SLOT_INCREMENT_MINUTES) {
                const slotStart = new Date(dayStart);
                slotStart.setHours(hour, minute);
                
                const slotEnd = new Date(slotStart.getTime() + totalDuration * 60 * 1000);

                if (slotEnd.getHours() > endHour || (slotEnd.getHours() === endHour && slotEnd.getMinutes() > endMinute)) {
                    continue;
                }

                const isOverlapping = busySlots.some(busy => 
                    (slotStart.getTime() < busy.end && slotEnd.getTime() > busy.start)
                );

                if (!isOverlapping) {
                    slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
                }
            }
        }
        return slots;
    }, [professionalId, selectedServices, appointmentDate, allAppointments, appointment, settings.businessHours, isShopClosedOnSelectedDate, settings.specialDays]);
    
    // If services change, check if the current selected time is still valid
    useEffect(() => {
        if (selectedTime && !availableSlots.includes(selectedTime)) {
            setSelectedTime(null);
        }
    }, [availableSlots, selectedTime]);


    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);
        setSelectedClient(null); // Invalidate selection if user types again
        // Filtering is now handled by the useEffect debounce logic
    };

    const handleSelectClient = (client: Client) => {
        setSelectedClient(client);
        setSearchQuery(client.name);
        setShowSuggestions(false);
    };
    
    const handleServiceToggle = (service: Service) => {
        setSelectedServices(prev =>
            prev.find(s => s.id === service.id)
                ? prev.filter(s => s.id !== service.id)
                : [...prev, service]
        );
    };

    const handleSwitchToCombo = () => {
        if (!comboService) return;
        const otherServices = selectedServices.filter(
            s => s.name !== 'Corte de Cabelo' && s.name !== 'Barba'
        );
        setSelectedServices([...otherServices, comboService]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClient || selectedServices.length === 0 || !professionalId || !selectedTime) {
            alert('Por favor, selecione um cliente, um profissional, um serviço e um horário disponível.');
            return;
        }

        const [hours, minutes] = selectedTime.split(':').map(Number);
        const finalDate = new Date(`${appointmentDate}T00:00:00`);
        finalDate.setHours(hours, minutes);

        const appointmentData = { 
            clientName: selectedClient.name, 
            date: finalDate.toISOString(), 
            services: selectedServices, 
            notes, 
            professionalId 
        };
        
        if (appointment) {
            onSave({ ...appointmentData, id: appointment.id, status: appointment.status }, { type: 'none', count: 0 });
        } else {
            onSave(appointmentData, recurrence);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-[75vh] md:h-auto md:max-h-[80vh]">
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4 pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div ref={searchContainerRef} className="relative">
                        <label className="block text-sm font-medium text-gray-300 mb-1">Cliente</label>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            onFocus={() => searchQuery && setShowSuggestions(true)}
                            placeholder="Digite para buscar..."
                            autoComplete="off"
                            required
                            className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-amber-500 focus:border-amber-500"
                        />
                        {showSuggestions && (
                            <ul className="absolute z-10 w-full bg-gray-600 border border-gray-500 rounded-md mt-1 max-h-48 overflow-y-auto shadow-lg">
                                {filteredClients.length > 0 ? (
                                    filteredClients.map(client => (
                                        <li
                                            key={client.id}
                                            onClick={() => handleSelectClient(client)}
                                            className="p-2 text-white hover:bg-amber-600 cursor-pointer"
                                        >
                                            {client.name}
                                        </li>
                                    ))
                                ) : (
                                    <li className="p-2 text-gray-400 italic">Nenhum cliente encontrado.</li>
                                )}
                            </ul>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Telefone</label>
                        <input
                            type="tel"
                            value={formatPhoneNumber(selectedClient?.phone || '')}
                            disabled
                            placeholder="Selecione um cliente"
                            className="w-full bg-gray-900 text-gray-400 p-2 rounded-md border border-gray-600 cursor-not-allowed"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Data</label>
                    <input
                        type="date"
                        value={appointmentDate}
                        onChange={(e) => {
                            setAppointmentDate(e.target.value);
                            setSelectedTime(null); // Reset time selection when date changes
                        }}
                        min={new Date().toISOString().split('T')[0]}
                        required
                        className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-amber-500 focus:border-amber-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Profissional</label>
                    <select
                        value={professionalId}
                        onChange={(e) => setProfessionalId(e.target.value)}
                        required
                        className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-amber-500 focus:border-amber-500"
                    >
                        <option value="" disabled>Selecione um profissional</option>
                        {professionals.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Serviços</label>
                    <div className="space-y-2 max-h-48 overflow-y-auto bg-gray-900 p-2 rounded-md">
                        {services.map(service => (
                            <label key={service.id} className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-gray-700 rounded">
                                <input
                                    type="checkbox"
                                    checked={selectedServices.some(s => s.id === service.id)}
                                    onChange={() => handleServiceToggle(service)}
                                    className="form-checkbox h-5 w-5 bg-gray-800 border-gray-600 text-amber-600 focus:ring-amber-500"
                                />
                                <span className="text-white">{service.name} - {service.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                <span className="text-sm text-gray-400 ml-auto">{service.duration} min</span>
                            </label>
                        ))}
                    </div>
                </div>
                {showComboSuggestion && comboService && (
                    <div className="bg-amber-800/50 border border-amber-600 p-3 rounded-lg text-center animate-fade-in-down">
                        <p className="text-amber-200 text-sm mb-2">
                            Economize! Troque por '{comboService.name}' por {comboService.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.
                        </p>
                        <button
                            type="button"
                            onClick={handleSwitchToCombo}
                            className="bg-amber-600 text-white px-3 py-1 text-sm rounded-md hover:bg-amber-700 transition-colors"
                        >
                            Trocar e Economizar
                        </button>
                    </div>
                )}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Horários Disponíveis</label>
                    <div className="p-2 bg-gray-900 rounded-md max-h-48 overflow-y-auto">
                        {isShopClosedOnSelectedDate ? (
                            <p className="text-center text-amber-400 p-4">A barbearia está fechada neste dia.</p>
                        ) : professionalId && selectedServices.length > 0 ? (
                            availableSlots.length > 0 ? (
                                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                                    {availableSlots.map(time => (
                                        <button
                                            key={time}
                                            type="button"
                                            onClick={() => setSelectedTime(time)}
                                            className={`p-2 rounded-md text-sm font-semibold transition-colors ${
                                                selectedTime === time 
                                                    ? 'bg-amber-600 text-white ring-2 ring-amber-400' 
                                                    : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                                            }`}
                                        >
                                            {time}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-gray-400 p-4">Nenhum horário disponível para esta data e seleção.</p>
                            )
                        ) : (
                            <p className="text-center text-gray-500 p-4 italic">Selecione um profissional e um serviço para ver os horários.</p>
                        )}
                    </div>
                </div>
                {!appointment && (
                    <div className="p-4 bg-gray-900 rounded-lg border border-gray-700 space-y-3">
                        <label className="block text-sm font-medium text-gray-300">Recorrência (Opcional)</label>
                        <div className="grid grid-cols-2 gap-4">
                            <select
                                value={recurrence.type}
                                onChange={(e) => setRecurrence(prev => ({ ...prev, type: e.target.value as RecurrenceSettings['type'] }))}
                                className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-amber-500 focus:border-amber-500"
                            >
                                <option value="none">Não repetir</option>
                                <option value="daily">Diário (Todos os dias)</option>
                                <option value="weekly">Semanal (7 dias)</option>
                                <option value="biweekly">Quinzenal (15 dias)</option>
                                <option value="twenty_days">A cada 20 dias</option>
                                <option value="monthly">Mensal</option>
                            </select>
                            {recurrence.type !== 'none' && (
                                <div className="flex items-center space-x-2">
                                    <label htmlFor="recurrence-count" className="text-sm text-gray-400">Repetir</label>
                                    <input
                                        type="number"
                                        id="recurrence-count"
                                        value={recurrence.count}
                                        onChange={(e) => setRecurrence(prev => ({ ...prev, count: Math.max(1, parseInt(e.target.value) || 1) }))}
                                        min="1"
                                        max="52"
                                        className="w-20 bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-amber-500 focus:border-amber-500"
                                    />
                                    <label htmlFor="recurrence-count" className="text-sm text-gray-400">vezes</label>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Observação (Opcional)</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                        placeholder="Ex: Cliente prefere a máquina 2 nas laterais, tem alergia a..."
                        className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-amber-500 focus:border-amber-500"
                    />
                </div>
            </div>
            {/* Fixed Footer Buttons */}
            <div className="pt-4 border-t border-gray-700 flex justify-end space-x-3 mt-auto bg-gray-800">
                <button type="button" onClick={onClose} className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-500">Cancelar</button>
                <button type="submit" className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700">Agendar</button>
            </div>
        </form>
    );
};

const FormattedAIResponse: React.FC<{ text: string }> = ({ text }) => {
    // Process text to find bold headers and list items for better formatting
    const lines = text.split('\n');
    
    return (
        <div className="bg-gray-800 rounded-lg p-6 font-sans text-gray-300 leading-relaxed shadow-inner">
            <div className="flex items-center justify-center mb-6">
                 <div className="bg-amber-600/20 p-3 rounded-full">
                     <LightbulbIcon className="w-8 h-8 text-amber-500" />
                 </div>
            </div>
            <div className="space-y-4">
                {lines.map((line, index) => {
                    const trimmed = line.trim();
                    if (!trimmed) return <br key={index} />;
                    
                    if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
                         return <h3 key={index} className="text-lg font-bold text-amber-400 mt-4 border-b border-gray-700 pb-2">{trimmed.slice(2, -2)}</h3>;
                    }
                    if (trimmed.startsWith('- ')) {
                        // Highlight suggestions inside list items if formatted with bold
                        const content = trimmed.slice(2);
                        const parts = content.split(/(\*\*.*?\*\*)/g);
                        return (
                            <div key={index} className="flex items-start">
                                <span className="text-amber-500 mr-2 mt-1.5">•</span>
                                <p>
                                    {parts.map((part, i) => 
                                        part.startsWith('**') && part.endsWith('**') 
                                            ? <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong> 
                                            : part
                                    )}
                                </p>
                            </div>
                        )
                    }
                    // Handle inline bolding for regular paragraphs
                     const parts = trimmed.split(/(\*\*.*?\*\*)/g);
                     return (
                        <p key={index}>
                             {parts.map((part, i) => 
                                part.startsWith('**') && part.endsWith('**') 
                                    ? <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong> 
                                    : part
                            )}
                        </p>
                     );
                })}
            </div>
            <div className="mt-6 pt-4 border-t border-gray-700 text-center text-xs text-gray-500">
                Análise gerada por Inteligência Artificial. Verifique as sugestões antes de aplicar.
            </div>
        </div>
    );
};

const Schedule: React.FC<ScheduleProps> = ({ appointments, services, clients, professionals, actions, showNotification, professionalFilter, setProfessionalFilter, settings }) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'COMPLETED' | 'CANCELED'>('ALL');
    const [isCancelModalOpen, setCancelModalOpen] = useState(false);
    const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);
    const [cancelReason, setCancelReason] = useState('');

    const [isAnalysisModalOpen, setAnalysisModalOpen] = useState(false);
    const [analysisResult, setAnalysisResult] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Navigation Helpers
    const changeDate = (days: number) => {
        const date = new Date(selectedDate + 'T00:00:00'); // append time to avoid timezone offset shifts on just date string
        date.setDate(date.getDate() + days);
        setSelectedDate(date.toISOString().split('T')[0]);
    };

    const getStatusTooltip = (status: AppointmentStatus) => {
        switch (status) {
            case AppointmentStatus.PENDING:
                return "Agendamento confirmado. Aguardando realização do serviço.";
            case AppointmentStatus.COMPLETED:
                return "Serviço concluído. Valor contabilizado no faturamento.";
            case AppointmentStatus.CANCELED:
                return "Agendamento cancelado. Não contabilizado.";
            default:
                return "";
        }
    };

    const filteredAppointments = useMemo(() =>
        appointments
            .filter(app => {
                const appointmentDate = app.date.split('T')[0];
                const dateMatch = appointmentDate === selectedDate;
                
                let statusMatch = true;
                if (statusFilter !== 'ALL') {
                    statusMatch = app.status === statusFilter;
                }
                
                const professionalMatch = professionalFilter ? app.professionalId === professionalFilter : true;
                return dateMatch && statusMatch && professionalMatch;
            })
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [appointments, selectedDate, professionalFilter, statusFilter]);

    // Daily Stats Calculation
    const dailyStats = useMemo(() => {
        const todaysApps = appointments.filter(app => app.date.split('T')[0] === selectedDate);
        const total = todaysApps.length;
        const pending = todaysApps.filter(a => a.status === AppointmentStatus.PENDING);
        const completed = todaysApps.filter(a => a.status === AppointmentStatus.COMPLETED);
        
        const projectedRevenue = pending.reduce((sum, app) => {
            const serviceTotal = app.services.reduce((s, serv) => s + serv.price, 0);
            return sum + serviceTotal;
        }, 0);

        const realizedRevenue = completed.reduce((sum, app) => sum + (app.finalPrice || 0), 0);

        return { total, pendingCount: pending.length, completedCount: completed.length, projectedRevenue, realizedRevenue };
    }, [appointments, selectedDate]);
    
    const handleOpenEditModal = (appointment: Appointment) => {
        setEditingAppointment(appointment);
        setModalOpen(true);
    };

    const handleOpenAddModal = () => {
        setEditingAppointment(null);
        setModalOpen(true);
    };
    
    const handleCloseModal = () => {
        setEditingAppointment(null);
        setModalOpen(false);
    };

    const handleStatusChange = (appointment: Appointment, newStatus: AppointmentStatus) => {
        if (newStatus === AppointmentStatus.COMPLETED) {
            const finalPrice = appointment.services.reduce((sum, s) => sum + s.price, 0);
            actions.updateAppointmentStatus(appointment.id, newStatus, finalPrice);
            showNotification(`Agendamento de ${appointment.clientName} foi concluído.`);
        }
    };

    const handleCancelClick = (appointment: Appointment) => {
        setAppointmentToCancel(appointment);
        setCancelModalOpen(true);
    };

    const handleCloseCancelModal = () => {
        setCancelModalOpen(false);
        setAppointmentToCancel(null);
        setCancelReason('');
    };
    
    const handleConfirmCancel = () => {
        if (!appointmentToCancel || !cancelReason.trim()) return;

        const updatedAppointment: Appointment = {
            ...appointmentToCancel,
            status: AppointmentStatus.CANCELED,
            notes: `Cancelado: ${cancelReason}. \n${appointmentToCancel.notes || ''}`.trim(),
        };

        actions.updateAppointment(updatedAppointment);
        showNotification(`Agendamento de ${appointmentToCancel.clientName} foi cancelado.`);
        handleCloseCancelModal();
    };

    const handleSaveAppointment = (appointmentData: Omit<Appointment, 'id' | 'status'> | Appointment, recurrence: RecurrenceSettings) => {
        if ('id' in appointmentData) {
            actions.updateAppointment(appointmentData as Appointment);
            showNotification(`Agendamento de ${appointmentData.clientName} atualizado com sucesso!`);
        } else {
            const { created, skipped } = actions.addAppointment(appointmentData, recurrence);
            let message = `${created > 1 ? `${created} agendamentos` : 'Agendamento'} para ${appointmentData.clientName} ${created > 1 ? 'criados' : 'criado'} com sucesso!`;
            if (skipped > 0) {
                message += ` ${skipped} foram ignorados por conflito ou dia de folga.`;
            }
            showNotification(message);
        }
        handleCloseModal();
    };

    const handleAnalyzeSchedule = async () => {
        setIsAnalyzing(true);
        setAnalysisResult('');
        setAnalysisModalOpen(true);

        const selectedMonthDate = new Date(selectedDate);
        const appointmentsForMonth = appointments.filter(a => {
            const appointmentDate = new Date(a.date);
            return appointmentDate.getFullYear() === selectedMonthDate.getFullYear() &&
                   appointmentDate.getMonth() === selectedMonthDate.getMonth();
        });

        try {
            // Recalculate relevant KPIs for the selected month
            const completedAppointments = appointmentsForMonth.filter(a => a.status === AppointmentStatus.COMPLETED);
            const totalRevenue = completedAppointments.reduce((sum, app) => sum + (app.finalPrice || 0), 0);
            const clientsServed = completedAppointments.length;
            const averageTicket = clientsServed > 0 ? totalRevenue / clientsServed : 0;
            const monthKpis: Kpis = {
                totalRevenue,
                clientsServed,
                averageTicket,
                totalExpenses: 0,
                netProfit: 0,
            };

            const prompt = `
                Analise os agendamentos do mês de ${selectedMonthDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}.
                Destaque os seguintes pontos:
                - Quais são os dias da semana de maior movimento?
                - Quais são os horários de pico durante os dias?
                - Quais serviços são mais agendados neste mês?
                - Existem possíveis gargalos, como horários totalmente lotados ou profissionais sobrecarregados?
                - Com base na análise, forneça **sugestões práticas** para otimizar a agenda, como sugerir promoções para horários de menor movimento ou ajustar a disponibilidade dos profissionais.
            `;
            const response = await getAIAnalytics(prompt, monthKpis, services, appointmentsForMonth);
            setAnalysisResult(response);
        } catch (error) {
            console.error("Error analyzing schedule:", error);
            setAnalysisResult("Ocorreu um erro ao analisar a agenda. Por favor, tente novamente.");
        } finally {
            setIsAnalyzing(false);
        }
    };


    const professionalName = useMemo(() => 
        professionalFilter ? professionals.find(p => p.id === professionalFilter)?.name : null
    , [professionalFilter, professionals]);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header / Actions */}
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                <h2 className="text-2xl md:text-3xl font-bold text-white">Agenda</h2>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <button onClick={handleAnalyzeSchedule} className="w-full md:w-auto flex items-center justify-center bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors">
                        <LightbulbIcon className="w-5 h-5 mr-2" />
                        Analisar Agenda
                    </button>
                    <button onClick={handleOpenAddModal} className="w-full md:w-auto flex items-center justify-center bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors">
                        <PlusIcon />
                        Novo Agendamento
                    </button>
                </div>
            </div>
            
            {/* Control Panel: Date & Filters */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Date Picker Section */}
                <div className="lg:col-span-5 bg-gray-800 p-4 rounded-lg flex items-center justify-between border border-gray-700">
                    <button onClick={() => changeDate(-1)} className="p-2 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white transition-colors">
                        <ChevronLeftIcon className="w-6 h-6" />
                    </button>
                    <div className="flex flex-col items-center">
                        <span className="text-xs text-gray-400 font-medium uppercase mb-1">Visualizando</span>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-transparent text-white font-bold text-lg text-center focus:outline-none cursor-pointer"
                        />
                    </div>
                    <button onClick={() => changeDate(1)} className="p-2 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white transition-colors">
                        <ChevronRightIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Filters Section */}
                <div className="lg:col-span-7 bg-gray-800 p-4 rounded-lg flex flex-col md:flex-row gap-4 border border-gray-700">
                     <div className="flex-1">
                        <select
                            value={professionalFilter || ''}
                            onChange={(e) => setProfessionalFilter(e.target.value || null)}
                            className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-amber-500 focus:border-amber-500"
                        >
                            <option value="">Todos os Profissionais</option>
                            {professionals.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex bg-gray-700 rounded-md p-1">
                        {['ALL', 'PENDING', 'COMPLETED', 'CANCELED'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status as any)}
                                className={`flex-1 px-3 py-1 rounded text-xs font-medium transition-all ${
                                    statusFilter === status 
                                    ? 'bg-amber-600 text-white shadow' 
                                    : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                {status === 'ALL' ? 'Todos' : status === 'PENDING' ? 'Pendentes' : status === 'COMPLETED' ? 'Feitos' : 'Cancelados'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Daily Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-800 p-3 rounded-lg border border-gray-700 text-center">
                    <p className="text-gray-400 text-xs uppercase">Agendamentos</p>
                    <p className="text-xl font-bold text-white">{dailyStats.total}</p>
                </div>
                 <div className="bg-gray-800 p-3 rounded-lg border border-gray-700 text-center">
                    <p className="text-gray-400 text-xs uppercase">Pendentes</p>
                    <p className="text-xl font-bold text-amber-500">{dailyStats.pendingCount}</p>
                </div>
                <div className="bg-gray-800 p-3 rounded-lg border border-gray-700 text-center">
                    <p className="text-gray-400 text-xs uppercase">Previsto (Dia)</p>
                    <p className="text-xl font-bold text-gray-300">{dailyStats.projectedRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                </div>
                 <div className="bg-gray-800 p-3 rounded-lg border border-gray-700 text-center">
                    <p className="text-gray-400 text-xs uppercase">Realizado (Dia)</p>
                    <p className="text-xl font-bold text-green-500">{dailyStats.realizedRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                </div>
            </div>

            {/* Appointment List */}
            <div className="space-y-3">
                {filteredAppointments.length > 0 ? (
                    filteredAppointments.map(app => {
                        const client = clients.find(c => c.name === app.clientName);
                        const professional = professionals.find(p => p.id === app.professionalId);
                        const totalDuration = app.services.reduce((sum, s) => sum + (s.duration || 0), 0);
                        
                        const appDate = new Date(app.date);
                        const today = new Date();
                        appDate.setHours(0, 0, 0, 0);
                        today.setHours(0, 0, 0, 0);
                        
                        const isFutureDate = appDate.getTime() > today.getTime();

                        // Border color based on status
                        let borderColor = 'border-l-4 border-gray-600';
                        if (app.status === AppointmentStatus.PENDING) borderColor = 'border-l-4 border-amber-500';
                        if (app.status === AppointmentStatus.COMPLETED) borderColor = 'border-l-4 border-green-500';
                        if (app.status === AppointmentStatus.CANCELED) borderColor = 'border-l-4 border-red-500';

                        return (
                            <div key={app.id} className={`bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-700/50 ${borderColor} hover:bg-gray-750 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4`}>
                                {/* Time & Client Info */}
                                <div className="flex items-center gap-4 flex-grow">
                                    <div className="flex flex-col items-center justify-center bg-gray-700 rounded p-2 min-w-[70px]">
                                         <span className="text-lg font-bold text-white leading-none">
                                            {new Date(app.date).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                         </span>
                                         <span className="text-xs text-gray-400 mt-1">{totalDuration} min</span>
                                    </div>
                                    <div>
                                        <div className="flex items-center">
                                            <p className="font-bold text-lg text-white mr-2">{app.clientName}</p>
                                            {app.notes && (
                                                <Tooltip text={app.notes}>
                                                    <FileTextIcon className="w-4 h-4 text-amber-500 cursor-help" />
                                                </Tooltip>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-400">{app.services.map(s => s.name).join(', ')}</p>
                                        <div className="flex items-center mt-1 text-xs text-gray-500 gap-3">
                                            {client && <span>{formatPhoneNumber(client.phone)}</span>}
                                            <span className="flex items-center gap-1">
                                                <UserIcon className="w-3 h-3" /> {professional?.name || 'Profissional'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Status & Actions */}
                                <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 border-gray-700 pt-3 md:pt-0">
                                    <div>
                                        <Tooltip text={getStatusTooltip(app.status)}>
                                            <span className={`text-xs font-bold px-2 py-1 rounded cursor-help select-none
                                                ${app.status === AppointmentStatus.COMPLETED ? 'bg-green-500/20 text-green-400' : 
                                                  app.status === AppointmentStatus.CANCELED ? 'bg-red-500/20 text-red-400' : 
                                                  'bg-amber-500/20 text-amber-400'}`}>
                                                {app.status === AppointmentStatus.COMPLETED ? 'Concluído' : app.status === AppointmentStatus.CANCELED ? 'Cancelado' : 'Pendente'}
                                            </span>
                                        </Tooltip>
                                    </div>
                                    
                                    <div className="flex gap-2">
                                        <Tooltip text="Editar">
                                            <button onClick={() => handleOpenEditModal(app)} className="p-2 rounded-lg bg-gray-700 text-blue-400 hover:bg-blue-600 hover:text-white transition-colors">
                                                <EditIcon className="w-4 h-4" />
                                            </button>
                                        </Tooltip>

                                        {app.status === AppointmentStatus.PENDING && (
                                            <>
                                                <Tooltip text={isFutureDate ? "Disponível apenas na data agendada" : "Concluir"}>
                                                    <button 
                                                        onClick={() => !isFutureDate && handleStatusChange(app, AppointmentStatus.COMPLETED)} 
                                                        className={`p-2 rounded-lg transition-colors ${isFutureDate ? 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50' : 'bg-gray-700 text-green-400 hover:bg-green-600 hover:text-white'}`}
                                                        disabled={isFutureDate}
                                                    >
                                                        <CheckIcon className="w-4 h-4" />
                                                    </button>
                                                </Tooltip>
                                                <Tooltip text="Cancelar">
                                                    <button onClick={() => handleCancelClick(app)} className="p-2 rounded-lg bg-gray-700 text-red-400 hover:bg-red-600 hover:text-white transition-colors">
                                                        <CancelIcon className="w-4 h-4" />
                                                    </button>
                                                </Tooltip>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })
                ) : (
                    <div className="bg-gray-800 rounded-lg p-12 text-center border border-gray-700 border-dashed">
                        <CalendarIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                        <h3 className="text-gray-300 font-medium text-lg">Agenda Livre</h3>
                        <p className="text-gray-500 mt-1">Nenhum agendamento encontrado para este filtro.</p>
                        <button onClick={handleOpenAddModal} className="mt-4 text-amber-500 hover:text-amber-400 font-medium text-sm">
                            + Adicionar novo agendamento
                        </button>
                    </div>
                )}
            </div>

            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={editingAppointment ? "Editar Agendamento" : "Novo Agendamento"}>
                <AppointmentForm 
                    appointment={editingAppointment}
                    allAppointments={appointments}
                    services={services} 
                    clients={clients} 
                    professionals={professionals}
                    selectedDate={selectedDate} 
                    onSave={handleSaveAppointment} 
                    onClose={handleCloseModal} 
                    settings={settings}
                />
            </Modal>
            
            <Modal isOpen={isCancelModalOpen} onClose={handleCloseCancelModal} title="Cancelar Agendamento">
                {appointmentToCancel && (
                    <div className="space-y-4">
                        <p className="text-gray-300">
                            Você tem certeza que deseja cancelar o agendamento de <strong className="text-white">{appointmentToCancel.clientName}</strong> para <strong className="text-white">{new Date(appointmentToCancel.date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</strong>?
                        </p>
                        <div>
                            <label htmlFor="cancelReason" className="block text-sm font-medium text-gray-300 mb-1">Motivo do Cancelamento</label>
                            <textarea
                                id="cancelReason"
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                rows={3}
                                placeholder="Ex: Cliente desmarcou, imprevisto, etc."
                                className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-amber-500 focus:border-amber-500"
                                required
                            />
                        </div>
                        <div className="flex justify-end space-x-3 pt-4">
                            <button type="button" onClick={handleCloseCancelModal} className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-500">
                                Voltar
                            </button>
                            <button 
                                type="button" 
                                onClick={handleConfirmCancel} 
                                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-red-900/50 disabled:text-gray-400 disabled:cursor-not-allowed"
                                disabled={!cancelReason.trim()}
                            >
                                Confirmar Cancelamento
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal isOpen={isAnalysisModalOpen} onClose={() => setAnalysisModalOpen(false)} title="Análise da Agenda">
                <div className="min-h-[200px] max-h-[70vh] overflow-y-auto">
                    {isAnalyzing && (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4 animate-pulse">
                            <LightbulbIcon className="w-12 h-12 text-amber-500" />
                            <p className="text-gray-400 text-lg">Nossa IA está analisando seus dados...</p>
                        </div>
                    )}
                    {!isAnalyzing && analysisResult && <FormattedAIResponse text={analysisResult} />}
                </div>
            </Modal>
        </div>
    );
};

export default Schedule;
