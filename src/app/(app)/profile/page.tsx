import { redirect }      from 'next/navigation'
import { createClient }  from '@/lib/supabase/server'
import ProfileClient     from './ProfileClient'
import type { ProfileData } from './ProfileClient'

export const metadata = { title: 'Profile — NormalMe' }

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('skill_level, diet_type, allergens, household_size')
    .eq('user_id', user.id)
    .maybeSingle()

  // Determine OAuth provider
  const provider = user.app_metadata?.provider ?? 'email'

  const profileData: ProfileData = {
    displayName:    user.user_metadata?.full_name ?? '',
    email:          user.email ?? '',
    avatarUrl:      user.user_metadata?.avatar_url ?? null,
    provider,
    skill_level:    prefs?.skill_level    ?? 'home_cook',
    diet_type:      prefs?.diet_type      ?? 'none',
    allergens:      prefs?.allergens      ?? [],
    household_size: prefs?.household_size ?? 1,
    memberSince:    user.created_at,
  }

  return <ProfileClient data={profileData} />
}
