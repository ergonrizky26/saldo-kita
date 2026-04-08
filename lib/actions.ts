"use server";

import { db } from '../db';
import { accounts, transactions, pairingCodes, users, budgets, goals, households, categories } from '../db/schema';
import { eq, and, sql, or, desc, isNull, ne } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { createClient } from './supabase';
import { redirect } from 'next/navigation';
import { recurringTemplates } from '../db/schema';

// Helper untuk mengambil session real dari Supabase & Drizzle
async function getRealSession() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const dbUser = await db.select().from(users).where(eq(users.id, user.id));
    return dbUser[0] || null; // Return data user lengkap dengan householdId
}

// FUNGSI BARU: Mengambil status rumah tangga & Kode Aktif
export async function getPairingStatus() {
    const user = await getRealSession();
    if (!user) return null;

    // Cek jumlah member
    const members = await db.select({ count: sql<number>`count(*)` })
        .from(users).where(eq(users.householdId, user.householdId));

    // Cari kode yang belum digunakan dan belum kedaluwarsa
    const [activeCode] = await db.select()
        .from(pairingCodes)
        .where(
            and(
                eq(pairingCodes.householdId, user.householdId),
                eq(pairingCodes.isUsed, false),
                sql`${pairingCodes.expiresAt} > NOW()`
            )
        )
        .orderBy(desc(pairingCodes.createdAt))
        .limit(1);

    return {
        code: activeCode?.code || null,
        expiresAt: activeCode?.expiresAt || null,
        memberCount: Number(members[0].count)
    };
}

// 4. GENERATE PAIRING CODE (Simpan ke tabel pairingCodes)
export async function generatePairingCode() {
    const user = await getRealSession();
    if (!user) return { error: "Unauthorized" };

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 Jam

    try {
        await db.transaction(async (tx) => {
            // a. Hanguskan semua kode lama yang belum terpakai untuk household ini agar tidak menumpuk
            await tx.update(pairingCodes)
                .set({ isUsed: true })
                .where(
                    and(
                        eq(pairingCodes.householdId, user.householdId),
                        eq(pairingCodes.isUsed, false)
                    )
                );

            // b. Insert kode baru
            await tx.insert(pairingCodes).values({
                code: code,
                householdId: user.householdId,
                createdBy: user.id,
                expiresAt: expiresAt,
                isUsed: false
            });
        });

        revalidatePath('/dashboard');
        return { success: true, code, expiresAt };
    } catch (error: any) {
        return { error: error.message };
    }
}

// 5. JOIN HOUSEHOLD (Validasi dari tabel pairingCodes)
export async function joinHousehold(formData: FormData) {
    const user = await getRealSession();
    if (!user) return { error: "Unauthorized" };

    const code = formData.get('code') as string;
    if (!code) return { error: "Kode tidak boleh kosong" };

    try {
        // a. Pastikan user belum berpasangan
        const myMembers = await db.select({ count: sql<number>`count(*)` })
            .from(users).where(eq(users.householdId, user.householdId));
        if (Number(myMembers[0].count) > 1) {
            return { error: "Anda sudah memiliki partner. Anda tidak bisa bergabung dengan rumah tangga lain." };
        }

        // b. Cari validitas kode di tabel pairingCodes
        const [targetCode] = await db.select().from(pairingCodes)
            .where(
                and(
                    eq(pairingCodes.code, code),
                    eq(pairingCodes.isUsed, false)
                )
            );

        if (!targetCode) return { error: "Kode undangan tidak valid, salah ketik, atau sudah terpakai." };

        // c. Validasi Kedaluwarsa (24 Jam)
        if (new Date() > new Date(targetCode.expiresAt)) {
            return { error: "Kode undangan sudah KEDALUWARSA. Minta partner Anda membuat kode baru." };
        }

        // d. Eksekusi Join dan Burn Code
        await db.transaction(async (tx) => {
            // 1. Pindahkan user ke household partner
            await tx.update(users)
                .set({ householdId: targetCode.householdId })
                .where(eq(users.id, user.id));

            // 2. Hanguskan (Burn) kode tersebut agar isUsed = true
            await tx.update(pairingCodes)
                .set({ isUsed: true })
                .where(eq(pairingCodes.id, targetCode.id));
        });

        revalidatePath('/dashboard');
        return { success: true };
    } catch (error: any) {
        return { error: error.message || "Gagal bergabung" };
    }
}
// --- END: SECURE PAIRING SYSTEM ---

