"use client";

import React, { useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';

// Tipe data yang akan diterima dari page.tsx
type MonthlyData = { month: string, Income: number, Expense: number };
type CategoryData = { name: string, value: number };

export default function AnalyticsCharts({
    monthlyData,
    categoryData
}: {
    monthlyData: MonthlyData[],
    categoryData: CategoryData[]
}) {
    const [activeTab, setActiveTab] = useState<'trend' | 'composition'>('trend');

    // Warna-warna standar untuk Pie Chart
    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

    // Format angka ke Rupiah untuk tooltip
    const formatIDR = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mt-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                <h2 className="text-lg font-bold text-slate-800">Analitik Keuangan</h2>
                <div className="flex w-full sm:w-auto bg-slate-100 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('trend')}
                        className={`flex-1 sm:flex-none text-[11px] sm:text-sm px-2 py-2 sm:py-1.5 rounded-md font-bold sm:font-medium transition ${activeTab === 'trend' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Tren Bulanan
                    </button>
                    <button
                        onClick={() => setActiveTab('composition')}
                        className={`flex-1 sm:flex-none text-[11px] sm:text-sm px-2 py-2 sm:py-1.5 rounded-md font-bold sm:font-medium transition ${activeTab === 'composition' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Komposisi Pengeluaran
                    </button>
                </div>
            </div>

            <div className="w-full h-[300px] md:h-[400px]">
                {activeTab === 'trend' ? (
                    monthlyData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyData} margin={{ top: 20, right: 10, left: -15, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} dy={10} />
                                <YAxis tickFormatter={(val) => `Rp${val / 1000}k`} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} dx={-10} />
                                <Tooltip formatter={(value: any) => formatIDR(Number(value || 0))} cursor={{ fill: '#f1f5f9' }} />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                                <Bar dataKey="Income" name="Pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                <Bar dataKey="Expense" name="Pengeluaran" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={50} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex h-full items-center justify-center text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl">
                            Belum ada data transaksi bulanan.
                        </div>
                    )
                ) : (
                    categoryData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={85}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={({ name, percent }) => (
                                        <text fontSize="10" fill="#64748b">
                                            {`${name} ${(Number(percent) * 100).toFixed(0)}%`}
                                        </text>
                                    )}
                                    labelLine={false}
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: any) => formatIDR(Number(value || 0))} />
                                <Legend
                                    layout="horizontal"
                                    verticalAlign="bottom"
                                    align="center"
                                    wrapperStyle={{
                                        fontSize: "12px",
                                        paddingTop: "20px"
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex h-full items-center justify-center text-slate-400 text-sm border border-dashed border-slate-200 rounded-xl">
                            Belum ada data pengeluaran untuk ditampilkan.
                        </div>
                    )
                )}
            </div>
        </div>
    );
}