"use client";

import React, { useState } from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';
import { settleDebt } from '../lib/actions';
import { useRouter } from 'next/navigation';

type Account = { id: string, name: string };
type Debt = { id: string, counterparty: string, type: string, amount: number };

export default function SettleDebtModal({ accounts, debt }: { accounts: Account[], debt: Debt }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg("");

        const formData = new FormData(e.currentTarget);
        const accountId = formData.get('accountId') as string;

        const result = await settleDebt(debt.id, accountId, debt.type, debt.amount);

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
                className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-full font-semibold hover:bg-green-200 transition flex items-center gap-1"
            >
                <CheckCircle className="w-3 h-3" /> Lunasi
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg text-slate-800">Pelunasan {debt.type}</h3>
                            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>

                        {errorMsg && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg mb-4">{errorMsg}</div>}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
                                <p className="text-sm text-slate-500 mb-1">Pihak Terkait: <strong className="text-slate-700">{debt.counterparty}</strong></p>
                                <p className="text-sm text-slate-500">Nominal: <strong className="text-slate-700">Rp {debt.amount.toLocaleString('id-ID')}</strong></p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    {debt.type === 'Piutang' ? 'Masukkan Uang Ke Akun' : 'Bayar Menggunakan Akun'}
                                </label>
                                <select name="accountId" required className="w-full p-3 border border-slate-300 rounded-xl bg-white">
                                    <option value="">-- Pilih Akun --</option>
                                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                                </select>
                            </div>

                            <button type="submit" disabled={isLoading} className="w-full mt-4 p-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition flex items-center justify-center">
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Konfirmasi Pelunasan"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}