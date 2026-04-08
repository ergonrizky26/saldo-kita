"use client";

import React, { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { deleteTransaction } from '../lib/actions';
import { useRouter } from 'next/navigation';

export default function TransactionAction({ id, type }: { id: string, type: string }) {
    const [isDeleting, setIsDeleting] = useState(false);
    const router = useRouter();

    // Hanya izinkan tombol hapus muncul untuk Pemasukan, Pengeluaran, dan Transfer
    if (!['Expense', 'Income', 'Transfer'].includes(type)) return null;

    const handleDelete = async () => {
        const confirmDelete = window.confirm("Hapus transaksi ini? Saldo Anda akan dikembalikan secara otomatis.");
        if (!confirmDelete) return;

        setIsDeleting(true);
        const result = await deleteTransaction(id);

        if (result?.error) {
            alert(result.error);
        } else {
            router.refresh(); // Segarkan UI Dashboard
        }
        setIsDeleting(false);
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-2"
            title="Hapus Transaksi"
        >
            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </button>
    );
}