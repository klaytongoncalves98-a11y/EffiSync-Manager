import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Appointment, Service, AppointmentStatus, Client, Professional, Settings, Kpis } from '../types';
import { CalendarIcon, PlusIcon, CheckIcon, CancelIcon, FileTextIcon, EditIcon, CloseIcon, UserIcon, LightbulbIcon } from './icons';
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
    type: 'none' | 'daily' | 'weekly' | 'monthly';
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

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

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

        if (query) {
            setFilteredClients(
                clients.filter(client =>
                    client.name.toLowerCase().includes(query.toLowerCase())
                )
            );
            setShowSuggestions(true);
        } else {
            setFilteredClients([]);
            setShowSuggestions(false);
        }
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
        <form onSubmit={handleSubmit} className="space-y-4">
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
                            <option value="daily">Diário</option>
                            <option value="weekly">Semanal</option>
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
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onClose} className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-500">Cancelar</button>
                <button type="submit" className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700">Agendar</button>
            </div>
        </form>
    );
};

const FormattedAIResponse: React.FC<{ text: string }> = ({ text }) => {
    const parts = text.split(/(\*\*.*?\*\*)/g).filter(part => part);
    return (
        <pre className="text-gray-300 whitespace-pre-wrap font-sans">
            {parts.map((part, index) =>
                part.startsWith('**') && part.endsWith('**')
                    ? <strong key={index} className="text-amber-300">{part.slice(2, -2)}</strong>
                    : part
            )}
        </pre>
    );
};

