"use client";

import React, { useState } from 'react';
import { PlusCircle, Loader2 } from 'lucide-react';
import { createDebt } from '../lib/actions';
import { useRouter } from 'next/navigation';

type Account = { id: string, name: string };

export default function AddDebtModal({ accounts }: { accounts: Account[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [type, setType] = useState<'Utang' | 'Piutang'>('Piutang');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg("");

        const formData = new FormData(e.currentTarget);
        formData.append('type', type);

        const result = await createDebt(formData);

        if (result?.error) {
            setErrorMsg(result.error);
        } else {
            setIsOpen(false);
            router.refresh();
        }
        setIsLoading(false);
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1"
            >
                <PlusCircle className="w-4 h-4" /> Tambah Catatan
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg text-slate-800">Catat Utang / Piutang</h3>
                            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>

                        {/* Tabs */}
                        <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
                            <button onClick={() => setType('Piutang')} className={`flex-1 text-sm py-2 rounded-md font-medium transition ${type === 'Piutang' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>Piutang (Meminjamkan)</button>
                            <button onClick={() => setType('Utang')} className={`flex-1 text-sm py-2 rounded-md font-medium transition ${type === 'Utang' ? 'bg-white shadow text-slate-800' : 'text-slate-500'}`}>Utang (Meminjam)</button>
                        </div>

                        {errorMsg && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg mb-4">{errorMsg}</div>}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Orang / Pihak</label>
                                <input name="counterparty" type="text" required className="w-full p-3 border border-slate-300 rounded-xl" placeholder={type === 'Piutang' ? 'Budi (Teman)' : 'Pinjol / Kartu Kredit'} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nominal (Rp)</label>
                                <input name="amount" type="number" min="0" required className="w-full p-3 border border-slate-300 rounded-xl" placeholder="500000" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Akun Terpengaruh</label>
                                <select name="accountId" required className="w-full p-3 border border-slate-300 rounded-xl bg-white">
                                    <option value="">-- Pilih Akun --</option>
                                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                                </select>
                                <p className="text-xs text-slate-500 mt-1">
                                    {type === 'Piutang' ? '*Saldo akun ini akan dikurangi' : '*Saldo akun ini akan ditambahkan'}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tenggat Waktu (Jatuh Tempo)</label>
                                <input name="dueDate" type="date" required className="w-full p-3 border border-slate-300 rounded-xl" />
                            </div>

                            <button type="submit" disabled={isLoading} className="w-full mt-4 p-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition flex items-center justify-center">
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Simpan Catatan"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}