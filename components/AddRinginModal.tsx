'use client'

import { useState, useRef, useEffect } from 'react'

const ROLES = ['BAT', 'BOWL', 'AR', 'WK']
const ROLE_COLOURS: Record<string, string> = {
  BAT: 'text-sky-700 border-sky-200 bg-sky-50',
  BOWL: 'text-rose-700 border-rose-200 bg-rose-50',
  AR: 'text-violet-700 border-violet-200 bg-violet-50',
  WK: 'text-teal-700 border-teal-200 bg-teal-50',
}

export default function AddRinginModal({
  onAdd,
  onClose,
}: {
  onAdd: (name: string, role: string) => void
  onClose: () => void
}) {
  const [name, setName] = useState('')
  const [role, setRole] = useState('BAT')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const submit = () => {
    if (name.trim()) {
      onAdd(name.trim(), role)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-5" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl p-6 max-w-sm w-full border border-gray-200 shadow-2xl">
        <div className="text-xs text-emerald-700 uppercase tracking-widest font-semibold mb-1">Add Ring-In</div>
        <div className="text-sm text-gray-500 mb-5">
          They can set availability across the whole season. Promote to full member any time.
        </div>
        <label className="text-xs text-gray-400 font-medium block mb-1">Name</label>
        <input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit()
          }}
          placeholder="e.g. Pete from Otford"
          className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 text-sm outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-100 mb-3 transition-all"
        />
        <label className="text-xs text-gray-400 font-medium block mb-1.5">Role</label>
        <div className="flex gap-1.5 mb-5">
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`flex-1 py-2 rounded-lg border text-xs font-bold font-mono transition-all ${
                role === r ? ROLE_COLOURS[r] : 'text-gray-400 border-gray-200 bg-white'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-500 text-sm font-semibold hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!name.trim()}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold border transition-all ${
              name.trim()
                ? 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-gray-100 border-gray-200 text-gray-400'
            }`}
          >
            Add Ring-In
          </button>
        </div>
      </div>
    </div>
  )
}
