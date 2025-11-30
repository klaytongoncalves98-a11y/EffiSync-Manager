import React, { useMemo, useState, useEffect } from 'react';
import { Kpis, Appointment, AppointmentStatus, TopServiceData, Settings } from '../types';
import { CalendarIcon, ScissorsIcon, DevicePhoneMobileIcon, DownloadIcon } from './icons';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import MonthSelector from './MonthSelector';

interface DashboardProps {
    kpis: Kpis;
    appointments: Appointment[];
    topServices: TopServiceData[];
    settings: Settings;
    selectedMonth: Date;
    setSelectedMonth: (date: Date) => void;
}

const StatCard: React.FC<{ title: string; value: string; }> = ({ title, value }) => (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
        <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">{title}</h3>
        <p className="text-2xl md:text-3xl font-bold text-white mt-2">{value}</p>
    </div>
);

const GoalCard: React.FC<{ current: number; goal: number; selectedMonth: Date }> = ({ current, goal, selectedMonth }) => {
    const projection = useMemo(() => {
        const today = new Date();
        // Only calculate projection for the current month
        if (today.getFullYear() !== selectedMonth.getFullYear() || today.getMonth() !== selectedMonth.getMonth()) {
            return 0;
        }
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const currentDay = today.getDate();
        
        if (currentDay === 0 || current === 0) return 0;

        const dailyAverage = current / currentDay;
        return dailyAverage * daysInMonth;
    }, [current, selectedMonth]);
    
    const progress = goal > 0 ? (current / goal) * 100 : 0;

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider">Meta de Faturamento Mensal</h3>
            <div className="mt-3">
                <div className="flex justify-between items-end mb-1">
                    <span className="text-2xl md:text-3xl font-bold text-white">{current.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    <span className="text-base md:text-lg text-amber-400 font-semibold">{goal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                    <div 
                        className="bg-amber-500 h-3 rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(progress, 100)}%` }}
                    ></div>
                </div>
                 {projection > 0 && (
                    <p className="text-right text-xs text-gray-400 mt-2">
                        Projeção p/ fim do mês: <span className="font-bold text-gray-300">{projection.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </p>
                )}
            </div>
        </div>
    );
};

const AddToHomeScreenCard: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsVisible(true);
        };

        if (window.matchMedia('(display-mode: standalone)').matches) {
            return;
        }
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (deferredPrompt) {
            setIsVisible(false);
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to the install prompt: ${outcome}`);
            setDeferredPrompt(null);
        }
    };
    
    const handleDismissClick = () => {
        setIsVisible(false);
    };

    if (!deferredPrompt || !isVisible) {
        return null;
    }

    // Using slate colors for a blueish-gray tint, closer to the user's image reference
    // while maintaining the app's dark theme. Buttons are styled to look like cards as per user's phrasing.
    return (
        <div className="bg-slate-800 p-4 rounded-lg shadow-lg flex flex-wrap items-center justify-between w-full animate-fade-in-down gap-x-6 gap-y-4">
            <div className="flex items-center flex-grow min-w-[300px]">
                <div className="flex-shrink-0 p-3 bg-slate-700 rounded-full mr-4">
                    <DevicePhoneMobileIcon className="w-6 h-6 text-amber-500" />
                </div>
                <div>
                    <h3 className="font-semibold text-white">instale o App no seu celular!</h3>
                    <p className="text-sm text-gray-400 mt-1">Acesse sua barbearia como um app nativo, funciona offline e carrega mais rápido</p>
                </div>
            </div>
            <div className="flex items-center space-x-4 flex-shrink-0">
                <button onClick={handleDismissClick} className="text-gray-400 hover:text-white text-sm font-medium transition-colors px-4 py-2 rounded-lg hover:bg-slate-700">Agora não</button>
                <button onClick={handleInstallClick} className="flex items-center bg-amber-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors">
                    <DownloadIcon className="w-4 h-4 mr-2" />
                    <span>Instalar</span>
                </button>
            </div>
        </div>
    );
};


const Dashboard: React.FC<DashboardProps> = ({ kpis, appointments, topServices, settings, selectedMonth, setSelectedMonth }) => {
    const upcomingAppointments = appointments
        .filter(a => a.status === AppointmentStatus.PENDING && new Date(a.date) >= new Date())
        .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 5);

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                <h2 className="text-2xl md:text-3xl font-bold text-white">Dashboard</h2>
                <MonthSelector selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} />
            </div>

            <AddToHomeScreenCard />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Faturamento Total" value={kpis.totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                <GoalCard current={kpis.totalRevenue} goal={settings.monthlyGoal} selectedMonth={selectedMonth} />
                <StatCard title="Clientes Atendidos" value={kpis.clientsServed.toString()} />
                <StatCard title="Ticket Médio" value={kpis.averageTicket.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h3 className="text-xl font-semibold text-white mb-4">Próximos Agendamentos do Mês</h3>
                    <div className="space-y-4">
                        {upcomingAppointments.length > 0 ? (
                            upcomingAppointments.map(app => (
                                <div key={app.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-md hover:bg-gray-700 transition-colors">
                                    <div className="flex items-center">
                                        <div className="p-2 bg-amber-600/20 rounded-full mr-4">
                                            <ScissorsIcon />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-white">{app.clientName}</p>
                                            <p className="text-sm text-gray-400">{app.services.map(s => s.name).join(', ')}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center text-sm text-amber-400 text-right">
                                        <CalendarIcon />
                                        <span className="ml-2 font-medium">{new Date(app.date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-400">Nenhum agendamento futuro para este mês.</p>
                        )}
                    </div>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h3 className="text-xl font-semibold text-white mb-4">Top 3 Serviços do Mês</h3>
                    {topServices.length > 0 ? (
                        <div style={{ width: '100%', height: 250 }}>
                            <ResponsiveContainer>
                                <BarChart data={topServices} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <XAxis type="number" stroke="#9ca3af" tick={{fontSize: 12}} domain={[0, 'dataMax + 1']}/>
                                    <YAxis 
                                        type="category" 
                                        dataKey="name" 
                                        stroke="#9ca3af" 
                                        axisLine={false} 
                                        tickLine={false}
                                        width={80}
                                        tick={{fontSize: 12}}
                                    />
                                    <Tooltip
                                        cursor={{fill: '#37415180'}}
                                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563', borderRadius: '0.5rem' }}
                                        labelStyle={{ color: '#d1d5db' }}
                                        formatter={(value: number) => [value, "Vendas"]}
                                    />
                                    <Bar dataKey="count" fill="#d97706" barSize={25} radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <p className="text-gray-400 pt-20 text-center">Não há dados de vendas suficientes para exibir o ranking deste mês.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;