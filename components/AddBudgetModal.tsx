"use client";

import React, { useState } from 'react';
import { Target, Loader2 } from 'lucide-react';
import { createBudget } from '../lib/actions';

type Category = { id: string, name: string };

export default function AddBudgetModal({ categories }: { categories: Category[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg("");

        const formData = new FormData(e.currentTarget);
        const result = await createBudget(formData);

        if (result?.error) {
            setErrorMsg(result.error);
        } else {
            setIsOpen(false);
        }
        setIsLoading(false);
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1"
            >
                <Target className="w-4 h-4" /> Tambah Budget
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg text-slate-800">Set Budget Bulanan</h3>
                            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>

                        {errorMsg && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg mb-4">{errorMsg}</div>}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
                                <select name="categoryId" required className="w-full p-3 border border-slate-300 rounded-xl bg-white">
                                    <option value="">-- Pilih Kategori --</option>
                                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Batas Budget (Rp)</label>
                                <input name="amountLimit" type="number" min="0" required className="w-full p-3 border border-slate-300 rounded-xl" placeholder="Contoh: 1000000" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Bulan</label>
                                    <select name="month" required defaultValue={new Date().getMonth() + 1} className="w-full p-3 border border-slate-300 rounded-xl bg-white">
                                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                            <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('id-ID', { month: 'long' })}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Tahun</label>
                                    <input name="year" type="number" required defaultValue={new Date().getFullYear()} className="w-full p-3 border border-slate-300 rounded-xl bg-slate-100" readOnly />
                                </div>
                            </div>

                            <button type="submit" disabled={isLoading} className="w-full mt-4 p-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition flex items-center justify-center">
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Simpan Budget"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}