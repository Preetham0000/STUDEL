import { createClient } from '@supabase/supabase-js';

// IMPORTANT: User has replaced these with their actual Supabase Project URL and Anon Key
const supabaseUrl = 'https://kycjfjxutacdewwwtrwh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5Y2pmanh1dGFjZGV3d3d0cndoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwNDk2MDcsImV4cCI6MjA3MTYyNTYwN30.l6iHda8rZ5GZ_Gai0GHlfylrL-SqmQpaVs0znfpNchA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
