"use client";

import React, { useState } from 'react';
import { Calendar, Repeat, Wallet, Tags, PlusCircle, Loader2, AlertCircle } from 'lucide-react';
import { createRecurringTemplate } from '../lib/actions';
import { useRouter } from 'next/navigation';

interface Props {
    accounts: { id: string, name: string }[];
    categories: { id: string, name: string, type: string }[];
}

export default function AddRecurringModal({ accounts, categories }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const [type, setType] = useState<'Expense' | 'Income'>('Expense');
    const router = useRouter();

    // Filter kategori berdasarkan tipe yang dipilih (Pemasukan/Pengeluaran)
    const filteredCategories = categories.filter(c => c.type === type);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg("");

        const formData = new FormData(e.currentTarget);
        const result = await createRecurringTemplate(formData);

        if (result?.error) {
            setErrorMsg(result.error);
            setIsLoading(false);
        } else {
            setIsOpen(false);
            setIsLoading(false);
            router.refresh();
        }
    };

    return (
        <>
            {/* TOMBOL PEMICU DI DALAM AddRecurringModal.tsx */}
            <button
                onClick={() => setIsOpen(true)}
                className="w-full flex items-center justify-center gap-2 bg-transparent border border-indigo-400 text-white px-4 py-3 rounded-xl font-bold hover:bg-indigo-600 transition mt-3"
            >
                <Repeat className="w-4 h-4" />
                <span>Transaksi Rutin</span>
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-slate-900/60 z-[100] flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-sm">
                    <div className="bg-white w-full md:max-w-lg rounded-t-[2rem] md:rounded-3xl p-6 pb-8 md:pb-6 shadow-2xl animate-in slide-in-from-bottom-12 md:slide-in-from-bottom-0 md:zoom-in-95 max-h-[95vh] overflow-y-auto">
                        {/* 5. INDIKATOR TARIK/PULL HANDLE (Gaya laci iOS/Android, hanya muncul di HP) */}
                        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 md:hidden" />
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-2">
                                <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                                    <Repeat className="w-5 h-5" />
                                </div>
                                <h3 className="font-bold text-xl text-slate-800">Set Transaksi Rutin</h3>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 bg-slate-50 rounded-full md:bg-transparent">✕</button>
                        </div>

                        {errorMsg && (
                            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl mb-4 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" /> {errorMsg}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* TIPE TRANSAKSI */}
                            <div className="flex bg-slate-100 p-1 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setType('Expense')}
                                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${type === 'Expense' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500'}`}
                                >
                                    Pengeluaran Rutin
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setType('Income')}
                                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${type === 'Income' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500'}`}
                                >
                                    Pemasukan Rutin
                                </button>
                                <input type="hidden" name="type" value={type} />
                            </div>

                            {/* NAMA & NOMINAL */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Nama Transaksi</label>
                                    <input name="name" required placeholder="Contoh: Netflix, Kost..."
                                        className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition text-slate-800 placeholder:text-slate-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Nominal (Rp)</label>
                                    <input name="amount" type="number" required placeholder="0"
                                        className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition text-slate-800 placeholder:text-slate-400"
                                    />
                                </div>
                            </div>

                            {/* AKUN & KATEGORI */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase flex items-center gap-1">
                                        <Wallet className="w-3 h-3" /> Sumber Akun
                                    </label>
                                    <select name="accountId" required defaultValue=""
                                        className="w-full p-3 border border-slate-200 rounded-xl bg-white outline-none text-slate-800"
                                    >
                                        <option value="" disabled>Pilih Akun</option>
                                        {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase flex items-center gap-1">
                                        <Tags className="w-3 h-3" /> Kategori
                                    </label>
                                    <select name="categoryId" required defaultValue=""
                                        className="w-full p-3 border border-slate-200 rounded-xl bg-white outline-none text-slate-800"
                                    >
                                        <option value="" disabled>Pilih Kategori</option>
                                        {filteredCategories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* JADWAL & FREKUENSI */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase flex items-center gap-1">
                                        <Repeat className="w-3 h-3" /> Frekuensi
                                    </label>
                                    <select name="frequency" required
                                        className="w-full p-3 border border-slate-200 rounded-xl bg-white outline-none text-slate-800"
                                    >
                                        <option value="Bulanan">Setiap Bulan</option>
                                        <option value="Mingguan">Setiap Minggu</option>
                                        <option value="Harian">Setiap Hari</option>
                                        <option value="Tahunan">Setiap Tahun</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase flex items-center gap-1">
                                        <Calendar className="w-3 h-3" /> Mulai Tanggal
                                    </label>
                                    <input name="startDate" type="date" required
                                        className="w-full p-3 border border-slate-200 rounded-xl outline-none text-slate-800"
                                        defaultValue={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="flex-1 p-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1 p-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition flex justify-center items-center gap-2"
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <PlusCircle className="w-5 h-5" />}
                                    Simpan Jadwal
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}