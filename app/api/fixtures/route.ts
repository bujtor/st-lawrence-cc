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

// PATCH /api/fixtures — update fixture fields (meet_time, start_time, etc.)
export async function PATCH(request: NextRequest) {
  const body = await request.json()
  const { id, ...updates } = body

  if (!id) {
    return NextResponse.json({ error: 'Fixture ID required' }, { status: 400 })
  }

  const allowed = ['meet_time', 'start_time']
  const filtered: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in updates) filtered[key] = updates[key]
  }

  if (Object.keys(filtered).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('fixtures')
    .update(filtered)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
