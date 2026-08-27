import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nsdskfbgcupnjoqlpjzh.supabase.co';
const supabaseKey = 'sb_publishable_qg-hOd7Tx2a0x28OSE7TFw_SLO70EES';

export const supabase = createClient(supabaseUrl, supabaseKey);
