"use client";

import React, { useState } from 'react';
import { Pencil, Trash2, Loader2 } from 'lucide-react';
import { deleteDebt, editDebtMetadata } from '../lib/actions';
import { useRouter } from 'next/navigation';

type Debt = { id: string, counterparty: string, dueDate: Date | null };

export default function DebtActions({ debt }: { debt: Debt }) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    // FUNGSI HAPUS
    const handleDelete = async () => {
        const confirmDelete = window.confirm("Hapus catatan ini? Saldo Anda akan dikembalikan secara otomatis.");
        if (!confirmDelete) return;

        setIsDeleting(true);
        const result = await deleteDebt(debt.id);
        if (result?.error) alert(result.error);
        else router.refresh();
        setIsDeleting(false);
    };

    // FUNGSI EDIT
    const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        const formData = new FormData(e.currentTarget);
        formData.append('id', debt.id);

        const result = await editDebtMetadata(formData);
        if (result?.error) alert(result.error);
        else {
            setIsEditModalOpen(false);
            router.refresh();
        }
        setIsLoading(false);
    };

    return (
        <>
            <div className="flex items-center gap-1 border-l border-slate-200 pl-2 ml-2">
                <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Edit Detail"
                >
                    <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Hapus & Revert Saldo"
                >
                    {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
            </div>

            {/* MODAL EDIT */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg text-slate-800">Edit Catatan</h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>

                        <div className="mb-4 text-xs text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
                            *Hanya nama dan tanggal yang bisa diubah. Jika salah nominal, harap hapus dan buat ulang.
                        </div>

                        <form onSubmit={handleEdit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nama Pihak Terkait</label>
                                <input name="counterparty" type="text" defaultValue={debt.counterparty} required className="w-full p-3 border border-slate-300 rounded-xl" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Jatuh Tempo</label>
                                <input name="dueDate" type="date" defaultValue={debt.dueDate ? new Date(debt.dueDate).toISOString().split('T')[0] : ''} required className="w-full p-3 border border-slate-300 rounded-xl" />
                            </div>
                            <button type="submit" disabled={isLoading} className="w-full mt-4 p-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition flex items-center justify-center">
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Simpan Perubahan"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}