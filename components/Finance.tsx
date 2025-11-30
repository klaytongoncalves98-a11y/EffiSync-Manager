

import React, { useState, useMemo } from 'react';
import { Expense, Kpis, Appointment, AppointmentStatus, HistoricalDataPoint } from '../types';
import { PlusIcon, EditIcon, TrashIcon } from './icons';
import Modal from './Modal';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import MonthSelector from './MonthSelector';

interface FinanceProps {
    expenses: Expense[];
    appointments: Appointment[];
    kpis: Kpis;
    actions: {
        addExpense: (expense: Omit<Expense, 'id'>) => void;
        updateExpense: (expense: Expense) => void;
        deleteExpense: (expenseId: string) => void;
    };
    showNotification: (message: string) => void;
    selectedMonth: Date;
    setSelectedMonth: (date: Date) => void;
    historicalData: HistoricalDataPoint[];
}

const ExpenseForm: React.FC<{
    expense?: Expense | null;
    onSave: (expense: Omit<Expense, 'id'> | Expense) => void;
    onClose: () => void;
}> = ({ expense, onSave, onClose }) => {
    const [description, setDescription] = useState(expense?.description || '');
    const [category, setCategory] = useState(expense?.category || 'Outros');
    const [amount, setAmount] = useState(expense?.amount || '');
    const [date, setDate] = useState(expense?.date ? expense.date.split('T')[0] : new Date().toISOString().split('T')[0]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const expenseData = {
            description,
            category: category as Expense['category'],
            amount: Number(amount),
            date: new Date(date).toISOString(),
        };

        if (expense?.id) {
            onSave({ ...expenseData, id: expense.id });
        } else {
            onSave(expenseData);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Descrição</label>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} required className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Categoria</label>
                    {/* FIX: Cast e.target.value to the specific Expense['category'] union type to satisfy TypeScript. */}
                    <select value={category} onChange={(e) => setCategory(e.target.value as Expense['category'])} required className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600">
                        <option>Aluguel</option>
                        <option>Contas</option>
                        <option>Suprimentos</option>
                        <option>Marketing</option>
                        <option>Imposto</option>
                        <option>Salário</option>
                        <option>Outros</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Valor (R$)</label>
                    <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required step="0.01" min="0" className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600" />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Data</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600" />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onClose} className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-500">Cancelar</button>
                <button type="submit" className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700">Salvar</button>
            </div>
        </form>
    );
};


