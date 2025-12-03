
import React, { useState } from 'react';
import { Product, Client } from '../types';
import { PlusIcon, EditIcon, TrashIcon, ShoppingBagIcon } from './icons';
import Modal from './Modal';

interface ProductsProps {
    products: Product[];
    clients: Client[];
    actions: {
        addProduct: (product: Omit<Product, 'id'>) => void;
        updateProduct: (product: Product) => void;
        deleteProduct: (productId: string) => void;
        sellProduct: (productId: string, clientName: string, quantity: number) => void;
    };
    showNotification: (message: string) => void;
}

const ProductForm: React.FC<{
    product?: Product | null;
    onSave: (product: Omit<Product, 'id'> | Product) => void;
    onClose: () => void;
}> = ({ product, onSave, onClose }) => {
    const [name, setName] = useState(product?.name || '');
    const [price, setPrice] = useState(product?.price || '');
    const [quantity, setQuantity] = useState(product?.quantity || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const productData = { name, price: Number(price), quantity: Number(quantity) };
        if (product?.id) {
            onSave({ ...productData, id: product.id });
        } else {
            onSave(productData);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Nome do Produto</label>
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
                    <label className="block text-sm font-medium text-gray-300 mb-1">Quantidade em Estoque</label>
                    <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        required
                        min="0"
                        className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-amber-500 focus:border-amber-500"
                    />
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

const SellProductForm: React.FC<{
    product: Product;
    clients: Client[];
    onSell: (productId: string, clientName: string, quantity: number) => void;
    onClose: () => void;
}> = ({ product, clients, onSell, onClose }) => {
    const [selectedClient, setSelectedClient] = useState('');
    const [sellQuantity, setSellQuantity] = useState(1);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSell(product.id, selectedClient, Number(sellQuantity));
    };

    const total = product.price * Number(sellQuantity);

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-gray-700 p-3 rounded text-sm text-gray-300">
                Produto: <strong className="text-white">{product.name}</strong> <br />
                Estoque Atual: <strong className="text-white">{product.quantity}</strong>
            </div>
            
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Cliente</label>
                <select
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                    required
                    className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-amber-500 focus:border-amber-500"
                >
                    <option value="" disabled>Selecione um cliente</option>
                    {clients.map(client => (
                        <option key={client.id} value={client.name}>{client.name}</option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Quantidade</label>
                <input
                    type="number"
                    value={sellQuantity}
                    onChange={(e) => setSellQuantity(Number(e.target.value))}
                    required
                    min="1"
                    max={product.quantity}
                    className="w-full bg-gray-700 text-white p-2 rounded-md border border-gray-600 focus:ring-amber-500 focus:border-amber-500"
                />
            </div>

            <div className="text-right text-lg font-bold text-green-400 pt-2 border-t border-gray-600">
                Total: {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onClose} className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-500">
                    Cancelar
                </button>
                <button type="submit" disabled={product.quantity < 1} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed">
                    Confirmar Venda
                </button>
            </div>
        </form>
    );
}

const Products: React.FC<ProductsProps> = ({ products, clients, actions, showNotification }) => {
    const [isFormModalOpen, setFormModalOpen] = useState(false);
    const [isSellModalOpen, setSellModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [sellingProduct, setSellingProduct] = useState<Product | null>(null);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);

    const openAddModal = () => {
        setEditingProduct(null);
        setFormModalOpen(true);
    };

    const openEditModal = (product: Product) => {
        setEditingProduct(product);
        setFormModalOpen(true);
    };

    const openSellModal = (product: Product) => {
        setSellingProduct(product);
        setSellModalOpen(true);
    };

    const handleSaveProduct = (productData: Omit<Product, 'id'> | Product) => {
        if ('id' in productData) {
            actions.updateProduct(productData as Product);
            showNotification('Produto atualizado com sucesso!');
        } else {
            actions.addProduct(productData as Omit<Product, 'id'>);
            showNotification('Produto adicionado com sucesso!');
        }
        setFormModalOpen(false);
    };

    const handleSellProduct = (productId: string, clientName: string, quantity: number) => {
        actions.sellProduct(productId, clientName, quantity);
        showNotification('Venda realizada com sucesso! Estoque atualizado.');
        setSellModalOpen(false);
    }
    
    const handleDeleteClick = (product: Product) => {
        setProductToDelete(product);
        setIsDeleteModalOpen(true);
    };

    const handleConfirmDelete = () => {
        if (productToDelete) {
            actions.deleteProduct(productToDelete.id);
            showNotification('Produto excluído com sucesso!');
            setIsDeleteModalOpen(false);
            setProductToDelete(null);
        }
    };


    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                <h2 className="text-2xl md:text-3xl font-bold text-white">Produtos</h2>
                <button onClick={openAddModal} className="w-full md:w-auto flex items-center justify-center bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors">
                    <PlusIcon />
                    Novo Produto
                </button>
            </div>

            <div className="bg-gray-800 rounded-lg shadow-lg">
                {/* Desktop Header */}
                <div className="hidden md:grid md:grid-cols-6 gap-4 p-4 border-b border-gray-700 text-sm font-semibold text-gray-400">
                    <div className="col-span-2">Nome do Produto</div>
                    <div className="text-center">Preço</div>
                    <div className="text-center">Quantidade</div>
                    <div className="col-span-2 text-center">Ações</div>
                </div>
                {/* Product List */}
                <div className="md:divide-y md:divide-gray-700/50">
                    {products.map((product) => (
                        <div key={product.id} className="p-4 border-b border-gray-700/50 md:border-0 md:grid md:grid-cols-6 md:gap-4 items-center hover:bg-gray-700/40">
                            {/* Col 1: Name (Desktop: col-span-2) */}
                            <div className="md:col-span-2">
                                <p className="font-medium text-white">{product.name}</p>
                            </div>

                            {/* Mobile info block */}
                            <div className="flex justify-between items-center mt-3 md:hidden">
                                <div className="text-center">
                                    <p className="text-xs text-gray-400 uppercase">Preço</p>
                                    <p className="font-semibold text-white">{product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-gray-400 uppercase">Estoque</p>
                                    <p className={`font-semibold ${product.quantity < 5 ? 'text-red-400' : 'text-gray-300'}`}>{product.quantity}</p>
                                </div>
                            </div>
                            
                            {/* Mobile Actions */}
                            <div className="flex justify-between items-center mt-4 md:hidden gap-2">
                                 <button 
                                    onClick={() => openSellModal(product)} 
                                    disabled={product.quantity === 0}
                                    className="flex-grow bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center"
                                 >
                                     <ShoppingBagIcon className="w-4 h-4 mr-1"/> Vender
                                 </button>
                                <div className="flex space-x-2">
                                    <button onClick={() => openEditModal(product)} className="text-gray-400 hover:text-amber-400 p-2 bg-gray-700 rounded"><EditIcon className="w-4 h-4" /></button>
                                    <button onClick={() => handleDeleteClick(product)} className="text-gray-400 hover:text-red-400 p-2 bg-gray-700 rounded"><TrashIcon className="w-4 h-4" /></button>
                                </div>
                            </div>

                            {/* Col 2: Price (Desktop only) */}
                            <div className="hidden md:block text-center font-semibold text-white">
                                {product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>

                            {/* Col 3: Quantity (Desktop only) */}
                            <div className={`hidden md:block text-center font-semibold ${product.quantity < 5 ? 'text-red-400' : 'text-gray-300'}`}>
                                {product.quantity}
                            </div>
                            
                            {/* Col 4: Actions (Desktop only) */}
                            <div className="hidden md:flex md:col-span-2 justify-center items-center gap-3">
                                <button 
                                    onClick={() => openSellModal(product)}
                                    disabled={product.quantity === 0} 
                                    className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed flex items-center transition-colors"
                                >
                                    <ShoppingBagIcon className="w-4 h-4 mr-1"/> Vender
                                </button>
                                <div className="h-6 w-px bg-gray-600 mx-1"></div>
                                <button onClick={() => openEditModal(product)} className="text-gray-400 hover:text-amber-400 p-1 rounded hover:bg-gray-700"><EditIcon /></button>
                                <button onClick={() => handleDeleteClick(product)} className="text-gray-400 hover:text-red-400 p-1 rounded hover:bg-gray-700"><TrashIcon /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <Modal isOpen={isFormModalOpen} onClose={() => setFormModalOpen(false)} title={editingProduct ? 'Editar Produto' : 'Novo Produto'}>
                <ProductForm
                    product={editingProduct}
                    onSave={handleSaveProduct}
                    onClose={() => setFormModalOpen(false)}
                />
            </Modal>

            <Modal isOpen={isSellModalOpen} onClose={() => setSellModalOpen(false)} title="Vender Produto">
                {sellingProduct && (
                    <SellProductForm 
                        product={sellingProduct}
                        clients={clients}
                        onSell={handleSellProduct}
                        onClose={() => setSellModalOpen(false)}
                    />
                )}
            </Modal>
            
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirmar Exclusão">
                {productToDelete && (
                    <div className="space-y-4">
                        <p className="text-gray-300">
                            Você tem certeza que deseja excluir o produto <strong className="text-white">{productToDelete.name}</strong>?
                        </p>
                        <div className="flex justify-end space-x-3 pt-4">
                            <button type="button" onClick={() => setIsDeleteModalOpen(false)} className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-500">
                                Cancelar
                            </button>
                            <button 
                                type="button" 
                                onClick={handleConfirmDelete} 
                                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
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

export default Products;
