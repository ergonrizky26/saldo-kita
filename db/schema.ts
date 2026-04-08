// Schema declarations will go here
// import { pgTable, serial, text, varchar } from "drizzle-orm/pg-core";

// @ts-nocheck
import {
    pgTable,
    uuid,
    varchar,
    timestamp,
    integer,
    boolean,
    decimal,
    pgEnum
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// --- ENUMS ---
export const accountTypeEnum = pgEnum("account_type", ["Bank", "E-wallet", "Cash"]);
export const transactionTypeEnum = pgEnum("transaction_type", ["Income", "Expense", "Transfer", "Tabungan", "Utang", "Piutang"]);
export const debtStatusEnum = pgEnum("debt_status", ["Belum Lunas", "Lunas"]);
// TAMBAHAN BARU:
export const frequencyEnum = pgEnum("frequency", ["Harian", "Mingguan", "Bulanan", "Tahunan"]);

// --- TABLES ---

// 1. Households: The core entity linking partners
export const households = pgTable("households", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).default('Rumah Tangga Saya'),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 2. Users: Extended with household_id
export const users = pgTable("users", {
    id: uuid("id").primaryKey(), // Linked to Supabase Auth UUID
    householdId: uuid("household_id").references(() => households.id).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 3. Pairing Codes (Edge Case 2: Validation, Expiry, Single-use)
export const pairingCodes = pgTable("pairing_codes", {
    id: uuid("id").primaryKey().defaultRandom(),
    code: varchar("code", { length: 6 }).notNull().unique(),
    householdId: uuid("household_id").references(() => households.id).notNull(),
    createdBy: uuid("created_by").references(() => users.id).notNull(),
    isUsed: boolean("is_used").default(false).notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 4. Accounts (Edge Case 1: Soft Delete)
export const accounts = pgTable("accounts", {
    id: uuid("id").primaryKey().defaultRandom(),
    householdId: uuid("household_id").references(() => households.id).notNull(),
    // TAMBAHKAN BARIS INI: Untuk mendeteksi pemilik akun (Bisa null untuk Rekening Bersama)
    ownerId: uuid("owner_id").references(() => users.id),
    name: varchar("name", { length: 255 }).notNull(),
    type: accountTypeEnum("type").notNull(),
    balance: decimal("balance", { precision: 15, scale: 2 }).default("0").notNull(),
    isActive: boolean("is_active").default(true).notNull(), // SOFT DELETE FLAG
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 5. Categories
export const categories = pgTable("categories", {
    id: uuid("id").primaryKey().defaultRandom(),
    householdId: uuid("household_id").references(() => households.id).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    type: transactionTypeEnum("type").notNull(),
});

// 6. Transactions (Atomic core)
export const transactions = pgTable("transactions", {
    id: uuid("id").primaryKey().defaultRandom(),
    householdId: uuid("household_id").references(() => households.id).notNull(),
    // TAMBAHKAN BARIS INI (Sengaja tidak notNull agar transaksi lama tidak error)
    createdBy: uuid("created_by").references(() => users.id),
    type: transactionTypeEnum("type").notNull(),
    amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),

    // Transfers involve two accounts
    fromAccountId: uuid("from_account_id").references(() => accounts.id),
    toAccountId: uuid("to_account_id").references(() => accounts.id),
    categoryId: uuid("category_id").references(() => categories.id),

    // Utang / Piutang specific fields
    counterparty: varchar("counterparty", { length: 255 }),
    debtStatus: debtStatusEnum("debt_status"),
    dueDate: timestamp("due_date"),

    description: varchar("description", { length: 500 }),
    date: timestamp("date").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 7. Budgets
export const budgets = pgTable("budgets", {
    id: uuid("id").primaryKey().defaultRandom(),
    householdId: uuid("household_id").references(() => households.id).notNull(),
    categoryId: uuid("category_id").references(() => categories.id).notNull(),
    amountLimit: decimal("amount_limit", { precision: 15, scale: 2 }).notNull(),
    month: integer("month").notNull(), // 1-12
    year: integer("year").notNull(),
});

// 8. Goals (Target Tabungan)
export const goals = pgTable("goals", {
    id: uuid("id").primaryKey().defaultRandom(),
    householdId: uuid("household_id").references(() => households.id).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    targetAmount: decimal("target_amount", { precision: 15, scale: 2 }).notNull(),
    currentAmount: decimal("current_amount", { precision: 15, scale: 2 }).default("0").notNull(),
    deadline: timestamp("deadline"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 9. Recurring Templates (Otomasi Transaksi)
export const recurringTemplates = pgTable("recurring_templates", {
    id: uuid("id").primaryKey().defaultRandom(),
    householdId: uuid("household_id").references(() => households.id).notNull(),
    createdBy: uuid("created_by").references(() => users.id).notNull(),

    // Detail Transaksi yang akan dicloning
    name: varchar("name", { length: 255 }).notNull(),
    type: transactionTypeEnum("type").notNull(), // Income / Expense
    amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
    accountId: uuid("account_id").references(() => accounts.id).notNull(),
    categoryId: uuid("category_id").references(() => categories.id).notNull(),

    // Logika Penjadwalan
    frequency: frequencyEnum("frequency").notNull(),
    startDate: timestamp("start_date").notNull(),
    nextDueDate: timestamp("next_due_date").notNull(), // Kapan ini harus dieksekusi lagi?
    lastExecutedAt: timestamp("last_executed_at"),     // Kapan terakhir kali sukses dieksekusi?
    isActive: boolean("is_active").default(true).notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// --- RELATIONS ---
export const transactionsRelations = relations(transactions, ({ one }) => ({
    fromAccount: one(accounts, {
        fields: [transactions.fromAccountId],
        references: [accounts.id],
    }),
    toAccount: one(accounts, {
        fields: [transactions.toAccountId],
        references: [accounts.id],
    }),
    category: one(categories, {
        fields: [transactions.categoryId],
        references: [categories.id],
    }),
}));