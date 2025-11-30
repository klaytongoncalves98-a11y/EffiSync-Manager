import React, { useState, useRef } from 'react';
import { Professional } from '../types';
import { PlusIcon, EditIcon, TrashIcon, ChevronDownIcon, ScheduleIcon, UserIcon } from './icons';
import Modal from './Modal';

interface ProfessionalsProps {
    professionals: Professional[];
    actions: {
        addProfessional: (professional: Omit<Professional, 'id'>) => void;
        updateProfessional: (professional: Professional) => void;
        deleteProfessional: (professionalId: string) => void;
    };
    showNotification: (message: string) => void;
    onViewSchedule: (professionalId: string) => void;
}

const ProfessionalForm: React.FC<{
    professional?: Professional | null;
    onSave: (professional: Omit<Professional, 'id'> | Professional) => void;
    onClose: () => void;
}> = ({ professional, onSave, onClose }) => {
    const [name, setName] = useState(professional?.name || '');
    const [specialty, setSpecialty] = useState(professional?.specialty || '');
    const [imageUrl, setImageUrl] = useState(professional?.imageUrl || '');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const professionalData = { name, specialty, imageUrl };
        if (professional?.id) {
            onSave({ ...professionalData, id: professional.id });
        } else {
            onSave(professionalData);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Nome do Profissional</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-amber-500 focus:border-amber-500"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Especialidade</label>
                <input
                    type="text"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    required
                    placeholder="Ex: Barbeiro Sênior, Estagiário..."
                    className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-amber-500 focus:border-amber-500"
                />
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Imagem do Perfil</label>
                <div className="flex items-center space-x-4">
                    <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden border-2 border-gray-600">
                        {imageUrl ? (
                            <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <UserIcon className="w-12 h-12 text-gray-500" />
                        )}
                    </div>
                    <div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            accept="image/*"
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-500 text-sm transition-colors"
                        >
                            Carregar Imagem
                        </button>
                        <p className="text-xs text-gray-400 mt-2">Use uma imagem quadrada para melhores resultados.</p>
                    </div>
                </div>
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

const Professionals: React.FC<ProfessionalsProps> = ({ professionals, actions, showNotification, onViewSchedule }) => {
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingProfessional, setEditingProfessional] = useState<Professional | null>(null);
    const [expandedProfessional, setExpandedProfessional] = useState<string | null>(null);

    const toggleProfessional = (professionalId: string) => {
        setExpandedProfessional(prev => (prev === professionalId ? null : professionalId));
    };

    const openAddModal = () => {
        setEditingProfessional(null);
        setModalOpen(true);
    };

    const openEditModal = (e: React.MouseEvent, professional: Professional) => {
        e.stopPropagation();
        setEditingProfessional(professional);
        setModalOpen(true);
    };

    const handleSaveProfessional = (professionalData: Omit<Professional, 'id'> | Professional) => {
        if ('id' in professionalData) {
            actions.updateProfessional(professionalData as Professional);
            showNotification('Profissional atualizado com sucesso!');
        } else {
            actions.addProfessional(professionalData as Omit<Professional, 'id'>);
            showNotification('Profissional adicionado com sucesso!');
        }
        setModalOpen(false);
    };
    
    const handleDelete = (e: React.MouseEvent, professionalId: string) => {
        e.stopPropagation();
        actions.deleteProfessional(professionalId);
        showNotification('Profissional excluído com sucesso!');
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                <h2 className="text-2xl md:text-3xl font-bold text-white">Profissionais</h2>
                <button onClick={openAddModal} className="w-full md:w-auto flex items-center justify-center bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors">
                    <PlusIcon />
                    Novo Profissional
                </button>
            </div>

            <div className="bg-gray-800 rounded-lg shadow-lg">
                {/* Desktop Header */}
                <div className="hidden md:flex p-4 border-b border-gray-700 text-sm text-gray-400 items-center font-semibold">
                    <div className="flex-grow pl-8">Nome do Profissional</div>
                    <div className="w-48">Especialidade</div>
                    <div className="w-24 text-center">Ações</div>
                </div>
                {/* Professionals List */}
                 <div className="space-y-1 md:space-y-0">
                    {professionals.map((professional) => (
                        <div key={professional.id} className="bg-gray-800 hover:bg-gray-700/50 md:border-b md:border-gray-700/50">
                            <div className="flex flex-col md:flex-row items-start md:items-center w-full text-left p-4 cursor-pointer" onClick={() => toggleProfessional(professional.id)}>
                                <div className="flex-grow flex items-center w-full">
                                    <ChevronDownIcon className={`w-5 h-5 mr-3 transition-transform duration-300 ${expandedProfessional === professional.id ? 'rotate-180' : ''}`} />
                                    {professional.imageUrl ? (
                                        <img src={professional.imageUrl} alt={professional.name} className="w-10 h-10 rounded-full mr-4 object-cover" />
                                     ) : (
                                        <div className="w-10 h-10 rounded-full mr-4 bg-gray-700 flex items-center justify-center">
                                            <UserIcon className="w-6 h-6 text-gray-400" />
                                        </div>
                                     )}
                                    <span className="font-medium text-white">{professional.name}</span>
                                </div>
                                <div className="w-full md:w-48 flex justify-between items-center mt-2 md:mt-0 pl-16 md:pl-0">
                                    <span className="text-sm text-gray-400 md:hidden">Especialidade:</span>
                                    <span className="text-gray-300">{professional.specialty}</span>
                                </div>
                                <div className="w-full md:w-24 flex justify-end md:justify-center mt-2 md:mt-0">
                                    <div className="flex justify-center space-x-3">
                                        <button onClick={(e) => openEditModal(e, professional)} className="text-gray-400 hover:text-amber-400 p-2 rounded-full hover:bg-gray-700"><EditIcon className="w-5 h-5" /></button>
                                        <button onClick={(e) => handleDelete(e, professional.id)} className="text-gray-400 hover:text-red-400 p-2 rounded-full hover:bg-gray-700"><TrashIcon className="w-5 h-5"/></button>
                                    </div>
                                </div>
                            </div>
                            {expandedProfessional === professional.id && (
                                <div className="px-6 pb-6 pt-2 bg-gray-900/50 animate-fade-in-down">
                                    <div className="border-t border-gray-700 pt-4">
                                        <button 
                                            onClick={() => onViewSchedule(professional.id)}
                                            className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                        >
                                            <ScheduleIcon className="w-4 h-4 mr-2" />
                                            Ver Agenda
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title={editingProfessional ? 'Editar Profissional' : 'Novo Profissional'}>
                <ProfessionalForm
                    professional={editingProfessional}
                    onSave={handleSaveProfessional}
                    onClose={() => setModalOpen(false)}
                />
            </Modal>
        </div>
    );
};

export default Professionals;