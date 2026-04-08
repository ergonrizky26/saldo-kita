"use client";

import React, { useState } from 'react';
import { Target, PlusCircle, ArrowUpCircle, Loader2 } from 'lucide-react';
import { createGoal, fundGoal } from '../lib/actions';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Account = { id: string, name: string };
type Goal = { id: string, name: string, targetAmount: number, currentAmount: number, deadline: Date | null };

export default function GoalsSection({ accounts, goals }: { accounts: Account[], goals: Goal[] }) {
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [fundGoalId, setFundGoalId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const router = useRouter();

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true); setErrorMsg("");
        const result = await createGoal(new FormData(e.currentTarget));
        if (result?.error) setErrorMsg(result.error);
        else { setIsAddOpen(false); router.refresh(); }
        setIsLoading(false);
    };

    const handleFund = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!fundGoalId) return;
        setIsLoading(true); setErrorMsg("");
        const formData = new FormData(e.currentTarget);
        const result = await fundGoal(fundGoalId, formData.get('accountId') as string, parseFloat(formData.get('amount') as string));
        if (result?.error) setErrorMsg(result.error);
        else { setFundGoalId(null); router.refresh(); }
        setIsLoading(false);
    };

    const formatIDR = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

    return (
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mt-6">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-bold text-slate-800">Target Tabungan</h2>
                </div>
                {/* <button onClick={() => setIsAddOpen(true)} className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1">
                    <PlusCircle className="w-4 h-4" /> Buat Target
                </button> */}
                <Link href="/dashboard/goals" className="text-sm text-slate-500 font-medium hover:text-slate-800 transition">
                    Kelola Target
                </Link>
            </div>

            {goals.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">Belum ada target tabungan.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {goals.map(g => {
                        const percentage = Math.min((g.currentAmount / g.targetAmount) * 100, 100);
                        return (
                            <div key={g.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50 relative overflow-hidden">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-semibold text-slate-800">{g.name}</h4>
                                    <button onClick={() => setFundGoalId(g.id)} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 flex items-center gap-1 transition">
                                        <ArrowUpCircle className="w-3 h-3" /> Setor
                                    </button>
                                </div>
                                <div className="text-sm text-slate-500 mb-2">
                                    <strong className="text-blue-600">{formatIDR(g.currentAmount)}</strong> dari {formatIDR(g.targetAmount)}
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-2">
                                    <div className="bg-blue-500 h-2 rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                                </div>
                                <div className="text-right text-xs text-slate-400 mt-1">{percentage.toFixed(0)}% Tercapai</div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal Add Goal */}
            {isAddOpen && (
                <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg">Buat Target Baru</h3>
                            <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        {errorMsg && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg mb-4">{errorMsg}</div>}
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div><label className="block text-sm font-medium mb-1">Nama Target</label><input name="name" required className="w-full p-3 border rounded-xl" placeholder="Contoh: Beli Laptop" /></div>
                            <div><label className="block text-sm font-medium mb-1">Target Nominal (Rp)</label><input name="targetAmount" type="number" required className="w-full p-3 border rounded-xl" /></div>
                            <div><label className="block text-sm font-medium mb-1">Target Selesai (Opsional)</label><input name="deadline" type="date" className="w-full p-3 border rounded-xl" /></div>
                            <button type="submit" disabled={isLoading} className="w-full p-3 bg-blue-600 text-white font-bold rounded-xl flex justify-center">{isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Simpan"}</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Fund Goal */}
            {fundGoalId && (
                <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg">Setor Tabungan</h3>
                            <button onClick={() => setFundGoalId(null)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>
                        {errorMsg && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg mb-4">{errorMsg}</div>}
                        <form onSubmit={handleFund} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Ambil dari Akun</label>
                                <select name="accountId" required className="w-full p-3 border rounded-xl bg-white">
                                    <option value="">-- Pilih Akun --</option>
                                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                                </select>
                            </div>
                            <div><label className="block text-sm font-medium mb-1">Nominal Setor (Rp)</label><input name="amount" type="number" required className="w-full p-3 border rounded-xl" /></div>
                            <button type="submit" disabled={isLoading} className="w-full p-3 bg-green-600 text-white font-bold rounded-xl flex justify-center">{isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Setorkan"}</button>
                        </form>
                    </div>
                </div>
            )}
        </section>
    );
}