const Finance: React.FC<FinanceProps> = ({ expenses, appointments, kpis, actions, showNotification, selectedMonth, setSelectedMonth, historicalData }) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

    const completedAppointments = useMemo(() =>
        appointments
            .filter(a => a.status === AppointmentStatus.COMPLETED)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [appointments]);

    const openAddModal = () => {
        setEditingExpense(null);
        setModalOpen(true);
    };

    const openEditModal = (expense: Expense) => {
        setEditingExpense(expense);
        setModalOpen(true);
    };

    const handleSaveExpense = (expenseData: Omit<Expense, 'id'> | Expense) => {
        if ('id' in expenseData) {
            actions.updateExpense(expenseData as Expense);
            showNotification('Despesa atualizada com sucesso!');
        } else {
            actions.addExpense(expenseData as Omit<Expense, 'id'>);
            showNotification('Despesa adicionada com sucesso!');
        }
        setModalOpen(false);
    };
    
    const handleDelete = (expenseId: string) => {
        actions.deleteExpense(expenseId);
        showNotification('Despesa excluída com sucesso!');
    };
    
    const expenseByCategory = useMemo(() => expenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
    }, {} as Record<string, number>), [expenses]);

    const expensePieData = Object.entries(expenseByCategory).map(([name, value]) => ({ name, value }));
    const EXPENSE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#a855f7'];
    
    const financialOverviewData = useMemo(() => {
        if (kpis.netProfit >= 0) {
            return [
                { name: 'Despesas Totais', value: kpis.totalExpenses },
                { name: 'Lucro Líquido', value: kpis.netProfit },
            ];
        }
        // In case of a loss, the pie chart represents the total revenue,
        // which is entirely consumed by expenses.
        return [{ name: 'Receita Consumida por Despesas', value: kpis.totalRevenue }];
    }, [kpis]);

    const OVERVIEW_COLORS = useMemo(() => {
         if (kpis.netProfit >= 0) {
            return ['#ef4444', '#3b82f6']; // Red for expenses, Blue for profit.
        }
        return ['#ef4444']; // Red for expenses that consumed revenue.
    }, [kpis.netProfit]);


    const getProfitEmoji = (profit: number) => {
        if (profit > 500) return '🚀';
        if (profit > 0) return '😄';
        if (profit === 0) return '😐';
        return '😢';
    };


    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                <h2 className="text-2xl md:text-3xl font-bold text-white">Financeiro</h2>
                <MonthSelector selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-green-500/10 border border-green-500/30 p-6 rounded-lg shadow-lg">
                    <h3 className="text-green-300 text-sm font-medium uppercase tracking-wider">Faturamento Total</h3>
                    <p className="text-2xl md:text-3xl font-bold text-white mt-2">{kpis.totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                </div>
                <div className="bg-red-500/10 border border-red-500/30 p-6 rounded-lg shadow-lg">
                    <h3 className="text-red-300 text-sm font-medium uppercase tracking-wider">Despesas Totais</h3>
                    <p className="text-2xl md:text-3xl font-bold text-white mt-2">{kpis.totalExpenses.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                </div>
                <div className="bg-sky-500/10 border border-sky-500/30 p-6 rounded-lg shadow-lg">
                    <h3 className="text-sky-300 text-sm font-medium uppercase tracking-wider">Lucro Líquido</h3>
                    <p className="text-2xl md:text-3xl font-bold text-white mt-2 flex items-center">
                        <span>{kpis.netProfit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        <span className="ml-2 text-2xl" title={`Situação Financeira: ${kpis.netProfit > 0 ? 'Positiva' : kpis.netProfit < 0 ? 'Negativa' : 'Neutra'}`}>{getProfitEmoji(kpis.netProfit)}</span>
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="bg-gray-800 p-4 md:p-6 rounded-lg shadow-lg">
                    <h3 className="text-xl font-semibold text-white mb-4">Registro de Vendas</h3>
                    <div className="max-h-96 overflow-y-auto">
                        {/* Desktop Table */}
                        <table className="w-full text-left hidden md:table">
                            <thead className="border-b border-gray-700 text-sm text-gray-400 sticky top-0 bg-gray-800">
                                <tr>
                                    <th className="p-3">Cliente</th>
                                    <th className="p-3">Serviços</th>
                                    <th className="p-3">Valor</th>
                                    <th className="p-3">Data</th>
                                </tr>
                            </thead>
                            <tbody>
                                {completedAppointments.map((sale) => (
                                    <tr key={sale.id} className="border-b border-gray-700/50 hover:bg-gray-700/40">
                                        <td className="p-3 font-medium text-white">{sale.clientName}</td>
                                        <td className="p-3 text-sm">{sale.services.map(s => s.name).join(', ')}</td>
                                        <td className="p-3 text-green-400">{sale.finalPrice?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                        <td className="p-3">{new Date(sale.date).toLocaleDateString('pt-BR')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {/* Mobile List */}
                        <div className="md:hidden space-y-3">
                           {completedAppointments.map((sale) => (
                               <div key={sale.id} className="bg-gray-700/50 p-3 rounded-lg">
                                   <div className="flex justify-between items-start">
                                       <div>
                                           <p className="font-bold text-white">{sale.clientName}</p>
                                           <p className="text-xs text-gray-400">{new Date(sale.date).toLocaleDateString('pt-BR')}</p>
                                       </div>
                                       <p className="font-semibold text-green-400">{sale.finalPrice?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                   </div>
                                   <p className="mt-2 text-sm text-gray-300">{sale.services.map(s => s.name).join(', ')}</p>
                               </div>
                           ))}
                        </div>
                    </div>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg flex flex-col">
                    <h3 className="text-xl font-semibold text-white">Visão Geral Financeira</h3>
                    <div className="text-center my-2">
                        <p className="text-gray-400 text-sm uppercase tracking-wider">Faturamento Total do Mês</p>
                        <p className="text-3xl font-bold text-green-400 mt-1">
                            {kpis.totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                    </div>
                    <div className="flex-grow w-full h-full" style={{minHeight: '280px'}}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie data={financialOverviewData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                                    const RADIAN = Math.PI / 180;
                                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                    return (
                                        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                                            {`${(percent * 100).toFixed(0)}%`}
                                        </text>
                                    );
                                }}>
                                    {financialOverviewData.map((entry, index) => <Cell key={`cell-${index}`} fill={OVERVIEW_COLORS[index % OVERVIEW_COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }} formatter={(value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/>
                                <Legend wrapperStyle={{paddingTop: '20px'}}/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-gray-800 p-4 md:p-6 rounded-lg shadow-lg">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                        <h3 className="text-xl font-semibold text-white">Registro de Despesas</h3>
                        <button onClick={openAddModal} className="w-full md:w-auto flex items-center justify-center bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors">
                            <PlusIcon />
                            Nova Despesa
                        </button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {/* Desktop Table */}
                        <table className="w-full text-left hidden md:table">
                            <thead className="border-b border-gray-700 text-sm text-gray-400 sticky top-0 bg-gray-800">
                                <tr>
                                    <th className="p-3">Descrição</th>
                                    <th className="p-3">Categoria</th>
                                    <th className="p-3">Valor</th>
                                    <th className="p-3">Data</th>
                                    <th className="p-3"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.map((expense) => (
                                    <tr key={expense.id} className="border-b border-gray-700/50 hover:bg-gray-700/40">
                                        <td className="p-3 font-medium text-white">{expense.description}</td>
                                        <td className="p-3"><span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-700">{expense.category}</span></td>
                                        <td className="p-3 text-red-400">{expense.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                                        <td className="p-3">{new Date(expense.date).toLocaleDateString('pt-BR')}</td>
                                        <td className="p-3">
                                            <div className="flex justify-end space-x-3">
                                                <button onClick={() => openEditModal(expense)} className="text-gray-400 hover:text-amber-400"><EditIcon className="w-4 h-4" /></button>
                                                <button onClick={() => handleDelete(expense.id)} className="text-gray-400 hover:text-red-400"><TrashIcon className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {/* Mobile List */}
                        <div className="md:hidden space-y-3">
                           {expenses.map((expense) => (
                               <div key={expense.id} className="bg-gray-700/50 p-3 rounded-lg">
                                   <div className="flex justify-between items-start">
                                       <div>
                                           <p className="font-bold text-white">{expense.description}</p>
                                           <p className="text-xs text-gray-400">{new Date(expense.date).toLocaleDateString('pt-BR')}</p>
                                       </div>
                                       <p className="font-semibold text-red-400">{expense.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                   </div>
                                   <div className="mt-2 flex justify-between items-center">
                                       <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-700">{expense.category}</span>
                                        <div className="flex space-x-3">
                                            <button onClick={() => openEditModal(expense)} className="text-gray-400 hover:text-amber-400 p-1"><EditIcon className="w-4 h-4" /></button>
                                            <button onClick={() => handleDelete(expense.id)} className="text-gray-400 hover:text-red-400 p-1"><TrashIcon className="w-4 h-4" /></button>
                                        </div>
                                   </div>
                               </div>
                           ))}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 bg-gray-800 p-6 rounded-lg shadow-lg">
                    <h3 className="text-xl font-semibold text-white mb-4">Despesas por Categoria</h3>
                    <div style={{ width: '100%', height: 350 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie data={expensePieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8">
                                    {expensePieData.map((entry, index) => <Cell key={`cell-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }} formatter={(value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
            
            <div className="bg-gray-800 p-4 md:p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold text-white mb-4">Lucratividade Mensal (Últimos 12 Meses)</h3>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <BarChart data={historicalData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="month" stroke="#9ca3af" />
                            <YAxis stroke="#9ca3af" tickFormatter={(value) => `R$${Number(value) / 1000}k`} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }}
                                labelStyle={{ color: '#d1d5db' }}
                                formatter={(value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            />
                            <Legend wrapperStyle={{ paddingTop: '10px' }}/>
                            <Bar dataKey="revenue" fill="#3b82f6" name="Faturamento" />
                            <Bar dataKey="expenses" fill="#ef4444" name="Despesas" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title={editingExpense ? 'Editar Despesa' : 'Nova Despesa'}>
                <ExpenseForm expense={editingExpense} onSave={handleSaveExpense} onClose={() => setModalOpen(false)} />
            </Modal>
        </div>
    );
};

export default Finance;