import React from 'react';
// Menggunakan relative path untuk menghindari error "@/"
import { db } from '../../db';
import { accounts, transactions, categories, budgets, goals } from '../../db/schema';
import { eq, and, desc, or, sql, isNull } from 'drizzle-orm';
import {
    Wallet, ArrowRightLeft, TrendingUp, TrendingDown,
    AlertCircle, Users, CreditCard, Building2, Landmark, UserCircle, Tags
} from 'lucide-react';

// Tambahkan import ini di bagian atas
import { createClient } from '../../lib/supabase';
import { users } from '../../db/schema';
import { redirect } from 'next/navigation';
import PairingModal from '../../components/PairingModal';
import TransactionModal from '../../components/TransactionModal';
import AddAccountModal from '../../components/AddAccountModal';
import AddBudgetModal from '../../components/AddBudgetModal';
import AddDebtModal from '../../components/AddDebtModal';
import LogoutButton from '../../components/LogoutButton';
import SettleDebtModal from '../../components/SettleDebtModal';
import GoalsSection from '../../components/GoalsSection';
import TransactionAction from '../../components/TransactionAction';
import DebtActions from '../../components/DebtActions';
import AnalyticsCharts from '../../components/AnalyticsCharts';
import Link from 'next/link';
import TransactionFilterList from '../../components/TransactionFilterList';
import GlobalFilter from '../../components/GlobalFilter';
import AutoProcessor from '../../components/AutoProcessor';
import AddRecurringModal from '../../components/AddRecurringModal';
import { recurringTemplates } from '../../db/schema';