// // 1. GENERATE KODE UNIK
// export async function generatePairingCode() {
//     const user = await getRealSession();
//     if (!user) throw new Error("Unauthorized");

//     // Generate 6 digit alphanumeric random
//     const code = Math.random().toString(36).substring(2, 8).toUpperCase();

//     // Berlaku untuk 24 Jam
//     const expiresAt = new Date();
//     expiresAt.setHours(expiresAt.getHours() + 24);

//     await db.insert(pairingCodes).values({
//         code,
//         householdId: user.householdId,
//         createdBy: user.id,
//         expiresAt,
//     });

//     revalidatePath('/dashboard');
//     return code;
// }

// // 2. JOIN MENGGUNAKAN KODE
// export async function joinPartner(code: string) {
//     const user = await getRealSession();
//     if (!user) throw new Error("Unauthorized");

//     // Cari kode yang valid, belum kedaluwarsa, dan belum dipakai
//     const [validCode] = await db.select().from(pairingCodes)
//         .where(and(
//             eq(pairingCodes.code, code.toUpperCase()),
//             eq(pairingCodes.isUsed, false)
//         ));

//     if (!validCode) {
//         return { error: "Kode tidak valid atau sudah digunakan." };
//     }

//     if (new Date() > validCode.expiresAt) {
//         return { error: "Kode sudah kedaluwarsa." };
//     }

//     if (validCode.householdId === user.householdId) {
//         return { error: "Anda sudah berada di household ini." };
//     }

//     try {
//         // Jalankan secara atomik
//         await db.transaction(async (tx) => {
//             // a. Pindahkan user ini ke household partner
//             await tx.update(users)
//                 .set({ householdId: validCode.householdId })
//                 .where(eq(users.id, user.id));

//             // b. Tandai kode sudah terpakai
//             await tx.update(pairingCodes)
//                 .set({ isUsed: true })
//                 .where(eq(pairingCodes.id, validCode.id));
//         });

//         revalidatePath('/dashboard');
//         return { success: true };
//     } catch (error) {
//         return { error: "Terjadi kesalahan saat menggabungkan akun." };
//     }
// }

// --- TAMBAHKAN KODE DI BAWAH INI ---

// 3. CATAT TRANSAKSI (ATOMIC)
export async function createTransaction(formData: FormData) {
    const user = await getRealSession();
    if (!user) return { error: "Unauthorized" };

    const type = formData.get('type') as 'Income' | 'Expense' | 'Transfer';
    const amount = parseFloat(formData.get('amount') as string);
    const dateStr = formData.get('date') as string;
    const description = formData.get('description') as string;
    const accountId = formData.get('accountId') as string;
    const toAccountId = formData.get('toAccountId') as string;
    const categoryId = formData.get('categoryId') as string;

    if (amount <= 0) return { error: "Jumlah harus lebih besar dari 0" };
    if (!accountId) return { error: "Pilih akun terlebih dahulu" };

    try {
        await db.transaction(async (tx) => {
            // a. Update Saldo Akun
            if (type === 'Expense') {
                await tx.update(accounts)
                    .set({ balance: sql`${accounts.balance} - ${amount}` })
                    .where(and(eq(accounts.id, accountId), eq(accounts.householdId, user.householdId)));
            } else if (type === 'Income') {
                await tx.update(accounts)
                    .set({ balance: sql`${accounts.balance} + ${amount}` })
                    .where(and(eq(accounts.id, accountId), eq(accounts.householdId, user.householdId)));
            } else if (type === 'Transfer') {
                if (!toAccountId) throw new Error("Pilih akun tujuan transfer");
                // Kurangi pengirim
                await tx.update(accounts)
                    .set({ balance: sql`${accounts.balance} - ${amount}` })
                    .where(and(eq(accounts.id, accountId), eq(accounts.householdId, user.householdId)));
                // Tambah penerima
                await tx.update(accounts)
                    .set({ balance: sql`${accounts.balance} + ${amount}` })
                    .where(and(eq(accounts.id, toAccountId), eq(accounts.householdId, user.householdId)));
            }

            // b. Catat ke History Transaksi
            await tx.insert(transactions).values({
                householdId: user.householdId,
                createdBy: user.id,
                type: type,
                amount: amount.toString(),
                date: new Date(dateStr),
                description: description,
                categoryId: categoryId ? categoryId : null,
                fromAccountId: type === 'Expense' || type === 'Transfer' ? accountId : null,
                toAccountId: type === 'Income' || type === 'Transfer' ? (type === 'Transfer' ? toAccountId : accountId) : null,
            });
        });

        revalidatePath('/dashboard');
        return { success: true };
    } catch (error: any) {
        return { error: error.message || "Gagal mencatat transaksi" };
    }
}

