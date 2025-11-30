
import React, { useState } from 'react';
import { Service } from '../types';
import { PlusIcon, EditIcon, TrashIcon } from './icons';
import Modal from './Modal';

interface ServicesProps {
    services: Service[];
    actions: {
        addService: (service: Omit<Service, 'id'>) => void;
        updateService: (service: Service) => void;
        deleteService: (serviceId: string) => void;
    };
    showNotification: (message: string) => void;
}

const ServiceForm: React.FC<{
    service?: Service | null;
    onSave: (service: Omit<Service, 'id'> | Service) => void;
    onClose: () => void;
}> = ({ service, onSave, onClose }) => {
    const [name, setName] = useState(service?.name || '');
    const [price, setPrice] = useState(service?.price || '');
    const [duration, setDuration] = useState(service?.duration || '');
    const [notes, setNotes] = useState(service?.notes || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const serviceData = { name, price: Number(price), duration: Number(duration), notes };
        if (service?.id) {
            onSave({ ...serviceData, id: service.id });
        } else {
            onSave(serviceData);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Nome do Serviço</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-amber-500 focus:border-amber-500"
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Preço (R$)</label>
                    <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        required
                        step="0.01"
                        min="0"
                        className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-amber-500 focus:border-amber-500"
                    />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Tempo (minutos)</label>
                    <input
                        type="number"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        required
                        min="5"
                        placeholder="Ex: 30"
                        className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-amber-500 focus:border-amber-500"
                    />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Observações (Opcional)</label>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Ex: Requer agendamento prévio, produtos especiais utilizados, etc."
                    className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-amber-500 focus:border-amber-500"
                />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onClose} className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-500">
                    Cancelar
                </button>
                <button type="submit" className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700">
                    Salvar
                </button>
            </div>
        </form>
    );
};

const Services: React.FC<ServicesProps> = ({ services, actions, showNotification }) => {
    const [isFormModalOpen, setFormModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
    const [deleteReason, setDeleteReason] = useState('');

    const openAddModal = () => {
        setEditingService(null);
        setFormModalOpen(true);
    };

    const openEditModal = (service: Service) => {
        setEditingService(service);
        setFormModalOpen(true);
    };

    const handleSaveService = (serviceData: Omit<Service, 'id'> | Service) => {
        if ('id' in serviceData) {
            actions.updateService(serviceData as Service);
            showNotification('Serviço atualizado com sucesso!');
        } else {
            actions.addService(serviceData as Omit<Service, 'id'>);
            showNotification('Serviço adicionado com sucesso!');
        }
        setFormModalOpen(false);
    };
    
    const handleDeleteClick = (service: Service) => {
        setServiceToDelete(service);
        setIsDeleteModalOpen(true);
    };

    const handleCancelDelete = () => {
        setIsDeleteModalOpen(false);
        setServiceToDelete(null);
        setDeleteReason('');
    };

    const handleConfirmDelete = () => {
        if (serviceToDelete) {
            actions.deleteService(serviceToDelete.id);
            showNotification('Serviço excluído com sucesso!');
            handleCancelDelete();
        }
    };


    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                <h2 className="text-2xl md:text-3xl font-bold text-white">Serviços</h2>
                <button onClick={openAddModal} className="w-full md:w-auto flex items-center justify-center bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors">
                    <PlusIcon />
                    Novo Serviço
                </button>
            </div>

            <div className="bg-gray-800 rounded-lg shadow-lg">
                {/* Desktop Header */}
                <div className="hidden md:grid md:grid-cols-6 gap-4 p-4 border-b border-gray-700 text-sm font-semibold text-gray-400">
                    <div className="col-span-3">Nome do Serviço</div>
                    <div className="text-center">Valor</div>
                    <div className="text-center">Tempo Estimado</div>
                    <div className="text-center">Ações</div>
                </div>
                {/* Service List */}
                <div className="md:divide-y md:divide-gray-700/50">
                    {services.map((service) => (
                        <div key={service.id} className="p-4 border-b border-gray-700/50 md:border-0 md:grid md:grid-cols-6 md:gap-4 items-center hover:bg-gray-700/40">
                            {/* Col 1: Name (Desktop: col-span-3) */}
                            <div className="md:col-span-3">
                                <p className="font-medium text-white">{service.name}</p>
                                {service.notes && <p className="text-sm text-gray-400 mt-1">{service.notes}</p>}
                            </div>

                            {/* Mobile info block */}
                            <div className="flex justify-between items-center mt-3 md:hidden">
                                <div className="text-center">
                                    <p className="text-xs text-gray-400 uppercase">Valor</p>
                                    <p className="font-semibold text-white">{service.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-gray-400 uppercase">Tempo</p>
                                    <p className="font-semibold text-gray-300">{service.duration} min</p>
                                </div>
                                <div className="flex space-x-3">
                                    <button onClick={() => openEditModal(service)} className="text-gray-400 hover:text-amber-400 p-1"><EditIcon /></button>
                                    <button onClick={() => handleDeleteClick(service)} className="text-gray-400 hover:text-red-400 p-1"><TrashIcon /></button>
                                </div>
                            </div>

                            {/* Col 2: Price (Desktop only) */}
                            <div className="hidden md:block text-center font-semibold text-white">
                                {service.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>

                            {/* Col 3: Duration (Desktop only) */}
                            <div className="hidden md:block text-center text-gray-300">
                                {service.duration} min
                            </div>
                            
                            {/* Col 4: Actions (Desktop only) */}
                            <div className="hidden md:flex justify-center">
                                <div className="flex space-x-3">
                                    <button onClick={() => openEditModal(service)} className="text-gray-400 hover:text-amber-400"><EditIcon /></button>
                                    <button onClick={() => handleDeleteClick(service)} className="text-gray-400 hover:text-red-400"><TrashIcon /></button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <Modal isOpen={isFormModalOpen} onClose={() => setFormModalOpen(false)} title={editingService ? 'Editar Serviço' : 'Novo Serviço'}>
                <ServiceForm
                    service={editingService}
                    onSave={handleSaveService}
                    onClose={() => setFormModalOpen(false)}
                />
            </Modal>
            
            <Modal isOpen={isDeleteModalOpen} onClose={handleCancelDelete} title="Confirmar Exclusão de Serviço">
                {serviceToDelete && (
                    <div className="space-y-4">
                        <p className="text-gray-300">
                            Você tem certeza que deseja excluir o serviço <strong className="text-white">{serviceToDelete.name}</strong>? Esta ação não pode ser desfeita.
                        </p>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Motivo da Exclusão</label>
                            <textarea
                                value={deleteReason}
                                onChange={(e) => setDeleteReason(e.target.value)}
                                rows={3}
                                placeholder="Ex: Serviço não é mais oferecido."
                                className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-amber-500 focus:border-amber-500"
                                required
                            />
                        </div>
                        <div className="flex justify-end space-x-3 pt-4">
                            <button type="button" onClick={handleCancelDelete} className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-500">
                                Cancelar
                            </button>
                            <button 
                                type="button" 
                                onClick={handleConfirmDelete} 
                                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-red-900 disabled:cursor-not-allowed"
                                disabled={!deleteReason.trim()}
                            >
                                Confirmar Exclusão
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Services;
