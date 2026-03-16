export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8faf5]">
      <div className="max-w-2xl mx-auto">
        {children}
      </div>
    </div>
  )
}