// BANTUAN LOGIKA: Menerjemahkan Kepemilikan menjadi ownerId
async function resolveOwnerId(ownership: string, userId: string, householdId: string) {
    if (ownership === 'ME') return userId;
    if (ownership === 'JOINT') return null; // Null berarti milik bersama

    if (ownership === 'PARTNER') {
        // Cari ID anggota lain di rumah tangga yang sama
        const [partner] = await db.select().from(users)
            .where(and(eq(users.householdId, householdId), ne(users.id, userId)));
        return partner ? partner.id : null;
    }
    return null;
}

// 4. BUAT AKUN KEUANGAN BARU
export async function createAccount(formData: FormData) {
    const user = await getRealSession();
    if (!user) return { error: "Unauthorized" };

    const name = formData.get('name') as string;
    const type = formData.get('type') as 'Bank' | 'E-wallet' | 'Cash';
    const balance = formData.get('balance') as string;
    const ownership = formData.get('ownership') as string; // 'ME', 'PARTNER', 'JOINT'

    if (!name || !balance) return { error: "Data tidak lengkap" };

    try {
        const ownerId = await resolveOwnerId(ownership, user.id, user.householdId);

        await db.insert(accounts).values({
            householdId: user.householdId,
            ownerId: ownerId, // <--- Simpan ownerId di sini
            name,
            type,
            balance,
        });

        revalidatePath('/dashboard');
        return { success: true };
    } catch (error: any) {
        return { error: error.message || "Gagal membuat akun" };
    }
}

// 5. BUAT BUDGET BARU
export async function createBudget(formData: FormData) {
    const user = await getRealSession();
    if (!user) return { error: "Unauthorized" };

    const categoryId = formData.get('categoryId') as string;
    const amountLimit = parseFloat(formData.get('amountLimit') as string);
    const month = parseInt(formData.get('month') as string);
    const year = parseInt(formData.get('year') as string);

    if (!categoryId) return { error: "Pilih kategori terlebih dahulu" };
    if (amountLimit <= 0) return { error: "Batas budget harus lebih dari 0" };

    try {
        // Cek apakah budget untuk kategori ini di bulan ini sudah ada
        const existingBudget = await db.select().from(budgets)
            .where(and(
                eq(budgets.householdId, user.householdId),
                eq(budgets.categoryId, categoryId),
                eq(budgets.month, month),
                eq(budgets.year, year)
            ));

        if (existingBudget.length > 0) {
            // Jika sudah ada, update (opsional, untuk sementara kita batasi 1 saja)
            return { error: "Budget untuk kategori ini di bulan yang sama sudah ada." };
        }

        await db.insert(budgets).values({
            householdId: user.householdId,
            categoryId,
            amountLimit: amountLimit.toString(),
            month,
            year,
        });

        revalidatePath('/dashboard');
        return { success: true };
    } catch (error: any) {
        return { error: error.message || "Gagal membuat budget" };
    }
}


