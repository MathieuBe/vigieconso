const { createClient } = require('@supabase/supabase-js');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'vigieconso2024';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';

function supabaseAdmin() {
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
}

function checkAuth(req) {
  const auth = req.headers['authorization'] || '';
  const token = auth.replace('Bearer ', '');
  return token === ADMIN_PASSWORD || (WEBHOOK_SECRET && token === WEBHOOK_SECRET);
}

function slugify(t) {
  return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
}

module.exports = { supabaseAdmin, checkAuth, slugify };
