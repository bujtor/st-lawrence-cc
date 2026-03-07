import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/fixtures?season=2026
export async function GET(request: NextRequest) {
  const season = request.nextUrl.searchParams.get('season') || new Date().getFullYear().toString()

  const { data, error } = await supabase
    .from('fixtures')
    .select('*')
    .eq('season', parseInt(season))
    .order('match_date', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
