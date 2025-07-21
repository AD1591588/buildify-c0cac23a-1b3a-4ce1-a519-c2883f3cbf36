
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xbpfgkukytwczuknpfxb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhicGZna3VreXR3Y3p1a25wZnhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NjY4MDEsImV4cCI6MjA2ODE0MjgwMX0.VwLSN1IqCglCFCCQGjJCd1AufvIwUOHhWM67Cl5Tp3E';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);