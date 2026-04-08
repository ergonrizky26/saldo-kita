"use client";

import React, { useState } from 'react';
import { TrendingUp, TrendingDown, ArrowRightLeft, User, Users } from 'lucide-react';
import TransactionAction from './TransactionAction';
import { Bot } from 'lucide-react';

type Transaction = {
    id: string; type: string; amount: string | number; date: Date;
    description: string | null; categoryName: string | null; createdBy: string | null;
};
type Member = { id: string; name: string; isMe: boolean };

export default function TransactionFilterList({
    transactions, members
}: {
    transactions: Transaction[], members: Member[]
}) {
    const [activeFilter, setActiveFilter] = useState<'ALL' | string>('ALL');

    // Logika Filter
    const filteredTransactions = transactions.filter(tx => {
        if (activeFilter === 'ALL') return true;
        return tx.createdBy === activeFilter;
    });

    const formatIDR = (num: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

    // Cari nama partner
    const me = members.find(m => m.isMe);
    const partner = members.find(m => !m.isMe);

    return (
        <div>
            {/* TABS FILTER */}
            {members.length > 1 && (
                <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
                    <button
                        onClick={() => setActiveFilter('ALL')}
                        className={`flex-1 flex items-center justify-center gap-2 text-sm py-2 rounded-lg font-bold transition ${activeFilter === 'ALL' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Users className="w-4 h-4" /> Gabungan
                    </button>

                    <button
                        onClick={() => setActiveFilter(me?.id || '')}
                        className={`flex-1 flex items-center justify-center gap-2 text-sm py-2 rounded-lg font-bold transition ${activeFilter === me?.id ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <User className="w-4 h-4" /> Saya
                    </button>

                    {partner && (
                        <button
                            onClick={() => setActiveFilter(partner.id)}
                            className={`flex-1 flex items-center justify-center gap-2 text-sm py-2 rounded-lg font-bold transition ${activeFilter === partner.id ? 'bg-white shadow text-pink-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <User className="w-4 h-4" /> {partner.name}
                        </button>
                    )}
                </div>
            )}

            {/* LIST TRANSAKSI */}
            {filteredTransactions.length === 0 ? (
                <div className="text-center p-6 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500 text-sm">
                    Belum ada transaksi di kategori ini.
                </div>
            ) : (
                <div className="space-y-0 md:space-y-2">
                    {filteredTransactions.map(tx => {
                        // Cari siapa pembuatnya untuk label
                        const creator = members.find(m => m.id === tx.createdBy);

                        return (
                            <div key={tx.id} className="flex items-center justify-between p-3 md:p-4 hover:bg-slate-50 border-b border-slate-100 md:border-transparent md:hover:border-slate-200 md:rounded-xl transition-colors group">
                                <div className="flex items-center gap-3 md:gap-4 min-w-0">
                                    <div className={`p-2.5 md:p-3 rounded-xl md:rounded-2xl flex-shrink-0 ${tx.type === 'Income' ? 'bg-green-100 text-green-600' : tx.type === 'Expense' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                        {tx.type === 'Income' ? <TrendingUp className="w-4 h-4 md:w-5 md:h-5" /> : tx.type === 'Expense' ? <TrendingDown className="w-4 h-4 md:w-5 md:h-5" /> : <ArrowRightLeft className="w-4 h-4 md:w-5 md:h-5" />}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-slate-800 text-sm md:text-base truncate">{tx.categoryName || tx.description || tx.type}</h4>

                                            {/* === TAMBAHKAN BADGE OTOMATIS DI SINI === */}
                                            {tx.description && tx.description.includes('(Otomatis') && (
                                                <span className="bg-indigo-100 text-indigo-700 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide flex items-center gap-1 flex-shrink-0">
                                                    <Bot className="w-3 h-3" /> <span className="hidden sm:inline">Rutin</span>
                                                </span>
                                            )}
                                        </div>
                                        {/* ======================================== */}

                                        <div className="flex items-center gap-2 mt-0.5 md:mt-1">
                                            <p className="text-[10px] md:text-xs text-slate-500 flex-shrink-0">{new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>

                                            {/* LABEL PEMBUAT TRANSAKSI */}
                                            {creator && members.length > 1 && activeFilter === 'ALL' && (
                                                <span className={`text-[9px] md:text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${creator.isMe ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'}`}>
                                                    {creator.isMe ? 'Saya' : creator.name}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                                    <div className={`font-bold text-sm md:text-base ${tx.type === 'Income' ? 'text-green-600' : tx.type === 'Expense' ? 'text-slate-800' : 'text-slate-600'}`}>
                                        {tx.type === 'Expense' ? '-' : tx.type === 'Income' ? '+' : ''}{formatIDR(Number(tx.amount))}
                                    </div>
                                    <TransactionAction id={tx.id} type={tx.type} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )
            }
        </div>
    );
}