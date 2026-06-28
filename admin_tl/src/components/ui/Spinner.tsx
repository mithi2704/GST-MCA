export default function Spinner({ size = 16 }: { size?: number }) {
  return (
    <span className="inline-block animate-spin rounded-full" style={{ width: size, height: size, border: '2px solid currentColor', borderTopColor: 'transparent' }} />
  )
}
