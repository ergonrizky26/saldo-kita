import { createClient } from '../../../lib/supabase';
import { db } from '../../../db';
import { users, goals } from '../../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Target, CalendarDays } from 'lucide-react';
import GoalActions from '../../../components/GoalActions';
import AddGoalModal from '../../../components/AddGoalModal';

export default async function GoalsManagementPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/');

    const dbUser = await db.select().from(users).where(eq(users.id, user.id));
    const REAL_HOUSEHOLD_ID = dbUser[0]?.householdId;
    if (!REAL_HOUSEHOLD_ID) redirect('/');

    const dbGoals = await db.select().from(goals)
        .where(eq(goals.householdId, REAL_HOUSEHOLD_ID))
        .orderBy(desc(goals.createdAt));

    const formatIDR = (amount: string | number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(Number(amount));

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
                            <Target className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800">Manajemen Target Tabungan</h1>
                            <p className="text-sm text-slate-500">Kelola dan edit impian finansial Anda</p>
                        </div>
                    </div>

                    <div className="bg-blue-50 p-1 rounded-xl border border-blue-100">
                        <AddGoalModal />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 text-sm text-slate-500">
                                    <th className="py-3 px-4 font-medium">Nama Target</th>
                                    <th className="py-3 px-4 font-medium">Progress Terkumpul</th>
                                    <th className="py-3 px-4 font-medium">Nominal Impian</th>
                                    <th className="py-3 px-4 font-medium">Tenggat Waktu</th>
                                    <th className="py-3 px-4 font-medium text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {dbGoals.length === 0 ? (
                                    <tr><td colSpan={5} className="py-8 text-center text-slate-500">Belum ada target tabungan yang dibuat.</td></tr>
                                ) : (
                                    dbGoals.map(g => {
                                        const percentage = Math.min((Number(g.currentAmount) / Number(g.targetAmount)) * 100, 100);
                                        return (
                                            <tr key={g.id} className="hover:bg-slate-50 transition">
                                                <td className="py-4 px-4 font-semibold text-slate-800">{g.name}</td>
                                                <td className="py-4 px-4">
                                                    <div className="font-bold text-blue-600">{formatIDR(g.currentAmount as string)}</div>
                                                    <div className="text-xs text-slate-500 mt-1">{percentage.toFixed(0)}% Tercapai</div>
                                                </td>
                                                <td className="py-4 px-4 font-medium text-slate-600">{formatIDR(g.targetAmount as string)}</td>
                                                <td className="py-4 px-4 text-sm text-slate-600 flex items-center gap-2 mt-2">
                                                    <CalendarDays className="w-4 h-4 text-slate-400" />
                                                    {g.deadline ? new Date(g.deadline).toLocaleDateString('id-ID') : 'Tanpa Tenggat'}
                                                </td>
                                                <td className="py-4 px-4">
                                                    <div className="flex justify-end">
                                                        <GoalActions goal={{
                                                            id: g.id,
                                                            name: g.name,
                                                            targetAmount: Number(g.targetAmount),
                                                            deadline: g.deadline
                                                        }} />
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}