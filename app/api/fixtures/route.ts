import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isCaptainAuthed } from '@/lib/captain-auth'

// GET /api/fixtures?season=2026
export async function GET(request: NextRequest) {
  if (!(await isCaptainAuthed())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const season = request.nextUrl.searchParams.get('season') || new Date().getFullYear().toString()
  const supabase = supabaseAdmin()

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
  if (!(await isCaptainAuthed())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

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

  const supabase = supabaseAdmin()
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
