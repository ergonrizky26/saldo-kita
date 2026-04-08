import { createClient } from '../../../lib/supabase';
import { db } from '../../../db';
import { users, transactions, categories } from '../../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Receipt, TrendingUp, TrendingDown, ArrowRightLeft } from 'lucide-react';
import TransactionAction from '../../../components/TransactionAction';

export default async function TransactionsHistoryPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/');

    const dbUser = await db.select().from(users).where(eq(users.id, user.id));
    const REAL_HOUSEHOLD_ID = dbUser[0]?.householdId;
    if (!REAL_HOUSEHOLD_ID) redirect('/');

    // Ambil SEMUA transaksi tanpa limit untuk halaman ini
    const allTransactions = await db.select({
        id: transactions.id,
        type: transactions.type,
        amount: transactions.amount,
        date: transactions.date,
        description: transactions.description,
        categoryName: categories.name,
    })
        .from(transactions)
        .leftJoin(categories, eq(transactions.categoryId, categories.id))
        .where(eq(transactions.householdId, REAL_HOUSEHOLD_ID))
        .orderBy(desc(transactions.date), desc(transactions.createdAt));

    const formatIDR = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <div className="max-w-5xl mx-auto p-4 md:p-8 pt-8">

                {/* Navigasi Back */}
                <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 font-medium mb-6 transition">
                    <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
                </Link>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
                            <Receipt className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800">Semua Transaksi</h1>
                            <p className="text-sm text-slate-500">Riwayat lengkap arus kas Anda</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 text-sm text-slate-500">
                                    <th className="py-3 px-4 font-medium">Tanggal</th>
                                    <th className="py-3 px-4 font-medium">Keterangan / Kategori</th>
                                    <th className="py-3 px-4 font-medium">Tipe</th>
                                    <th className="py-3 px-4 font-medium text-right">Nominal</th>
                                    <th className="py-3 px-4 font-medium text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {allTransactions.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-slate-500">Belum ada transaksi dicatat.</td>
                                    </tr>
                                ) : (
                                    allTransactions.map(tx => (
                                        <tr key={tx.id} className="hover:bg-slate-50 transition">
                                            <td className="py-4 px-4 text-sm text-slate-600">
                                                {new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="font-semibold text-slate-800">{tx.description || tx.type}</div>
                                                {tx.categoryName && <div className="text-xs text-slate-500">{tx.categoryName}</div>}
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
                          ${tx.type === 'Income' ? 'bg-green-50 text-green-700' :
                                                        tx.type === 'Expense' ? 'bg-red-50 text-red-700' :
                                                            'bg-blue-50 text-blue-700'}`}>
                                                    {tx.type === 'Income' ? <TrendingUp className="w-3 h-3" /> :
                                                        tx.type === 'Expense' ? <TrendingDown className="w-3 h-3" /> :
                                                            <ArrowRightLeft className="w-3 h-3" />}
                                                    {tx.type}
                                                </div>
                                            </td>
                                            <td className={`py-4 px-4 text-right font-bold ${tx.type === 'Income' ? 'text-green-600' : tx.type === 'Expense' ? 'text-slate-800' : 'text-slate-600'}`}>
                                                {tx.type === 'Expense' ? '-' : tx.type === 'Income' ? '+' : ''}{formatIDR(Number(tx.amount))}
                                            </td>
                                            <td className="py-4 px-4 flex justify-end">
                                                {/* Memanggil komponen hapus yang sudah kita buat sebelumnya */}
                                                <TransactionAction id={tx.id} type={tx.type} />
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}