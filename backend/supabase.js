const { createClient } = require('@supabase/supabase-js');

// These should be in .env
const supabaseUrl = process.env.SUPABASE_URL || 'https://xyz.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'public-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
