import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/players
export async function GET() {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('is_active', true)
    .order('is_ringin', { ascending: true })
    .order('name', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// POST /api/players — add a new player (typically a ring-in)
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { name, role, is_ringin = true } = body

  if (!name || !role) {
    return NextResponse.json({ error: 'Name and role are required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('players')
    .insert({ name, role, is_ringin })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// PATCH /api/players — update player (promote/demote/deactivate)
export async function PATCH(request: NextRequest) {
  const body = await request.json()
  const { id, ...updates } = body

  if (!id) {
    return NextResponse.json({ error: 'Player ID required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('players')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// DELETE /api/players?id=N
export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Player ID required' }, { status: 400 })
  }

  const { error } = await supabase
    .from('players')
    .delete()
    .eq('id', parseInt(id))

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ deleted: true })
}
