import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OnboardingClient from './OnboardingClient'

export const metadata = {
  title: 'Set Up Your Profile — NormalMe',
}

export default async function OnboardingPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // If the user already has preferences, they've done onboarding — skip to home
  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (prefs) redirect('/')

  const name =
    user.user_metadata?.full_name ||
    user.email?.split('@')[0] ||
    'there'

  return <OnboardingClient userName={name} />
}