// 6. CATAT UTANG / PIUTANG BARU
export async function createDebt(formData: FormData) {
    const user = await getRealSession();
    if (!user) return { error: "Unauthorized" };

    const type = formData.get('type') as 'Utang' | 'Piutang';
    const amount = parseFloat(formData.get('amount') as string);
    const counterparty = formData.get('counterparty') as string;
    const dueDateStr = formData.get('dueDate') as string;
    const accountId = formData.get('accountId') as string;

    if (amount <= 0) return { error: "Jumlah harus lebih besar dari 0" };
    if (!accountId) return { error: "Pilih akun yang digunakan" };
    if (!counterparty) return { error: "Nama pihak terkait harus diisi" };

    try {
        await db.transaction(async (tx) => {
            // a. Update Saldo (Utang menambah uang kas kita, Piutang mengurangi uang kas kita)
            if (type === 'Utang') {
                await tx.update(accounts)
                    .set({ balance: sql`${accounts.balance} + ${amount}` })
                    .where(and(eq(accounts.id, accountId), eq(accounts.householdId, user.householdId)));
            } else if (type === 'Piutang') {
                await tx.update(accounts)
                    .set({ balance: sql`${accounts.balance} - ${amount}` })
                    .where(and(eq(accounts.id, accountId), eq(accounts.householdId, user.householdId)));
            }

            // b. Catat ke tabel transaksi
            await tx.insert(transactions).values({
                householdId: user.householdId,
                createdBy: user.id,
                type: type,
                amount: amount.toString(),
                date: new Date(), // Tanggal dicatat
                counterparty: counterparty,
                debtStatus: 'Belum Lunas',
                dueDate: new Date(dueDateStr),
                fromAccountId: type === 'Piutang' ? accountId : null,
                toAccountId: type === 'Utang' ? accountId : null,
                description: `Pencatatan ${type} - ${counterparty}`,
            });
        });

        revalidatePath('/dashboard');
        return { success: true };
    } catch (error: any) {
        return { error: error.message || "Gagal mencatat utang/piutang" };
    }
}

// 7. LUNASI UTANG / PIUTANG
export async function settleDebt(transactionId: string, accountId: string, type: string, amount: number) {
    const user = await getRealSession();
    if (!user) return { error: "Unauthorized" };

    try {
        await db.transaction(async (tx) => {
            // a. Update Saldo kebalikannya (Bayar Utang = saldo ngurang, Terima Piutang = saldo nambah)
            if (type === 'Utang') {
                await tx.update(accounts)
                    .set({ balance: sql`${accounts.balance} - ${amount}` })
                    .where(and(eq(accounts.id, accountId), eq(accounts.householdId, user.householdId)));
            } else if (type === 'Piutang') {
                await tx.update(accounts)
                    .set({ balance: sql`${accounts.balance} + ${amount}` })
                    .where(and(eq(accounts.id, accountId), eq(accounts.householdId, user.householdId)));
            }

            // b. Ubah status transaksi jadi Lunas
            await tx.update(transactions)
                .set({ debtStatus: 'Lunas' })
                .where(and(eq(transactions.id, transactionId), eq(transactions.householdId, user.householdId)));
        });

        revalidatePath('/dashboard');
        return { success: true };
    } catch (error: any) {
        return { error: error.message || "Gagal melunasi" };
    }
}


// 8. LOGOUT
export async function logoutUser() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/'); // Kembali ke halaman login
}

// 9. BUAT FINANCIAL GOAL
export async function createGoal(formData: FormData) {
    const user = await getRealSession();
    if (!user) return { error: "Unauthorized" };

    const name = formData.get('name') as string;
    const targetAmount = parseFloat(formData.get('targetAmount') as string);
    const deadlineStr = formData.get('deadline') as string;

    if (!name) return { error: "Nama target harus diisi" };
    if (targetAmount <= 0) return { error: "Target nominal harus lebih dari 0" };

    try {
        await db.insert(goals).values({
            householdId: user.householdId,
            name,
            targetAmount: targetAmount.toString(),
            deadline: deadlineStr ? new Date(deadlineStr) : null,
        });
        revalidatePath('/dashboard');
        return { success: true };
    } catch (error: any) {
        return { error: error.message || "Gagal membuat target" };
    }
}

