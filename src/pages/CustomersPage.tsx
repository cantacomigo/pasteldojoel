"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { StorageService } from '@/services/storageService';
import { MonthlyCustomer, CashTransactionType } from '@/types';
import { 
  Users, Plus, Search, Phone, DollarSign, Trash2, 
  ChevronRight, ArrowUpRight, History, CheckCircle2,
  AlertCircle, X
} from 'lucide-react';

const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<MonthlyCustomer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<MonthlyCustomer | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  
  // Pay Form State
  const [payAmount, setPayAmount] = useState('');

  const loadCustomers = async () => {
    const data = await StorageService.getCustomers();
    setCustomers(data);
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone && c.phone.includes(searchTerm))
    ).sort((a, b) => b.balance - a.balance);
  }, [customers, searchTerm]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newCustomer: MonthlyCustomer = {
      id: selectedCustomer?.id || StorageService.generateId(),
      name: name.trim(),
      phone: phone.trim(),
      balance: selectedCustomer?.balance || 0
    };

    await StorageService.saveCustomer(newCustomer);
    alert(selectedCustomer ? 'Cliente atualizado!' : 'Cliente cadastrado!');
    setIsModalOpen(false);
    resetForm();
    loadCustomers();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente excluir este cliente?')) {
      await StorageService.deleteCustomer(id);
      alert('Cliente removido');
      loadCustomers();
    }
  };

  const handlePayBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !payAmount) return;

    const amount = parseFloat(payAmount);
    if (isNaN(amount) || amount <= 0) return;

    // 1. Update customer balance
    const updatedCustomer = {
      ...selectedCustomer,
      balance: Math.max(0, selectedCustomer.balance - amount)
    };
    await StorageService.saveCustomer(updatedCustomer);

    // 2. Register transaction in cash register
    const currentSession = await StorageService.getCurrentSession();
    if (currentSession) {
      await StorageService.addTransaction(currentSession.id, {
        type: CashTransactionType.SUPPLY,
        amount: amount,
        reason: `Pagamento Mensalista: ${selectedCustomer.name}`
      });
    }

    alert('Pagamento registrado!');
    setIsPayModalOpen(false);
    setPayAmount('');
    setSelectedCustomer(null);
    loadCustomers();
  };

  const resetForm = () => {
    setName('');
    setPhone('');
    setSelectedCustomer(null);
  };

  const openEdit = (c: MonthlyCustomer) => {
    setSelectedCustomer(c);
    setName(c.name);
    setPhone(c.phone || '');
    setIsModalOpen(true);
  };

  const openPay = (c: MonthlyCustomer) => {
    setSelectedCustomer(c);
    setPayAmount(c.balance.toFixed(2));
    setIsPayModalOpen(true);
  };

  const totalOwed = customers.reduce((sum, c) => sum + c.balance, 0);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 font-display uppercase italic tracking-tighter">
            Gestão de <span className="text-brand-600 underline decoration-brand-500/30">Mensalistas</span>
          </h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2">
            Controle de fiado e pagamentos mensais
          </p>
        </div>

        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center gap-3 bg-brand-600 text-white text-[11px] font-black uppercase tracking-widest px-8 py-4 rounded-2xl hover:bg-brand-500 transition-all shadow-lg shadow-brand-900/20 group active:scale-95"
        >
          <Plus size={18} className="group-hover:rotate-90 transition-transform duration-500" />
          Novo Mensalista
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-8 rounded-[2.5rem] border border-black/[0.05] relative overflow-hidden group bg-white shadow-sm">
          <div className="flex items-start justify-between mb-6">
            <div className="p-4 rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-900/20">
              <Users size={24} />
            </div>
            <ArrowUpRight size={20} className="text-slate-200 group-hover:text-brand-600 transition-colors" />
          </div>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Total de Clientes</p>
          <h3 className="text-4xl font-black text-slate-900 font-display tracking-tight italic">{customers.length}</h3>
          <p className="text-[9px] font-bold text-slate-500 mt-2 uppercase tracking-widest">Cadastrados no sistema</p>
        </div>

        <div className="glass-card p-8 rounded-[2.5rem] border border-black/[0.05] relative overflow-hidden group bg-white shadow-sm">
          <div className="flex items-start justify-between mb-6">
            <div className="p-4 rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-900/20">
              <DollarSign size={24} />
            </div>
            <ArrowUpRight size={20} className="text-slate-200 group-hover:text-brand-600 transition-colors" />
          </div>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Saldo a Receber</p>
          <h3 className="text-4xl font-black text-slate-900 font-display tracking-tight italic">
            <span className="text-brand-600 text-xl mr-1">R$</span>
            {totalOwed.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-[9px] font-bold text-slate-500 mt-2 uppercase tracking-widest">Total acumulado em fiado</p>
        </div>

        <div className="glass-card p-8 rounded-[2.5rem] border border-black/[0.05] relative overflow-hidden group bg-white shadow-sm">
          <div className="flex items-start justify-between mb-6">
            <div className="p-4 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-900/20">
              <History size={24} />
            </div>
            <ArrowUpRight size={20} className="text-slate-200 group-hover:text-emerald-600 transition-colors" />
          </div>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Status Geral</p>
          <h3 className="text-4xl font-black text-slate-900 font-display tracking-tight italic">OK</h3>
          <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Fluxo de caixa saudável</p>
        </div>
      </div>

      {/* Search & List */}
      <div className="glass-card rounded-[3rem] border border-black/[0.05] overflow-hidden shadow-sm bg-white">
        <div className="p-8 border-b border-black/[0.03] flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="PESQUISAR CLIENTE OU TELEFONE..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-black/[0.02] border border-black/[0.05] rounded-2xl py-4 pl-12 pr-6 text-[10px] font-black uppercase tracking-widest text-slate-900 placeholder:text-slate-400 outline-none focus:border-brand-600 transition-all"
            />
          </div>
          <div className="flex items-center gap-3">
             <span className="text-[9px] bg-brand-600/5 border border-brand-600/20 text-brand-600 px-4 py-2 rounded-full font-black uppercase tracking-widest">
               {filteredCustomers.length} Clientes Encontrados
             </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-100 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">
              <tr>
                <th className="px-8 py-6">Cliente</th>
                <th className="px-8 py-6">Contato</th>
                <th className="px-8 py-6 text-right">Saldo Devedor</th>
                <th className="px-8 py-6 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.03]">
              {filteredCustomers.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-black/5 flex items-center justify-center text-brand-600 font-black text-xs group-hover:scale-110 transition-transform">
                        {c.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 text-sm uppercase tracking-tight group-hover:text-brand-600 transition-colors italic">{c.name}</p>
                        <p className="text-[8px] text-slate-500 font-mono uppercase tracking-widest mt-0.5">ID: {c.id.slice(0, 8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold tracking-widest">
                      <Phone size={12} className="text-slate-400" />
                      {c.phone || 'NÃO INFORMADO'}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <p className={`text-xl font-black font-display italic tracking-tight ${c.balance > 0 ? 'text-brand-600' : 'text-emerald-600'}`}>
                      <span className="text-xs mr-1 opacity-60">R$</span>
                      {c.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => openPay(c)}
                        disabled={c.balance <= 0}
                        className="p-2.5 rounded-xl bg-emerald-600/10 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed group/btn relative"
                        title="Registrar Pagamento"
                      >
                        <DollarSign size={16} />
                      </button>
                      <button 
                        onClick={() => openEdit(c)}
                        className="p-2.5 rounded-xl bg-slate-100 text-slate-600 border border-black/5 hover:border-brand-600 hover:text-brand-600 transition-all"
                        title="Editar"
                      >
                        <ChevronRight size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(c.id)}
                        className="p-2.5 rounded-xl bg-red-600/10 text-red-600 border border-red-500/20 hover:bg-red-600 hover:text-white transition-all"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">
                    Nenhum cliente mensal encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Cadastro/Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <div className="glass-card rounded-[2.5rem] w-full max-w-md shadow-2xl border border-black/[0.1] animate-in zoom-in-95 duration-300 bg-white">
            <div className="px-8 py-6 border-b border-black/[0.03] flex justify-between items-center bg-slate-50">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] font-display italic">
                {selectedCustomer ? 'Editar' : 'Novo'} <span className="text-brand-600">Mensalista</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Nome do Cliente</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-black/[0.02] border border-black/[0.05] rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 outline-none focus:border-brand-600 transition-all"
                  placeholder="EX: JOÃO DA SILVA"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Telefone / Contato</label>
                <input 
                  type="text" 
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-black/[0.02] border border-black/[0.05] rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 outline-none focus:border-brand-600 transition-all"
                  placeholder="(00) 00000-0000"
                />
              </div>
              <button 
                type="submit"
                className="w-full py-5 bg-brand-600 text-white font-black text-[11px] uppercase tracking-[0.25em] rounded-2xl hover:bg-brand-500 shadow-lg shadow-brand-900/20 transition-all"
              >
                Salvar Alterações
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Pagamento */}
      {isPayModalOpen && selectedCustomer && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
          <div className="glass-card rounded-[2.5rem] w-full max-w-md shadow-2xl border border-black/[0.1] animate-in zoom-in-95 duration-300 bg-white">
            <div className="px-8 py-6 border-b border-black/[0.03] flex justify-between items-center bg-slate-50">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] font-display italic">
                Receber <span className="text-emerald-600">Pagamento</span>
              </h3>
              <button onClick={() => setIsPayModalOpen(false)} className="text-slate-400 hover:text-slate-900 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-8 space-y-6 text-center">
              <div className="space-y-1">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Saldo Devedor de {selectedCustomer.name}</p>
                <p className="text-4xl font-black text-slate-900 font-display italic tracking-tighter">
                  <span className="text-brand-600 text-xl mr-1">R$</span>
                  {selectedCustomer.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <form onSubmit={handlePayBalance} className="space-y-6 text-left">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Valor a Receber</label>
                  <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-600 font-black text-sm">R$</span>
                    <input 
                      type="number" 
                      step="0.01"
                      value={payAmount}
                      onChange={e => setPayAmount(e.target.value)}
                      className="w-full bg-black/[0.02] border border-black/[0.05] rounded-2xl py-5 pl-14 pr-6 text-xl font-black text-slate-900 outline-none focus:border-emerald-600 transition-all"
                      placeholder="0,00"
                      required
                    />
                  </div>
                </div>

                <div className="p-4 bg-emerald-600/5 border border-emerald-600/20 rounded-2xl flex gap-3 items-start">
                  <AlertCircle size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <p className="text-[9px] font-bold text-slate-500 leading-relaxed uppercase tracking-wider">
                    ESTE VALOR SERÁ ABATIDO DO SALDO DO CLIENTE E REGISTRADO COMO UMA ENTRADA (SUPRIMENTO) NO CAIXA ATUAL.
                  </p>
                </div>

                <button 
                  type="submit"
                  className="w-full py-5 bg-emerald-600 text-white font-black text-[11px] uppercase tracking-[0.25em] rounded-2xl hover:bg-emerald-500 shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-3"
                >
                  <CheckCircle2 size={18} />
                  Confirmar Recebimento
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersPage;
