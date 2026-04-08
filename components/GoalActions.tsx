"use client";

import React, { useState } from 'react';
import { Pencil, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { editGoal, deleteGoal } from '../lib/actions';
import { useRouter } from 'next/navigation';

type Goal = { id: string, name: string, targetAmount: number, deadline: Date | null };

export default function GoalActions({ goal }: { goal: Goal }) {
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        const confirmDelete = window.confirm("Hapus target tabungan ini? Uang yang sudah disetor tidak akan kembali secara otomatis ke saldo akun Anda.");
        if (!confirmDelete) return;

        setIsLoading(true);
        const result = await deleteGoal(goal.id);
        if (result?.error) alert(result.error);
        else router.refresh();
        setIsLoading(false);
    };

    const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData(e.currentTarget);
        formData.append('id', goal.id);

        const result = await editGoal(formData);
        if (result?.error) alert(result.error);
        else {
            setIsEditOpen(false);
            router.refresh();
        }
        setIsLoading(false);
    };

    return (
        <>
            <div className="flex gap-2">
                <button onClick={() => setIsEditOpen(true)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                    <Pencil className="w-4 h-4" />
                </button>
                <button onClick={handleDelete} disabled={isLoading} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
            </div>

            {isEditOpen && (
                <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg text-slate-800">Edit Target</h3>
                            <button onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>

                        <div className="mb-4 text-xs text-slate-500 flex gap-2 items-start bg-slate-50 p-3 rounded-lg border border-slate-100">
                            <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                            <p>Nominal yang sudah terkumpul (progress) tidak dapat diubah dari sini. Progress bertambah melalui penyetoran.</p>
                        </div>

                        <form onSubmit={handleEdit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Target</label>
                                <input name="name" type="text" defaultValue={goal.name} required className="w-full p-3 border border-slate-300 rounded-xl" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Target Nominal (Rp)</label>
                                <input name="targetAmount" type="number" defaultValue={goal.targetAmount} required className="w-full p-3 border border-slate-300 rounded-xl" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Target Selesai</label>
                                <input name="deadline" type="date" defaultValue={goal.deadline ? new Date(goal.deadline).toISOString().split('T')[0] : ''} className="w-full p-3 border border-slate-300 rounded-xl" />
                            </div>

                            <button type="submit" disabled={isLoading} className="w-full mt-4 p-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 flex justify-center transition">
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Simpan Perubahan"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}