
import React, { useState, useRef, useMemo } from 'react';
import { HistoricalDataPoint, Kpis, Service, Appointment, TopServiceData, AppointmentStatus, RevenueByServiceData, Expense, Settings, Professional } from '../types';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getAIAnalytics } from '../services/geminiService';
import { FileTextIcon } from './icons';
// FIX: Changed jsPDF import from default to named import to resolve constructor type error.
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import MonthSelector from './MonthSelector';

interface ReportsProps {
  historicalData: HistoricalDataPoint[];
  fullData: {
    kpis: Kpis;
    services: Service[];
    appointments: Appointment[];
    expenses: Expense[];
    professionals: Professional[];
    settings: Settings;
  };
  revenueByService: RevenueByServiceData[];
  selectedMonth: Date;
  setSelectedMonth: (date: Date) => void;
}

const FormattedAIResponse: React.FC<{ text: string }> = ({ text }) => {
    const parts = text.split(/(\*\*.*?\*\*)/g).filter(part => part);
    return (
        <pre className="text-gray-300 whitespace-pre-wrap font-sans">
            {parts.map((part, index) =>
                part.startsWith('**') && part.endsWith('**')
                    ? <strong key={index}>{part.slice(2, -2)}</strong>
                    : part
            )}
        </pre>
    );
};

type PDFReportProps = {
    fullData: ReportsProps['fullData'],
    revenueByService: RevenueByServiceData[],
    selectedMonth: Date
};

const PDFReport = React.forwardRef<HTMLDivElement, PDFReportProps>(({ fullData, revenueByService, selectedMonth }, ref) => {
    const { kpis, appointments, expenses, settings } = fullData;

    const expenseByCategory = useMemo(() => expenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
    }, {} as Record<string, number>), [expenses]);
    
    return (
        <div ref={ref} className="bg-white text-gray-900 p-8 font-sans" style={{ width: '800px', fontSize: '12px' }}>
            <header className="text-center border-b-2 border-gray-300 pb-4 mb-6">
                <h1 className="text-3xl font-bold">{settings.shopName}</h1>
                <p className="text-gray-600">{settings.shopAddress}</p>
                <h2 className="text-2xl font-semibold mt-4">Relatório Gerencial Mensal</h2>
                <p className="text-lg">Período: {selectedMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</p>
                <p className="text-gray-500 text-sm">Data de Emissão: {new Date().toLocaleDateString('pt-BR')}</p>
            </header>

            <section className="mb-6">
                <h3 className="text-xl font-bold mb-3 border-b pb-2">Resumo Financeiro</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-gray-100 rounded">
                        <h4 className="text-xs font-bold text-gray-500">FATURAMENTO TOTAL</h4>
                        <p className="text-2xl font-bold text-green-700">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(kpis.totalRevenue)}</p>
                    </div>
                    <div className="p-3 bg-gray-100 rounded">
                        <h4 className="text-xs font-bold text-gray-500">DESPESAS TOTAIS</h4>
                        <p className="text-2xl font-bold text-red-700">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(kpis.totalExpenses)}</p>
                    </div>
                    <div className="p-3 bg-gray-100 rounded">
                        <h4 className="text-xs font-bold text-gray-500">LUCRO LÍQUIDO</h4>
                        <p className="text-2xl font-bold text-blue-700">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(kpis.netProfit)}</p>
                    </div>
                </div>
            </section>
            
            <section className="grid grid-cols-2 gap-6 mb-6">
                 <div>
                    <h3 className="text-xl font-bold mb-3 border-b pb-2">Faturamento por Serviço</h3>
                    <table className="w-full text-left">
                        <thead className="bg-gray-100"><tr><th className="p-2">Serviço</th><th className="p-2 text-right">Valor</th></tr></thead>
                        <tbody>
                            {revenueByService.filter(s => s.revenue > 0).map(s => (
                                <tr key={s.name} className="border-b"><td className="p-2">{s.name}</td><td className="p-2 text-right">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(s.revenue)}</td></tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div>
                    <h3 className="text-xl font-bold mb-3 border-b pb-2">Despesas por Categoria</h3>
                     <table className="w-full text-left">
                        <thead className="bg-gray-100"><tr><th className="p-2">Categoria</th><th className="p-2 text-right">Valor</th></tr></thead>
                        <tbody>
                            {Object.entries(expenseByCategory).map(([name, value]) => (
                                // FIX: Cast 'value' to number as Object.entries can infer it as 'unknown'.
                                <tr key={name} className="border-b"><td className="p-2">{name}</td><td className="p-2 text-right">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value as number)}</td></tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

             <section className="mb-6">
                <h3 className="text-xl font-bold mb-3 border-b pb-2">Registro de Vendas do Mês</h3>
                <table className="w-full text-left">
                    <thead className="bg-gray-100"><tr><th className="p-2">Data</th><th className="p-2">Cliente</th><th className="p-2">Serviços</th><th className="p-2 text-right">Valor</th></tr></thead>
                    <tbody>
                        {appointments.filter(app => app.status === AppointmentStatus.COMPLETED).map(app => (
                            <tr key={app.id} className="border-b"><td className="p-2">{new Date(app.date).toLocaleDateString('pt-BR')}</td><td className="p-2">{app.clientName}</td><td className="p-2">{app.services.map(s => s.name).join(', ')}</td><td className="p-2 text-right">{app.finalPrice ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(app.finalPrice) : null}</td></tr>
                        ))}
                    </tbody>
                </table>
            </section>

             <section>
                <h3 className="text-xl font-bold mb-3 border-b pb-2">Registro de Despesas do Mês</h3>
                <table className="w-full text-left">
                    <thead className="bg-gray-100"><tr><th className="p-2">Data</th><th className="p-2">Descrição</th><th className="p-2">Categoria</th><th className="p-2 text-right">Valor</th></tr></thead>
                    <tbody>
                        {expenses.map(exp => (
                            <tr key={exp.id} className="border-b"><td className="p-2">{new Date(exp.date).toLocaleDateString('pt-BR')}</td><td className="p-2">{exp.description}</td><td className="p-2">{exp.category}</td><td className="p-2 text-right">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(exp.amount)}</td></tr>
                        ))}
                    </tbody>
                </table>
            </section>
            
            <footer className="text-center text-gray-500 text-xs mt-8 pt-4 border-t">
                Gerado por EffiSync Manager AI © {new Date().getFullYear()}
            </footer>
        </div>
    );
});


