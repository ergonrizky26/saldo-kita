"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Bot, X } from 'lucide-react';
import { processDueRecurringTransactions } from '../lib/actions';
import { useRouter } from 'next/navigation';

export default function AutoProcessor({ householdId }: { householdId: string }) {
    const [processedCount, setProcessedCount] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const router = useRouter();

    // GEMBOK ANTI-DOUBLE FIRE DARI REACT STRICT MODE
    const hasRun = useRef(false);

    useEffect(() => {
        // Jika mesin sudah pernah menyala di siklus ini, hentikan!
        if (hasRun.current) return;
        hasRun.current = true;

        async function runMachine() {
            try {
                const result = await processDueRecurringTransactions(householdId);

                // Hapus pengecekan isMounted. Langsung sikat jika ada hasil!
                if (result && 'processed' in result && typeof result.processed === 'number' && result.processed > 0) {
                    setProcessedCount(result.processed);
                    setIsVisible(true);

                    router.refresh();

                    setTimeout(() => setIsVisible(false), 8000);
                }
            } catch (error) {
                console.error("Gagal menjalankan otomasi:", error);
            }
        }

        runMachine();
    }, [householdId, router]);

    if (!isVisible || processedCount === 0) return null;

    return (
        <div className="bg-indigo-600 text-white p-4 rounded-2xl shadow-xl shadow-indigo-200 mb-8 flex items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-4">
                <div className="bg-white/20 p-2.5 rounded-xl">
                    <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h4 className="font-bold text-base">Otomasi Berhasil Dijalankan</h4>
                    <p className="text-sm text-indigo-100 mt-0.5">
                        Sistem telah memproses <strong>{processedCount} transaksi rutin</strong> hari ini. Saldo dan riwayat Anda telah diperbarui.
                    </p>
                </div>
            </div>
            <button
                onClick={() => setIsVisible(false)}
                className="text-indigo-200 hover:text-white p-2 rounded-lg hover:bg-white/10 transition"
            >
                <X className="w-5 h-5" />
            </button>
        </div>
    );
}