// 10. MENABUNG KE GOAL (Memotong Saldo Akun)
export async function fundGoal(goalId: string, accountId: string, amount: number) {
    const user = await getRealSession();
    if (!user) return { error: "Unauthorized" };

    if (amount <= 0) return { error: "Nominal harus lebih dari 0" };

    try {
        await db.transaction(async (tx) => {
            // 1. Kurangi saldo dari akun sumber
            await tx.update(accounts)
                .set({ balance: sql`${accounts.balance} - ${amount}` })
                .where(and(eq(accounts.id, accountId), eq(accounts.householdId, user.householdId)));

            // 2. Tambah progress di tabel goals
            await tx.update(goals)
                .set({ currentAmount: sql`${goals.currentAmount} + ${amount}` })
                .where(and(eq(goals.id, goalId), eq(goals.householdId, user.householdId)));

            // 3. Catat history transaksi sebagai "Tabungan"
            await tx.insert(transactions).values({
                householdId: user.householdId,
                createdBy: user.id,
                type: 'Tabungan',
                amount: amount.toString(),
                date: new Date(),
                description: `Alokasi Tabungan: Target ID ${goalId.substring(0, 5)}...`,
                fromAccountId: accountId,
            });
        });

        revalidatePath('/dashboard');
        return { success: true };
    } catch (error: any) {
        return { error: error.message || "Gagal menabung" };
    }
}

// 11. HAPUS TRANSAKSI (REVERT SALDO OTOMATIS)
export async function deleteTransaction(transactionId: string) {
    const user = await getRealSession();
    if (!user) return { error: "Unauthorized" };

    try {
        await db.transaction(async (tx) => {
            // a. Ambil data transaksi yang mau dihapus
            const [trx] = await tx.select().from(transactions)
                .where(and(eq(transactions.id, transactionId), eq(transactions.householdId, user.householdId)));

            if (!trx) throw new Error("Transaksi tidak ditemukan");

            const amount = parseFloat(trx.amount as string);

            // b. Kembalikan (Revert) Saldo Akun berdasarkan tipe transaksi
            if (trx.type === 'Expense') {
                if (trx.fromAccountId) {
                    await tx.update(accounts).set({ balance: sql`${accounts.balance} + ${amount}` }).where(eq(accounts.id, trx.fromAccountId));
                }
            } else if (trx.type === 'Income') {
                if (trx.toAccountId) {
                    await tx.update(accounts).set({ balance: sql`${accounts.balance} - ${amount}` }).where(eq(accounts.id, trx.toAccountId));
                }
            } else if (trx.type === 'Transfer') {
                if (trx.fromAccountId) {
                    await tx.update(accounts).set({ balance: sql`${accounts.balance} + ${amount}` }).where(eq(accounts.id, trx.fromAccountId));
                }
                if (trx.toAccountId) {
                    await tx.update(accounts).set({ balance: sql`${accounts.balance} - ${amount}` }).where(eq(accounts.id, trx.toAccountId));
                }
            } else {
                // Untuk Utang/Piutang/Tabungan, kita blokir penghapusan dari sini untuk menjaga integritas relasi data
                throw new Error("Transaksi sistem (Utang/Tabungan) tidak dapat dihapus secara manual.");
            }

            // c. Hapus riwayat dari database
            await tx.delete(transactions).where(eq(transactions.id, transactionId));
        });

        revalidatePath('/dashboard');
        return { success: true };
    } catch (error: any) {
        return { error: error.message || "Gagal menghapus transaksi" };
    }
}

// 12. HAPUS UTANG/PIUTANG (REVERT SALDO)
export async function deleteDebt(transactionId: string) {
    const user = await getRealSession();
    if (!user) return { error: "Unauthorized" };

    try {
        await db.transaction(async (tx) => {
            // a. Cari data utang
            const [debt] = await tx.select().from(transactions)
                .where(and(eq(transactions.id, transactionId), eq(transactions.householdId, user.householdId)));

            if (!debt) throw new Error("Data tidak ditemukan");
            if (debt.debtStatus === 'Lunas') throw new Error("Tanggungan yang sudah Lunas tidak dapat dihapus. Buat transaksi baru untuk koreksi.");

            const amount = parseFloat(debt.amount as string);

            // b. Kembalikan (Revert) Saldo Akun. 
            // Kebalikan dari saat membuat: Utang dihapus = saldo ngurang, Piutang dihapus = saldo nambah.
            if (debt.type === 'Utang' && debt.toAccountId) {
                await tx.update(accounts).set({ balance: sql`${accounts.balance} - ${amount}` }).where(eq(accounts.id, debt.toAccountId));
            } else if (debt.type === 'Piutang' && debt.fromAccountId) {
                await tx.update(accounts).set({ balance: sql`${accounts.balance} + ${amount}` }).where(eq(accounts.id, debt.fromAccountId));
            }

            // c. Hapus riwayat
            await tx.delete(transactions).where(eq(transactions.id, transactionId));
        });

        revalidatePath('/dashboard');
        return { success: true };
    } catch (error: any) {
        return { error: error.message || "Gagal menghapus catatan" };
    }
}

