import { createClient } from '../../../lib/supabase';
import { db } from '../../../db';
import { users, households } from '../../../db/schema';
import { eq, asc } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, UserCircle, Crown, Heart, User, CheckCircle2, Save } from 'lucide-react';
import EditHouseholdForm from '../../../components/EditHouseholdForm';

// Helper untuk icon di Placeholder
import { Users } from 'lucide-react';

export default async function ProfilePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/');

    // 1. Ambil data Household ID dari user yang sedang login
    const dbUser = await db.select().from(users).where(eq(users.id, user.id));
    const REAL_HOUSEHOLD_ID = dbUser[0]?.householdId;
    if (!REAL_HOUSEHOLD_ID) redirect('/');

    // 2. Ambil detail Household
    const [household] = await db.select().from(households).where(eq(households.id, REAL_HOUSEHOLD_ID));

    // 3. Ambil SEMUA anggota di dalam household ini (Diurutkan dari yang paling lama mendaftar ke yang baru)
    const members = await db.select().from(users)
        .where(eq(users.householdId, REAL_HOUSEHOLD_ID))
        .orderBy(asc(users.createdAt));

    // LOGIKA PENENTUAN PERAN (ROLE)
    const isSingle = members.length === 1;
    const owner = members[0]; // Orang pertama selalu Owner
    const partner = members.length > 1 ? members[1] : null; // Orang kedua adalah Partner

    // Tentukan role untuk user yang sedang melihat layar saat ini
    let myRole = 'Single';
    let myPartnerName = '';

    if (!isSingle) {
        if (user.id === owner.id) {
            myRole = 'Owner';
            myPartnerName = partner?.name || '';
        } else {
            myRole = 'Partner';
            myPartnerName = owner.name;
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <div className="max-w-3xl mx-auto p-4 md:p-8 pt-8">

                {/* Navigasi Back */}
                <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-600 font-medium mb-6 transition">
                    <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
                </Link>

                {/* HEADER */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="bg-blue-100 p-4 rounded-full text-blue-600">
                            <UserCircle className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">Profil & Keamanan</h1>
                            <p className="text-sm text-slate-500">Kelola identitas dan koneksi akun pasangan Anda</p>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <p className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Couple / Household ID</p>
                            <p className="text-sm font-mono text-slate-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200 inline-block">{household.id}</p>
                        </div>

                        {/* FORM EDIT NAMA PASANGAN */}
                        <EditHouseholdForm defaultName={household.name} />
                    </div>
                </div>

                {/* ANGGOTA KELUARGA / PASANGAN */}
                <h2 className="text-lg font-bold text-slate-800 mb-4 px-2">Informasi Akun</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* CARD 1: KITA SENDIRI (Atau Owner) */}
                    <div className={`p-6 rounded-2xl border ${myRole === 'Owner' ? 'bg-blue-50/50 border-blue-200' : 'bg-white border-slate-200'} shadow-sm relative overflow-hidden`}>
                        {user.id === owner.id && <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">ANDA</div>}

                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 border-2 border-white shadow-sm">
                                    <User className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 text-lg">{owner.name}</h3>
                                    <p className="text-sm text-slate-500">{owner.email}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3 mt-6">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500">Status Akun</span>
                                <span className="flex items-center gap-1 text-green-600 font-medium bg-green-50 px-2 py-1 rounded-md">
                                    <CheckCircle2 className="w-4 h-4" /> Aktif
                                </span>
                            </div>

                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500">Peran (Role)</span>
                                <span className={`flex items-center gap-1.5 font-bold px-2.5 py-1 rounded-md
                    ${isSingle ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-700'}`}>
                                    {isSingle ? <User className="w-4 h-4" /> : <Crown className="w-4 h-4" />}
                                    {isSingle ? 'Single' : 'Owner'}
                                </span>
                            </div>

                            {!isSingle && (
                                <div className="pt-3 border-t border-slate-100/50 mt-3">
                                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                                        <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500" />
                                        Berpasangan dengan <strong className="text-slate-700">{partner?.name}</strong>
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* CARD 2: PARTNER (Hanya muncul jika sudah berpasangan) */}
                    {!isSingle ? (
                        <div className={`p-6 rounded-2xl border ${myRole === 'Partner' ? 'bg-blue-50/50 border-blue-200' : 'bg-white border-slate-200'} shadow-sm relative overflow-hidden`}>
                            {user.id === partner?.id && <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">ANDA</div>}

                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-pink-50 rounded-full flex items-center justify-center text-pink-400 border-2 border-white shadow-sm">
                                        <User className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 text-lg">{partner?.name}</h3>
                                        <p className="text-sm text-slate-500">{partner?.email}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 mt-6">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500">Status Akun</span>
                                    <span className="flex items-center gap-1 text-green-600 font-medium bg-green-50 px-2 py-1 rounded-md">
                                        <CheckCircle2 className="w-4 h-4" /> Aktif
                                    </span>
                                </div>

                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500">Peran (Role)</span>
                                    <span className="flex items-center gap-1.5 font-bold px-2.5 py-1 rounded-md bg-pink-100 text-pink-700">
                                        <Heart className="w-4 h-4" />
                                        Partner
                                    </span>
                                </div>

                                <div className="pt-3 border-t border-slate-100/50 mt-3">
                                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                                        <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500" />
                                        Berpasangan dengan <strong className="text-slate-700">{owner.name}</strong>
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* CARD PLACEHOLDER UNTUK SINGLE */
                        <div className="p-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-center h-full min-h-[200px]">
                            <div className="bg-white p-3 rounded-full shadow-sm mb-3">
                                <Users className="w-6 h-6 text-slate-400" />
                            </div>
                            <h3 className="font-bold text-slate-700 mb-1">Belum Ada Partner</h3>
                            <p className="text-xs text-slate-500 max-w-[200px]">Gunakan fitur "Partner" di dashboard untuk menghasilkan kode undangan.</p>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