const Schedule: React.FC<ScheduleProps> = ({ appointments, services, clients, professionals, actions, showNotification, professionalFilter, setProfessionalFilter, settings }) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [isCancelModalOpen, setCancelModalOpen] = useState(false);
    const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);
    const [cancelReason, setCancelReason] = useState('');

    const [isAnalysisModalOpen, setAnalysisModalOpen] = useState(false);
    const [analysisResult, setAnalysisResult] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const filteredAppointments = useMemo(() =>
        appointments
            .filter(app => {
                const appointmentDate = app.date.split('T')[0];
                const dateMatch = appointmentDate === selectedDate;
                const statusMatch = app.status === AppointmentStatus.PENDING;
                const professionalMatch = professionalFilter ? app.professionalId === professionalFilter : true;
                return dateMatch && statusMatch && professionalMatch;
            })
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [appointments, selectedDate, professionalFilter]);
    
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
        <div className="space-y-8 animate-fade-in">
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
            
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center gap-4 bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                     <div className="flex flex-1 items-center space-x-2">
                        <label htmlFor="schedule-date" className="font-medium text-gray-300">Dia:</label>
                        <input
                            type="date"
                            id="schedule-date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-amber-500 focus:border-amber-500"
                        />
                    </div>
                    <div className="flex flex-1 items-center space-x-2">
                        <label htmlFor="professional-filter" className="font-medium text-gray-300">Profissional:</label>
                        <select
                            id="professional-filter"
                            value={professionalFilter || ''}
                            onChange={(e) => setProfessionalFilter(e.target.value || null)}
                            className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-amber-500 focus:border-amber-500"
                        >
                            <option value="">Todos</option>
                            {professionals.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                 {professionalFilter && professionalName && (
                    <div className="bg-blue-900/50 text-blue-200 p-3 rounded-lg flex justify-between items-center animate-fade-in-down border border-blue-700">
                        <span className="text-sm">Visualizando agenda de: <strong>{professionalName}</strong></span>
                        <button onClick={() => setProfessionalFilter(null)} className="flex items-center text-xs bg-blue-600 px-3 py-1 rounded-md hover:bg-blue-700 text-white transition-colors">
                            <CloseIcon className="w-4 h-4 mr-1" />
                            Limpar
                        </button>
                    </div>
                )}
            </div>

            <div className="bg-gray-800 rounded-lg shadow-lg">
                {/* Desktop Header */}
                <div className="hidden md:grid grid-cols-5 gap-4 p-4 border-b border-gray-700 text-sm font-semibold text-gray-400">
                    <div>Cliente</div>
                    <div>Hora</div>
                    <div>Serviços</div>
                    <div>Profissional</div>
                    <div className="text-center">Ações</div>
                </div>
                {/* Mobile/Desktop List */}
                <div className="md:divide-y md:divide-gray-700/50">
                    {filteredAppointments.length > 0 ? (
                        filteredAppointments.map(app => {
                            const client = clients.find(c => c.name === app.clientName);
                            const professional = professionals.find(p => p.id === app.professionalId);
                            const totalDuration = app.services.reduce((sum, s) => sum + (s.duration || 0), 0);
                            return (
                                <div key={app.id} className="p-4 border-b border-gray-700/50 md:grid md:grid-cols-5 md:gap-4 md:items-center md:p-4 md:border-none hover:bg-gray-700/40">
                                    {/* Item 1: Cliente */}
                                    <div className="flex justify-between items-start md:block">
                                        <div className="md:hidden text-xs font-bold uppercase text-gray-400">Cliente</div>
                                        <div>
                                            <p className="font-medium text-white flex items-center">
                                                {app.clientName}
                                                {app.notes && (
                                                    <span title={app.notes} className="ml-2 text-gray-400 hover:text-amber-400 cursor-help">
                                                        <FileTextIcon className="w-4 h-4" />
                                                    </span>
                                                )}
                                            </p>
                                            {client && <p className="text-sm text-gray-400">{formatPhoneNumber(client.phone)}</p>}
                                        </div>
                                    </div>

                                    {/* Item 2: Hora */}
                                    <div className="mt-2 md:mt-0 flex justify-between items-center md:block">
                                        <div className="md:hidden text-xs font-bold uppercase text-gray-400">Hora</div>
                                        <div className="flex items-center text-gray-300 text-sm">
                                            <CalendarIcon className="w-4 h-4 mr-2" />
                                            <span>{new Date(app.date).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>
                                    
                                    {/* Item 3: Serviços */}
                                    <div className="mt-2 md:mt-0">
                                        <div className="md:hidden text-xs font-bold uppercase text-gray-400 mb-1">Serviços</div>
                                        <div className="text-sm text-gray-400">
                                            {app.services.map(s => s.name).join(', ')}
                                            {totalDuration > 0 && <p className="text-xs text-gray-500 mt-1">Duração: {totalDuration} min</p>}
                                        </div>
                                    </div>
                                    
                                    {/* Item 4: Profissional */}
                                    <div className="mt-2 md:mt-0 flex justify-between items-center md:block">
                                        <div className="md:hidden text-xs font-bold uppercase text-gray-400">Profissional</div>
                                        <div className="text-sm text-gray-300 text-right md:text-left flex items-center justify-end md:justify-start">
                                            {professional?.imageUrl ? (
                                                <img src={professional.imageUrl} alt={professional.name} className="w-6 h-6 rounded-full mr-2 object-cover"/>
                                            ) : (
                                                <div className="w-6 h-6 rounded-full mr-2 bg-gray-700 flex items-center justify-center">
                                                    <UserIcon className="w-4 h-4 text-gray-400" />
                                                </div>
                                            )}
                                            <span>{professional?.name || 'N/A'}</span>
                                        </div>
                                    </div>
                                    
                                    {/* Item 5: Ações */}
                                    <div className="mt-4 md:mt-0">
                                        <div className="flex justify-end md:justify-center space-x-2">
                                            <Tooltip text="Editar Agendamento">
                                                <button onClick={() => handleOpenEditModal(app)} className="flex items-center text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-md hover:bg-blue-500/40 transition-colors">
                                                    <EditIcon className="w-4 h-4 md:mr-1" /> <span className="hidden md:inline">Editar</span>
                                                </button>
                                            </Tooltip>
                                            <Tooltip text="Marcar como Concluído">
                                                <button onClick={() => handleStatusChange(app, AppointmentStatus.COMPLETED)} className="flex items-center text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-md hover:bg-green-500/40 transition-colors">
                                                    <CheckIcon className="w-4 h-4" />
                                                </button>
                                            </Tooltip>
                                            <Tooltip text="Cancelar Agendamento">
                                                <button onClick={() => handleCancelClick(app)} className="flex items-center text-xs bg-red-500/20 text-red-300 px-2 py-1 rounded-md hover:bg-red-500/40 transition-colors">
                                                    <CancelIcon className="w-4 h-4" />
                                                </button>
                                            </Tooltip>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    ) : (
                        <div className="p-8 text-center text-gray-400">
                            Nenhum agendamento pendente para esta data.
                        </div>
                    )}
                </div>
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
                <div className="min-h-[200px]">
                    {isAnalyzing && <div className="text-gray-400 animate-pulse text-center pt-16">Analisando dados, por favor aguarde...</div>}
                    {analysisResult && <FormattedAIResponse text={analysisResult} />}
                </div>
            </Modal>
        </div>
    );
};

export default Schedule;