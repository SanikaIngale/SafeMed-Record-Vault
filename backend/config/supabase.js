const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function connectToDatabase() {
  try {
    const { data, error } = await supabase.from('users').select('id').limit(1);
    if (error) throw error;
    console.log('Supabase connected');
    console.log('Connection: ' + (process.env.SUPABASE_URL || 'Not configured'));
  } catch (err) {
    console.error('Supabase connection error:', err);
    process.exit(1);
  }
}

module.exports = { supabase, connectToDatabase };
