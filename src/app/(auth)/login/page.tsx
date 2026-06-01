import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LoginForm } from '@/components/forms/LoginForm'

export default async function LoginPage() {
  const supabase = await createClient()

  // Kullanıcı giriş yapmışsa yönlendir
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    redirect('/')
  }

  return <LoginForm />
}
