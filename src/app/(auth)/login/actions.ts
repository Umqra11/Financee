'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const rememberMe = formData.get('rememberMe') === 'on'

  if (!email || !password) {
    return redirect('/login?error=Email_ve_sifre_gereklidir')
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return redirect('/login?error=' + error.message)
  }

  // "Beni Unutma" işaretliyse 30 günlük cookie ayarla
  if (rememberMe) {
    const cookieStore = await cookies()
    cookieStore.set('remember_me', 'true', {
      maxAge: 30 * 24 * 60 * 60, // 30 gün
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })
  }

  redirect('/')
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return redirect('/login?error=Email_ve_sifre_gereklidir')
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    return redirect('/login?error=' + error.message)
  }

  redirect('/')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
