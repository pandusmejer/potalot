import { LoginForm } from '@/components/auth/login-form'
import { Sprout } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Sprout className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-serif text-foreground">Potalot</h1>
          <p className="text-sm text-muted-foreground">
            Dit digitale haveredskab
          </p>
        </div>

        <LoginForm />
      </div>
    </div>
  )
}