type DashboardProps = {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};
export default async function DashboardPage(props: DashboardProps) {
    const searchParams = await props.searchParams;

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    // Jika belum login, tendang ke halaman depan
    if (authError || !user) {
        redirect('/');
    }

    // --- AMBIL REAL HOUSEHOLD ID ---
    const dbUser = await db.select().from(users).where(eq(users.id, user.id));
    if (!dbUser || dbUser.length === 0) {
        return <div>Akun sedang disetup, silakan refresh...</div>;
    }

    const REAL_HOUSEHOLD_ID = dbUser[0].householdId;
    const userName = dbUser[0].name;

    // === TRIGGER MESIN OTOMASI DI SINI ===
    const dbTemplates = await db.select({ id: recurringTemplates.id }).from(recurringTemplates).where(eq(recurringTemplates.householdId, REAL_HOUSEHOLD_ID));
    const templateCount = dbTemplates.length;
    // ====================================

    const dbCategories = await db.select().from(categories).where(eq(categories.type, 'Expense'));

    // --- LOGIKA FILTER GLOBAL ---
    const viewParam = typeof searchParams.view === 'string' ? searchParams.view : 'ALL';
    const isFiltered = viewParam !== 'ALL';
    const filterUserId = isFiltered ? viewParam : null;


    try {
        // --- 1. AMBIL DATA KOMPOSISI KATEGORI PENGELUARAN ---
        const dbCategoryStats = await db.select({
            name: categories.name,
            value: sql<number>`SUM(CAST(${transactions.amount} AS NUMERIC))`
        })
            .from(transactions)
            .leftJoin(categories, eq(transactions.categoryId, categories.id))
            .where(and(
                eq(transactions.householdId, REAL_HOUSEHOLD_ID),
                eq(transactions.type, 'Expense'),
                // Tambahkan as string di sini
                filterUserId ? eq(transactions.createdBy, filterUserId as string) : undefined
            ))
            .groupBy(categories.name);

        // Filter null values (misal jika ada transaksi expense tanpa kategori) dan format
        const formattedCategoryData = dbCategoryStats
            // .filter(stat => stat.name !== null)
            .map(stat => ({
                name: stat.name || 'Tanpa Kategori',
                value: Number(stat.value)
            }));

        // --- 2. AMBIL DATA TREN BULANAN (Pemasukan vs Pengeluaran) ---
        // Cara sederhana: Ambil semua transaksi tahun ini, lalu kelompokkan di JavaScript
        const currentYearStr = new Date().getFullYear().toString();
        const dbAllYearTransactions = await db.select({
            type: transactions.type,
            amount: transactions.amount,
            date: transactions.date,
        })
            .from(transactions)
            .where(and(
                eq(transactions.householdId, REAL_HOUSEHOLD_ID),
                sql`EXTRACT(YEAR FROM ${transactions.date}) = ${currentYearStr}`,
                filterUserId ? eq(transactions.createdBy, filterUserId as string) : undefined
            ));

        // Mengelompokkan data per bulan
        const monthlySummary: Record<string, { Income: number, Expense: number }> = {};
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];

        // Inisialisasi 12 bulan (opsional, agar grafiknya penuh, atau cukup bulan yang ada datanya saja)
        // Di sini kita hanya akan menampilkan bulan yang ada sampai bulan berjalan
        const currentMonthNum = new Date().getMonth();
        for (let i = 0; i <= currentMonthNum; i++) {
            monthlySummary[monthNames[i]] = { Income: 0, Expense: 0 };
        }

        dbAllYearTransactions.forEach(tx => {
            const txMonth = new Date(tx.date).getMonth();
            const monthName = monthNames[txMonth];

            // Jika transaksinya di tahun ini tapi bulannya di atas bulan ini (asumsi salah input tgl depan), kita abaikan dulu, atau bisa di include.
            if (!monthlySummary[monthName]) {
                monthlySummary[monthName] = { Income: 0, Expense: 0 };
            }

            if (tx.type === 'Income') {
                monthlySummary[monthName].Income += Number(tx.amount);
            } else if (tx.type === 'Expense') {
                monthlySummary[monthName].Expense += Number(tx.amount);
            }
        });

        // Ubah object menjadi array untuk Recharts
        const formattedMonthlyData = Object.keys(monthlySummary).map(key => ({
            month: key,
            Income: monthlySummary[key].Income,
            Expense: monthlySummary[key].Expense
        }));

        // --- 1. DATA FETCHING DARI POSTGRESQL (REAL DATA) ---
        const dbGoals = await db.select().from(goals)
            .where(eq(goals.householdId, REAL_HOUSEHOLD_ID))
            .orderBy(desc(goals.createdAt));

        const allCategories = await db.select().from(categories);
        const expenseCategories = allCategories.filter(c => c.type === 'Expense');
        // AMBIL AKUN (Jika difilter, tampilkan akun milik pribadi user tersebut + akun bersama/null)
        const dbAccounts = await db.select().from(accounts)
            .where(and(
                eq(accounts.householdId, REAL_HOUSEHOLD_ID),
                eq(accounts.isActive, true),
                filterUserId ? or(eq(accounts.ownerId, filterUserId as string), isNull(accounts.ownerId)) : undefined
            ));

        const dbDebts = await db.select().from(transactions)
            .where(
                and(
                    eq(transactions.householdId, REAL_HOUSEHOLD_ID),
                    or(eq(transactions.type, 'Utang'), eq(transactions.type, 'Piutang')),
                    eq(transactions.debtStatus, 'Belum Lunas'),
                    filterUserId ? eq(transactions.createdBy, filterUserId as string) : undefined
                )
            );

        const recentTransactions = await db.select({
            id: transactions.id,
            type: transactions.type,
            amount: transactions.amount,
            date: transactions.date,
            categoryName: categories.name,
            description: transactions.description,
            createdBy: transactions.createdBy,
        })
            .from(transactions)
            .leftJoin(categories, eq(transactions.categoryId, categories.id))
            .where(and(
                eq(transactions.householdId, REAL_HOUSEHOLD_ID),
                filterUserId ? eq(transactions.createdBy, filterUserId as string) : undefined // <--- INI FILTERNYA
            ))
            .orderBy(desc(transactions.date), desc(transactions.createdAt))
            .limit(5);

        const dbMembers = await db.select({
            id: users.id,
            name: users.name,
        }).from(users).where(eq(users.householdId, REAL_HOUSEHOLD_ID));

        // Format agar komponen tahu mana yang 'Saya'
        const formattedMembers = dbMembers.map(m => ({
            id: m.id,
            name: m.name,
            isMe: m.id === user.id
        }));

        // (Di dalam blok try, sebelum kalkulasi Net Worth)
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        const dbBudgets = await db.select({
            id: budgets.id,
            categoryName: categories.name,
            amountLimit: budgets.amountLimit,
            // Subquery untuk menghitung total pengeluaran di kategori dan bulan ini
            spent: sql<number>`COALESCE((
    SELECT SUM(amount) FROM ${transactions}
    WHERE category_id = ${budgets.categoryId}
    AND EXTRACT(MONTH FROM date) = ${currentMonth}
    AND EXTRACT(YEAR FROM date) = ${currentYear}
    AND type = 'Expense'
    ${filterUserId ? sql`AND created_by = ${filterUserId as string}` : sql``}
  ), 0)`
        })
            .from(budgets)
            .leftJoin(categories, eq(budgets.categoryId, categories.id))
            .where(and(
                eq(budgets.householdId, REAL_HOUSEHOLD_ID),
                eq(budgets.month, currentMonth),
                eq(budgets.year, currentYear)
            ));

        // --- 2. KALKULASI NET WORTH ---
        // Field decimal di PostgreSQL direturn sebagai string, kita parse ke Number
        const totalAssets = dbAccounts.reduce((sum, acc) => sum + Number(acc.balance), 0);
        const totalPiutang = dbDebts.filter(d => d.type === 'Piutang').reduce((sum, d) => sum + Number(d.amount), 0);
        const totalUtang = dbDebts.filter(d => d.type === 'Utang').reduce((sum, d) => sum + Number(d.amount), 0);

        const netWorth = (totalAssets + totalPiutang) - totalUtang;
        const isNegativeNetWorth = netWorth < 0;

        const formatIDR = (num: number) => {
            return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
        };

        return (
            <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 md:p-8">
                <header className="max-w-6xl mx-auto flex justify-between items-center mb-6 pt-4 px-4 md:px-0">
                    <div className="flex items-center gap-2">
                        <div className="bg-indigo-600 p-2 rounded-lg"><Wallet className="text-white w-5 h-5 md:w-6 md:h-6" /></div>
                        <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-800">Saldo<span className="text-indigo-600">Kita</span></h1>
                    </div>

                    {/* TAMBAHKAN hidden md:flex DI SINI AGAR HILANG DI HP */}
                    <div className="hidden md:flex items-center gap-2">
                        <PairingModal />
                        <Link href="/dashboard/profile" className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors ml-1" title="Profil Akun">
                            <UserCircle className="w-6 h-6" />
                        </Link>
                        <LogoutButton />
                    </div>
                </header>

                <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* LEFT COLUMN */}
                    <div className="lg:col-span-2 space-y-6">

                        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            {/* TAB FILTER DITARUH DI SINI, RATA KIRI, DI ATAS TOTAL SALDO */}
                            <GlobalFilter members={formattedMembers} />
                            {/* BANNER NOTIFIKASI OTOMASI (Hanya muncul jika ada yang diproses) */}
                            <AutoProcessor key={templateCount} householdId={REAL_HOUSEHOLD_ID} />
                            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Total Kekayaan Bersih (Net Worth)</h2>
                            <div className={`text-4xl font-bold ${isNegativeNetWorth ? 'text-red-600' : 'text-slate-800'}`}>
                                {formatIDR(netWorth)}
                            </div>

                            <div className="grid grid-cols-3 gap-4 mt-6">
                                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                    <div className="flex items-center gap-2 text-slate-500 mb-1"><Building2 className="w-4 h-4" /> Aset & Saldo</div>
                                    <div className="font-bold text-slate-700">{formatIDR(totalAssets)}</div>
                                </div>
                                <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                                    <div className="flex items-center gap-2 text-green-600 mb-1"><TrendingUp className="w-4 h-4" /> Piutang</div>
                                    <div className="font-bold text-green-700">{formatIDR(totalPiutang)}</div>
                                </div>
                                <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                                    <div className="flex items-center gap-2 text-red-600 mb-1"><TrendingDown className="w-4 h-4" /> Utang Pribadi</div>
                                    <div className="font-bold text-red-700">{formatIDR(totalUtang)}</div>
                                </div>
                            </div>
                        </section>

                        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-lg font-bold text-slate-800">Akun Keuangan</h2>
                                <div className="flex gap-3">
                                    {/* Tombol ke halaman manajemen */}
                                    <Link href="/dashboard/accounts" className="text-sm text-slate-500 font-medium hover:text-slate-800 transition">
                                        Kelola Akun
                                    </Link>
                                    {/* Modal tambah akun lama */}
                                    <AddAccountModal />
                                </div>
                            </div>

                            {dbAccounts.length === 0 ? (
                                <div className="text-center p-6 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500 text-sm">
                                    Belum ada akun keuangan di Database. Silakan buat akun baru via Drizzle Studio.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {dbAccounts.map(acc => (
                                        <div key={acc.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:shadow-md transition-shadow">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-blue-50 p-2 rounded-lg">
                                                    {acc.type === 'Bank' ? <Landmark className="w-5 h-5 text-blue-600" /> :
                                                        acc.type === 'E-wallet' ? <CreditCard className="w-5 h-5 text-blue-600" /> :
                                                            <Wallet className="w-5 h-5 text-blue-600" />}
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-slate-800">{acc.name}</h3>
                                                    <p className="text-xs text-slate-500">{acc.type}</p>
                                                </div>
                                            </div>
                                            <div className="font-bold text-slate-700">{formatIDR(Number(acc.balance))}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <AnalyticsCharts
                                monthlyData={formattedMonthlyData}
                                categoryData={formattedCategoryData}
                            />
                        </section>

                        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-lg font-bold text-slate-800">Riwayat Transaksi</h2>
                                {/* <Link href="/dashboard/transactions" className="text-sm text-blue-600 font-medium hover:underline">
                                    Lihat Semua
                                </Link> */}
                                {/* DUA TOMBOL BERSEBELAHAN */}
                                <div className="flex items-center gap-4">
                                    <Link href="/dashboard/categories" className="text-sm text-slate-500 font-medium hover:text-slate-800 transition flex items-center gap-1">
                                        <Tags className="w-4 h-4" /> Kelola Kategori
                                    </Link>
                                    <span className="w-px h-4 bg-slate-300"></span> {/* Garis pemisah kecil */}
                                    <Link href="/dashboard/transactions" className="text-sm text-blue-600 font-medium hover:underline">
                                        Lihat Semua
                                    </Link>
                                </div>
                            </div>

                            {/* PANGGIL KOMPONEN FILTER DI SINI */}
                            <TransactionFilterList
                                transactions={recentTransactions}
                                members={formattedMembers}
                            />

                            {/* {recentTransactions.length === 0 ? (
                                <div className="text-center p-6 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500 text-sm">
                                    Belum ada riwayat transaksi yang tercatat.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {recentTransactions.map(tx => (
                                        <div key={tx.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2 rounded-full ${tx.type === 'Income' ? 'bg-green-100 text-green-600' :
                                                    tx.type === 'Expense' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                                    }`}>
                                                    {tx.type === 'Income' ? <TrendingUp className="w-4 h-4" /> :
                                                        tx.type === 'Expense' ? <TrendingDown className="w-4 h-4" /> :
                                                            <ArrowRightLeft className="w-4 h-4" />}
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-slate-800">{tx.categoryName || tx.description || tx.type}</h4>
                                                    <p className="text-xs text-slate-500">{new Date(tx.date).toLocaleDateString('id-ID')}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center">
                                                <div className={`font-bold ${tx.type === 'Income' ? 'text-green-600' :
                                                    tx.type === 'Expense' ? 'text-slate-800' : 'text-slate-600'
                                                    }`}>
                                                    {tx.type === 'Expense' ? '-' : tx.type === 'Income' ? '+' : ''}{formatIDR(Number(tx.amount))}
                                                </div>
                                                <TransactionAction id={tx.id} type={tx.type} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )} */}
                        </section>

                        <GoalsSection
                            accounts={dbAccounts}
                            goals={dbGoals.map(g => ({
                                id: g.id,
                                name: g.name,
                                targetAmount: Number(g.targetAmount),
                                currentAmount: Number(g.currentAmount),
                                deadline: g.deadline
                            }))}
                        />
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="space-y-6">
                        <TransactionModal accounts={dbAccounts} categories={allCategories} />

                        {/* BUDGETING SECTION */}
                        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-lg font-bold text-slate-800">Progress Budget Bulan Ini</h2>
                                <AddBudgetModal categories={expenseCategories} />
                            </div>

                            {dbBudgets.length === 0 ? (
                                <p className="text-sm text-slate-500">Belum ada budget diset untuk bulan ini.</p>
                            ) : (
                                <div className="space-y-6">
                                    {dbBudgets.map(budget => {
                                        const limit = Number(budget.amountLimit);
                                        const spent = Number(budget.spent);
                                        const percentage = limit > 0 ? (spent / limit) * 100 : 0;
                                        const isWarning = percentage >= 80;

                                        return (
                                            <div key={budget.id} className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="font-semibold text-slate-700">{budget.categoryName}</span>
                                                    <span className="text-slate-500">{formatIDR(spent)} / {formatIDR(limit)}</span>
                                                </div>
                                                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden relative">
                                                    <div
                                                        className={`h-2.5 rounded-full transition-all duration-500 ${isWarning ? 'bg-red-500' : 'bg-blue-500'}`}
                                                        style={{ width: `${Math.min(percentage, 100)}%` }}
                                                    ></div>
                                                </div>
                                                {isWarning && (
                                                    <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
                                                        <AlertCircle className="w-3 h-3" />
                                                        <span>Hati-hati! Budget sudah mencapai {percentage.toFixed(0)}%</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </section>
                        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <h2 className="text-lg font-bold text-slate-800 mb-4">Pengingat Utang Piutang</h2>

                            <AddDebtModal accounts={dbAccounts} />

                            {dbDebts.length === 0 ? (
                                <p className="text-sm text-slate-500">Tidak ada tanggungan utang/piutang aktif.</p>
                            ) : (
                                <div className="space-y-3">
                                    {dbDebts.map(debt => (
                                        <div key={debt.id} className="flex justify-between items-center p-3 bg-slate-50 border border-slate-100 rounded-lg">
                                            <div>
                                                <h4 className="text-sm font-semibold text-slate-700">{debt.counterparty}</h4>
                                                <p className={`text-xs ${debt.type === 'Piutang' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {debt.type} • {debt.debtStatus}
                                                </p>
                                            </div>
                                            <span className="font-bold text-slate-800 text-sm">{formatIDR(Number(debt.amount))}</span>
                                            {/* TAMBAHKAN TOMBOL PELUNASAN DI SINI */}
                                            <SettleDebtModal
                                                accounts={dbAccounts}
                                                debt={{
                                                    id: debt.id,
                                                    counterparty: debt.counterparty || '',
                                                    type: debt.type || '',
                                                    amount: Number(debt.amount)
                                                }}
                                            />
                                            <DebtActions
                                                debt={{
                                                    id: debt.id,
                                                    counterparty: debt.counterparty || '',
                                                    dueDate: debt.dueDate
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                </main>
            </div>
        );
    } catch (error) {
        console.error("Failed to load database:", error);
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center bg-red-50 p-8 rounded-xl border border-red-200">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-red-700">Koneksi Database Gagal</h2>
                    <p className="text-red-600 mt-2">Pastikan server database Anda menyala dan kredensial di `.env.local` sudah benar.</p>
                </div>
            </div>
        );
    }
}