// 13. EDIT METADATA UTANG (Nama / Tanggal)
export async function editDebtMetadata(formData: FormData) {
    const user = await getRealSession();
    if (!user) return { error: "Unauthorized" };

    const id = formData.get('id') as string;
    const counterparty = formData.get('counterparty') as string;
    const dueDateStr = formData.get('dueDate') as string;

    if (!counterparty) return { error: "Nama pihak terkait tidak boleh kosong" };

    try {
        await db.update(transactions)
            .set({
                counterparty: counterparty,
                dueDate: new Date(dueDateStr)
            })
            .where(and(eq(transactions.id, id), eq(transactions.householdId, user.householdId)));

        revalidatePath('/dashboard');
        return { success: true };
    } catch (error: any) {
        return { error: error.message || "Gagal menyimpan perubahan" };
    }
}

// 14. EDIT AKUN
export async function editAccount(formData: FormData) {
    const user = await getRealSession();
    if (!user) return { error: "Unauthorized" };

    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const type = formData.get('type') as 'Bank' | 'E-wallet' | 'Cash';
    const ownership = formData.get('ownership') as string;

    if (!name) return { error: "Nama akun tidak boleh kosong" };

    try {
        const ownerId = await resolveOwnerId(ownership, user.id, user.householdId);

        await db.update(accounts)
            .set({ name, type, ownerId }) // <--- Update ownerId di sini
            .where(and(eq(accounts.id, id), eq(accounts.householdId, user.householdId)));

        revalidatePath('/dashboard');
        revalidatePath('/dashboard/accounts');
        return { success: true };
    } catch (error: any) {
        return { error: error.message || "Gagal mengubah akun" };
    }
}

// 15. HAPUS / NONAKTIFKAN AKUN
export async function deleteAccount(accountId: string) {
    const user = await getRealSession();
    if (!user) return { error: "Unauthorized" };

    try {
        // Cek apakah akun ini sudah pernah dipakai transaksi
        const txCount = await db.select({ count: sql<number>`count(*)` })
            .from(transactions)
            .where(
                and(
                    eq(transactions.householdId, user.householdId),
                    or(eq(transactions.fromAccountId, accountId), eq(transactions.toAccountId, accountId))
                )
            );

        if (Number(txCount[0].count) > 0) {
            // SOFT DELETE: Jika sudah ada transaksi, kita nonaktifkan saja (sembunyikan)
            await db.update(accounts)
                .set({ isActive: false })
                .where(and(eq(accounts.id, accountId), eq(accounts.householdId, user.householdId)));
        } else {
            // HARD DELETE: Jika masih bersih dari transaksi, hapus permanen
            await db.delete(accounts)
                .where(and(eq(accounts.id, accountId), eq(accounts.householdId, user.householdId)));
        }

        revalidatePath('/dashboard');
        revalidatePath('/dashboard/accounts');
        return { success: true };
    } catch (error: any) {
        return { error: error.message || "Gagal menghapus akun" };
    }
}

// 16. EDIT TARGET TABUNGAN
export async function editGoal(formData: FormData) {
    const user = await getRealSession();
    if (!user) return { error: "Unauthorized" };

    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const targetAmount = parseFloat(formData.get('targetAmount') as string);
    const deadlineStr = formData.get('deadline') as string;

    if (!name) return { error: "Nama target tidak boleh kosong" };
    if (targetAmount <= 0) return { error: "Target harus lebih dari 0" };

    try {
        await db.update(goals)
            .set({
                name,
                targetAmount: targetAmount.toString(),
                deadline: deadlineStr ? new Date(deadlineStr) : null,
            })
            .where(and(eq(goals.id, id), eq(goals.householdId, user.householdId)));

        revalidatePath('/dashboard');
        revalidatePath('/dashboard/goals');
        return { success: true };
    } catch (error: any) {
        return { error: error.message || "Gagal mengubah target" };
    }
}

