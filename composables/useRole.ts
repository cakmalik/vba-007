export async function getRoleName(): Promise<string | null> {
  const supabase = useSupabaseClient();
  const user = useSupabaseUser();

  if (!user.value) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.value.id)
    .single();

  if (error) {
    console.error('Error getting role:', error.message);
    return null;
  }

  return data?.role ?? null;
}
