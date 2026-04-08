"use client";

import React, { useState } from 'react';
import { ArrowRightLeft, TrendingDown, TrendingUp, Loader2 } from 'lucide-react';
import { createTransaction } from '../lib/actions';
import AddRecurringModal from './AddRecurringModal';

type Account = { id: string, name: string };
type Category = { id: string, name: string, type: string };

export default function TransactionModal({ accounts, categories }: { accounts: Account[], categories: Category[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [type, setType] = useState<'Expense' | 'Income' | 'Transfer'>('Expense');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg("");

        const formData = new FormData(e.currentTarget);
        formData.append('type', type);

        const result = await createTransaction(formData);

        if (result?.error) {
            setErrorMsg(result.error);
        } else {
            setIsOpen(false);
        }
        setIsLoading(false);
    };

    // Filter kategori sesuai tab yang sedang aktif
    const filteredCategories = categories?.filter(c => c.type === type) || [];

    return (
        <>
            <section className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-2xl shadow-md text-white">
                <h2 className="text-lg font-bold mb-2">Catat Transaksi</h2>
                <p className="text-blue-100 text-sm mb-6">Sinkronisasi real-time dengan partner Anda.</p>

                <button
                    onClick={() => { setType('Expense'); setIsOpen(true); }}
                    className="w-full bg-white text-blue-700 font-semibold py-3 rounded-xl mb-3 shadow hover:bg-blue-50 transition-colors flex justify-center items-center gap-2"
                >
                    <TrendingDown className="w-4 h-4" /> Pemasukan / Pengeluaran
                </button>
                <button
                    onClick={() => { setType('Transfer'); setIsOpen(true); }}
                    className="w-full bg-blue-700/50 border border-blue-500 text-white font-semibold py-3 rounded-xl hover:bg-blue-700/70 transition-colors flex justify-center items-center gap-2"
                >
                    <ArrowRightLeft className="w-4 h-4" /> Transfer Antar Rekening
                </button>
                <AddRecurringModal accounts={accounts} categories={categories} />
            </section>

            {isOpen && (
                <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg text-slate-800">Catat Transaksi Baru</h3>
                            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>

                        {/* Tabs */}
                        <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
                            <button onClick={() => setType('Expense')} className={`flex-1 text-sm py-2 rounded-md font-medium transition ${type === 'Expense' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>Pengeluaran</button>
                            <button onClick={() => setType('Income')} className={`flex-1 text-sm py-2 rounded-md font-medium transition ${type === 'Income' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>Pemasukan</button>
                            <button onClick={() => setType('Transfer')} className={`flex-1 text-sm py-2 rounded-md font-medium transition ${type === 'Transfer' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>Transfer</button>
                        </div>

                        {errorMsg && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg mb-4">{errorMsg}</div>}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nominal (Rp)</label>
                                <input name="amount" type="number" min="0" required className="w-full p-3 border border-slate-300 rounded-xl" placeholder="50000" />
                            </div>

                            {/* DROPDOWN KATEGORI (MUNCUL JIKA BUKAN TRANSFER) */}
                            {(type === 'Expense' || type === 'Income') && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
                                    <select name="categoryId" required className="w-full p-3 border border-slate-300 rounded-xl bg-white">
                                        <option value="">-- Pilih Kategori --</option>
                                        {filteredCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Keterangan</label>
                                <input name="description" type="text" required className="w-full p-3 border border-slate-300 rounded-xl" placeholder={type === 'Expense' ? 'Beli Makan Siang' : type === 'Income' ? 'Gaji Bulanan' : 'Pindah Dana'} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
                                <input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="w-full p-3 border border-slate-300 rounded-xl" />
                            </div>

                            <div className={type === 'Transfer' ? 'grid grid-cols-2 gap-4' : ''}>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        {type === 'Transfer' ? 'Dari Akun' : 'Pilih Akun'}
                                    </label>
                                    <select name="accountId" required className="w-full p-3 border border-slate-300 rounded-xl bg-white">
                                        <option value="">-- Pilih --</option>
                                        {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                                    </select>
                                </div>

                                {type === 'Transfer' && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Ke Akun</label>
                                        <select name="toAccountId" required className="w-full p-3 border border-slate-300 rounded-xl bg-white">
                                            <option value="">-- Pilih --</option>
                                            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>

                            <button type="submit" disabled={isLoading} className="w-full mt-4 p-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition flex items-center justify-center">
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Simpan Transaksi"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}