// 17. HAPUS TARGET TABUNGAN
export async function deleteGoal(goalId: string) {
    const user = await getRealSession();
    if (!user) return { error: "Unauthorized" };

    try {
        await db.delete(goals)
            .where(and(eq(goals.id, goalId), eq(goals.householdId, user.householdId)));

        revalidatePath('/dashboard');
        revalidatePath('/dashboard/goals');
        return { success: true };
    } catch (error: any) {
        return { error: error.message || "Gagal menghapus target" };
    }
}

// 18. UPDATE NAMA RUMAH TANGGA / PASANGAN
export async function updateHouseholdName(formData: FormData) {
    const user = await getRealSession();
    if (!user) return { error: "Unauthorized" };

    const name = formData.get('name') as string;
    if (!name) return { error: "Nama tidak boleh kosong" };

    try {
        await db.update(households)
            .set({ name })
            .where(eq(households.id, user.householdId));

        revalidatePath('/dashboard/profile');
        return { success: true };
    } catch (error: any) {
        return { error: error.message || "Gagal mengubah nama pasangan" };
    }
}

// 19. TAMBAH KATEGORI BARU
export async function createCategory(formData: FormData) {
    const user = await getRealSession();
    if (!user) return { error: "Unauthorized" };

    const name = formData.get('name') as string;
    const type = formData.get('type') as 'Income' | 'Expense';

    if (!name) return { error: "Nama kategori tidak boleh kosong" };

    try {
        await db.insert(categories).values({
            householdId: user.householdId,
            name,
            type
        });

        revalidatePath('/dashboard/categories');
        return { success: true };
    } catch (error: any) {
        return { error: error.message || "Gagal membuat kategori" };
    }
}

// 20. EDIT KATEGORI
export async function editCategory(formData: FormData) {
    const user = await getRealSession();
    if (!user) return { error: "Unauthorized" };

    const id = formData.get('id') as string;
    const name = formData.get('name') as string;

    if (!name) return { error: "Nama tidak boleh kosong" };

    try {
        await db.update(categories)
            .set({ name })
            .where(and(eq(categories.id, id), eq(categories.householdId, user.householdId)));

        revalidatePath('/dashboard/categories');
        return { success: true };
    } catch (error: any) {
        return { error: error.message || "Gagal mengubah kategori" };
    }
}

// 21. HAPUS KATEGORI (Dengan Proteksi Relasi)
export async function deleteCategory(categoryId: string) {
    const user = await getRealSession();
    if (!user) return { error: "Unauthorized" };

    try {
        // Cek apakah ada transaksi yang memakai kategori ini
        const txCount = await db.select({ count: sql<number>`count(*)` })
            .from(transactions)
            .where(and(
                eq(transactions.categoryId, categoryId),
                eq(transactions.householdId, user.householdId)
            ));

        if (Number(txCount[0].count) > 0) {
            return { error: "Gagal: Kategori ini sudah digunakan dalam transaksi. Tidak dapat dihapus." };
        }

        await db.delete(categories)
            .where(and(eq(categories.id, categoryId), eq(categories.householdId, user.householdId)));

        revalidatePath('/dashboard/categories');
        return { success: true };
    } catch (error: any) {
        return { error: error.message || "Gagal menghapus kategori" };
    }
}

// --- START: RECURRING TRANSACTIONS ---

// Fungsi Bantuan: Menghitung tanggal jatuh tempo berikutnya
function calculateNextDueDate(currentDate: Date, frequency: string): Date {
    const nextDate = new Date(currentDate);
    if (frequency === 'Harian') nextDate.setDate(nextDate.getDate() + 1);
    else if (frequency === 'Mingguan') nextDate.setDate(nextDate.getDate() + 7);
    else if (frequency === 'Bulanan') nextDate.setMonth(nextDate.getMonth() + 1);
    else if (frequency === 'Tahunan') nextDate.setFullYear(nextDate.getFullYear() + 1);
    return nextDate;
}

