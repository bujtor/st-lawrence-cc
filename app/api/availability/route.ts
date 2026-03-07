import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/availability?season=2026
export async function GET(request: NextRequest) {
  const season = request.nextUrl.searchParams.get('season') || new Date().getFullYear().toString()

  const { data, error } = await supabase
    .from('availability')
    .select(`
      player_id,
      fixture_id,
      status,
      notes,
      updated_at,
      fixtures!inner(season)
    `)
    .eq('fixtures.season', parseInt(season))

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST /api/availability — upsert a single availability record
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { player_id, fixture_id, status } = body

  if (!player_id || !fixture_id || !status) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (status === 'none' || status === 'clear') {
    // Delete the record
    const { error } = await supabase
      .from('availability')
      .delete()
      .eq('player_id', player_id)
      .eq('fixture_id', fixture_id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ deleted: true })
  }

  const { data, error } = await supabase
    .from('availability')
    .upsert(
      {
        player_id,
        fixture_id,
        status,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'player_id,fixture_id' }
    )
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
