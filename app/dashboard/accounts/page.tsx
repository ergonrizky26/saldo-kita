import { createClient } from '../../../lib/supabase';
import { db } from '../../../db';
import { users, accounts } from '../../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Wallet, Landmark, CreditCard } from 'lucide-react';
import AccountActions from '../../../components/AccountActions';

export default async function AccountsManagementPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/');

    const dbUser = await db.select().from(users).where(eq(users.id, user.id));
    const REAL_HOUSEHOLD_ID = dbUser[0]?.householdId;
    if (!REAL_HOUSEHOLD_ID) redirect('/');

    // Tarik semua akun, termasuk yang nonaktif untuk history
    const dbAccounts = await db.select().from(accounts)
        .where(eq(accounts.householdId, REAL_HOUSEHOLD_ID))
        .orderBy(desc(accounts.isActive)); // Yang aktif di atas

    const formatIDR = (amount: string) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(amount));

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <div className="max-w-4xl mx-auto p-4 md:p-8 pt-8">

                {/* Navigasi Back */}
                <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 font-medium mb-6 transition">
                    <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
                </Link>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
                            <Landmark className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800">Manajemen Akun</h1>
                            <p className="text-sm text-slate-500">Kelola detail dan status akun keuangan Anda</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 text-sm text-slate-500">
                                    <th className="py-3 px-4 font-medium">Nama Akun</th>
                                    <th className="py-3 px-4 font-medium">Tipe</th>
                                    <th className="py-3 px-4 font-medium">Saldo Terakhir</th>
                                    <th className="py-3 px-4 font-medium text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {dbAccounts.map(acc => (
                                    <tr key={acc.id} className={`hover:bg-slate-50 transition ${acc.isActive === false ? 'opacity-60 bg-slate-50' : ''}`}>
                                        <td className="py-4 px-4 font-semibold text-slate-800 flex items-center gap-2">
                                            {acc.type === 'Cash' ? <Wallet className="w-4 h-4 text-slate-400" /> : <CreditCard className="w-4 h-4 text-slate-400" />}
                                            {acc.name}
                                        </td>
                                        <td className="py-4 px-4 text-sm text-slate-600">{acc.type}</td>
                                        <td className="py-4 px-4 font-medium text-slate-800">{formatIDR(acc.balance as string)}</td>
                                        <td className="py-4 px-4 flex justify-end">
                                            <AccountActions account={{ id: acc.id, name: acc.name, type: acc.type || 'Bank', isActive: acc.isActive }} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}