// 22. BUAT TEMPLATE TRANSAKSI BERULANG
export async function createRecurringTemplate(formData: FormData) {
    const user = await getRealSession();
    if (!user) return { error: "Unauthorized" };

    const name = formData.get('name') as string;
    const type = formData.get('type') as 'Income' | 'Expense';
    const amount = formData.get('amount') as string;
    const accountId = formData.get('accountId') as string;
    const categoryId = formData.get('categoryId') as string;
    const frequency = formData.get('frequency') as 'Harian' | 'Mingguan' | 'Bulanan' | 'Tahunan';
    const startDateStr = formData.get('startDate') as string;

    if (!name || !amount || !accountId || !categoryId || !frequency || !startDateStr) {
        return { error: "Semua data wajib diisi" };
    }

    const startDate = new Date(startDateStr);

    try {
        await db.insert(recurringTemplates).values({
            householdId: user.householdId,
            createdBy: user.id,
            name,
            type,
            amount,
            accountId,
            categoryId,
            frequency,
            startDate: startDate,
            nextDueDate: startDate, // Saat pertama dibuat, next due date = start date
            isActive: true
        });

        revalidatePath('/dashboard');
        revalidatePath('/dashboard/recurring');
        return { success: true };
    } catch (error: any) {
        return { error: error.message || "Gagal membuat transaksi rutin" };
    }
}

// 23. MESIN EKSEKUTOR TRANSAKSI JATUH TEMPO (CRON WORKER)
export async function processDueRecurringTransactions(householdId: string) {
    try {
        // 1. Cari semua template yang aktif dan nextDueDate-nya adalah HARI INI atau MASA LALU (terlewat)
        const dueTemplates = await db.select().from(recurringTemplates)
            .where(
                and(
                    eq(recurringTemplates.householdId, householdId),
                    eq(recurringTemplates.isActive, true),
                    sql`${recurringTemplates.nextDueDate} <= NOW()`
                )
            );

        if (dueTemplates.length === 0) return { processed: 0 };

        let processedCount = 0;

        // 2. Eksekusi satu per satu menggunakan Transaction Database agar aman
        await db.transaction(async (tx) => {
            for (const template of dueTemplates) {

                // A. Catat ke tabel Transactions (seperti user menginput manual)
                await tx.insert(transactions).values({
                    householdId: template.householdId,
                    createdBy: template.createdBy,
                    type: template.type,
                    amount: template.amount,
                    categoryId: template.categoryId,
                    // Karena ini income/expense, anggap masuk ke toAccount atau dari fromAccount
                    // (Kita sesuaikan dengan struktur transaksi Anda)
                    [template.type === 'Income' ? 'toAccountId' : 'fromAccountId']: template.accountId,
                    description: `${template.name} (Otomatis: ${template.frequency})`,
                    date: template.nextDueDate, // Tanggal transaksi = tanggal jatuh temponya
                });

                // B. Update Saldo Akun (Kurangi jika Expense, Tambah jika Income)
                const amountNum = Number(template.amount);
                if (template.type === 'Income') {
                    await tx.update(accounts).set({ balance: sql`${accounts.balance} + ${amountNum}` }).where(eq(accounts.id, template.accountId));
                } else {
                    await tx.update(accounts).set({ balance: sql`${accounts.balance} - ${amountNum}` }).where(eq(accounts.id, template.accountId));
                }

                // C. Hitung tanggal jatuh tempo berikutnya, dan update Template-nya!
                const newNextDueDate = calculateNextDueDate(new Date(template.nextDueDate), template.frequency);

                await tx.update(recurringTemplates)
                    .set({
                        lastExecutedAt: new Date(),
                        nextDueDate: newNextDueDate
                    })
                    .where(eq(recurringTemplates.id, template.id));

                processedCount++;
            }
        });

        return { processed: processedCount };
    } catch (error: any) {
        console.error("Gagal memproses transaksi rutin:", error);
        return { error: error.message };
    }
}
// --- END: RECURRING TRANSACTIONS ---