const Reports: React.FC<ReportsProps> = ({ historicalData, fullData, revenueByService, selectedMonth, setSelectedMonth }) => {
    const [prompt, setPrompt] = useState('');
    const [aiResponse, setAiResponse] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const reportRef = useRef<HTMLDivElement>(null);

    const handleAskAI = async () => {
        if (!prompt.trim()) return;
        setIsLoading(true);
        setAiResponse('');
        try {
            const fullPrompt = `${prompt} (Analisar dados referentes a ${selectedMonth.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}).`
            const response = await getAIAnalytics(fullPrompt, fullData.kpis, fullData.services, fullData.appointments);
            setAiResponse(response);
        } catch (error) {
            setAiResponse('Ocorreu um erro ao processar sua pergunta.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleExportPDF = () => {
        const input = reportRef.current;
        if (input) {
            html2canvas(input, { scale: 2 })
                .then((canvas) => {
                    const imgData = canvas.toDataURL('image/png');
                    const pdf = new jsPDF();
                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const imgWidth = canvas.width;
                    const imgHeight = canvas.height;
                    const ratio = pdfWidth / imgWidth;
                    const pdfHeight = imgHeight * ratio;
                    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                    pdf.save(`relatorio_${selectedMonth.toISOString().slice(0, 7)}.pdf`);
                })
                .catch((error) => {
                    console.error("Error generating PDF:", error);
                });
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                <h2 className="text-3xl font-bold text-white">Relatórios e Análise</h2>
                <MonthSelector selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} />
            </div>

            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                    <h3 className="text-xl font-semibold text-white">Faturamento Histórico (Últimos 12 Meses)</h3>
                    <button 
                        onClick={handleExportPDF}
                        className="flex items-center text-sm bg-blue-600/50 text-blue-300 px-3 py-2 rounded-md hover:bg-blue-600/70 transition-colors"
                    >
                        <FileTextIcon className="w-4 h-4 mr-2" />
                        Exportar PDF do Mês
                    </button>
                </div>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <LineChart data={historicalData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="month" stroke="#9ca3af" />
                            <YAxis stroke="#9ca3af" tickFormatter={(value) => `R$${value/1000}k`} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }}
                                labelStyle={{ color: '#d1d5db' }}
                                formatter={(value: number) => [value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), "Faturamento"]}
                            />
                            <Legend wrapperStyle={{ color: '#d1d5db' }} />
                            <Line type="monotone" dataKey="revenue" stroke="#d97706" strokeWidth={2} name="Faturamento"/>
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h3 className="text-xl font-semibold text-white mb-4">Clientes Atendidos por Mês</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <LineChart data={historicalData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="month" stroke="#9ca3af" />
                                <YAxis stroke="#9ca3af" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }}
                                    labelStyle={{ color: '#d1d5db' }}
                                    formatter={(value: number) => [value, "Clientes"]}
                                />
                                <Legend wrapperStyle={{ color: '#d1d5db' }} />
                                <Line type="monotone" dataKey="clientsServed" stroke="#3b82f6" strokeWidth={2} name="Clientes Atendidos"/>
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h3 className="text-xl font-semibold text-white mb-4">Despesas Mensais</h3>
                    <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer>
                            <LineChart data={historicalData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="month" stroke="#9ca3af" />
                                <YAxis stroke="#9ca3af" tickFormatter={(value) => `R$${value/1000}k`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }}
                                    labelStyle={{ color: '#d1d5db' }}
                                    formatter={(value: number) => [value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), "Despesas"]}
                                />
                                <Legend wrapperStyle={{ color: '#d1d5db' }} />
                                <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Despesas"/>
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

             <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold text-white mb-4">Desempenho por Serviço (Mês Selecionado)</h3>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <BarChart data={revenueByService} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 12 }} interval={0} angle={-30} textAnchor="end" height={70} />
                            <YAxis stroke="#9ca3af" tickFormatter={(value) => `R$${value}`} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }}
                                labelStyle={{ color: '#d1d5db' }}
                                formatter={(value: number) => [value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), "Faturamento"]}
                            />
                            <Bar dataKey="revenue" fill="#6366f1" name="Faturamento" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>


            <div className="bg-gray-800 p-6 rounded-lg shadow-lg space-y-4">
                <h3 className="text-xl font-semibold text-white">AI Analítica</h3>
                <p className="text-gray-400">Faça uma pergunta sobre o seu negócio (referente ao mês selecionado) e a nossa AI irá analisar os dados para te dar um insight.</p>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <input
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Ex: Quais serviços devo promover este mês?"
                        className="flex-grow bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-amber-500 focus:border-amber-500"
                        onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
                        disabled={isLoading}
                    />
                    <button 
                        onClick={handleAskAI} 
                        disabled={isLoading}
                        className="bg-amber-600 text-white px-6 py-2 rounded-lg hover:bg-amber-700 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Analisando...' : 'Perguntar à AI'}
                    </button>
                </div>
                { (isLoading || aiResponse) && (
                    <div className="bg-gray-900/50 p-4 rounded-lg mt-4 border border-gray-700 min-h-[100px]">
                        {isLoading && <div className="animate-pulse text-gray-400">Pensando...</div>}
                        {aiResponse && <FormattedAIResponse text={aiResponse} />}
                    </div>
                )}
            </div>
            <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                <PDFReport ref={reportRef} fullData={fullData} selectedMonth={selectedMonth} revenueByService={revenueByService} />
            </div>
        </div>
    );
};

export default Reports;