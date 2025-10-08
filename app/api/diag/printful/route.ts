// src/app/api/diag/printful/route.ts
import { NextResponse } from 'next/server';
import { getAllProducts } from '@/lib/datasource';

export async function GET() {
  const list = await getAllProducts();
  return NextResponse.json({
    dataSource: (process.env.DATA_SOURCE || 'mock').trim(),
    count: list.length,
    sample: list.slice(0, 2).map(p => ({ id: p.id, title: p.title })),
  });
}
