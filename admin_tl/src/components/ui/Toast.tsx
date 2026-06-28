import { useEffect, useState } from 'react'

type ToastItem = { id: string; type: 'success'|'error'|'info'|'warning'; message: string }
let listeners: ((t: ToastItem) => void)[] = []
export function toast(item: Omit<ToastItem, 'id'>) {
  const id = Math.random().toString(36).slice(2)
  const payload = { ...item, id }
  listeners.forEach((l) => l(payload))
}

export default function Toasts() {
  const [items, setItems] = useState<ToastItem[]>([])

  useEffect(() => {
    function onToast(t: ToastItem) {
      setItems((s) => [...s, t])
      setTimeout(() => setItems((s) => s.filter((x) => x.id !== t.id)), 4000)
    }
    listeners.push(onToast)
    return () => { listeners = listeners.filter((l) => l !== onToast) }
  }, [])

  return (
    <div style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 9999 }}>
      <div className="space-y-2">
        {items.map((it) => (
          <div key={it.id} className={`rounded-md px-4 py-2 text-sm font-semibold shadow ${it.type === 'success' ? 'bg-green-50 text-green-800' : it.type === 'error' ? 'bg-red-50 text-red-800' : it.type === 'warning' ? 'bg-yellow-50 text-yellow-800' : 'bg-sky-50 text-sky-800'}`}>
            {it.message}
          </div>
        ))}
      </div>
    </div>
  )
}
