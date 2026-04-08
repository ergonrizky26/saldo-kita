import { createClient } from '../../../lib/supabase';
import { db } from '../../../db';
import { users, categories } from '../../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Tags, PlusCircle } from 'lucide-react';
import CategoryActions from '../../../components/CategoryActions';
import { createCategory } from '../../../lib/actions';


export default async function CategoriesPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/');

    const dbUser = await db.select().from(users).where(eq(users.id, user.id));
    const REAL_HOUSEHOLD_ID = dbUser[0]?.householdId;
    if (!REAL_HOUSEHOLD_ID) redirect('/');

    // Tarik semua kategori
    const dbCategories = await db.select().from(categories)
        .where(eq(categories.householdId, REAL_HOUSEHOLD_ID));

    const expenses = dbCategories.filter(c => c.type === 'Expense');
    const incomes = dbCategories.filter(c => c.type === 'Income');

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <div className="max-w-4xl mx-auto p-4 md:p-8 pt-8">

                <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 font-medium mb-6 transition">
                    <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
                </Link>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-blue-100 p-3 rounded-xl text-blue-600"><Tags className="w-6 h-6" /></div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800">Kategori Transaksi</h1>
                            <p className="text-sm text-slate-500">Kelola kategori untuk merapikan pembukuan Anda</p>
                        </div>
                    </div>

                    {/* FORM TAMBAH KATEGORI */}
                    <form action={async (formData) => { await createCategory(formData); }} className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col sm:flex-row gap-3 items-end">
                        <div className="flex-1 w-full">
                            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">Nama Kategori Baru</label>
                            <input name="name" required placeholder="Contoh: Kopi, Gaji, Kosan..." className="w-full p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div className="w-full sm:w-48">
                            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">Tipe</label>
                            <select name="type" className="w-full p-2.5 border border-slate-300 rounded-lg outline-none bg-white">
                                <option value="Expense">Pengeluaran</option>
                                <option value="Income">Pemasukan</option>
                            </select>
                        </div>
                        <button type="submit" className="w-full sm:w-auto bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 font-bold flex items-center justify-center gap-2 transition">
                            <PlusCircle className="w-4 h-4" /> Tambah
                        </button>
                    </form>
                </div>

                {/* LIST KATEGORI */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* KOLOM PENGELUARAN */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h2 className="font-bold text-red-600 mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-600"></span> Pengeluaran
                        </h2>
                        <div className="space-y-2">
                            {expenses.length === 0 ? <p className="text-sm text-slate-400">Belum ada kategori.</p> : expenses.map(cat => (
                                <div key={cat.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <span className="font-medium text-slate-700">{cat.name}</span>
                                    <CategoryActions category={{ id: cat.id, name: cat.name }} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* KOLOM PEMASUKAN */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <h2 className="font-bold text-green-600 mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-600"></span> Pemasukan
                        </h2>
                        <div className="space-y-2">
                            {incomes.length === 0 ? <p className="text-sm text-slate-400">Belum ada kategori.</p> : incomes.map(cat => (
                                <div key={cat.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <span className="font-medium text-slate-700">{cat.name}</span>
                                    <CategoryActions category={{ id: cat.id, name: cat.name }} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}