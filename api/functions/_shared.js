// netlify/functions/_shared.js
// Utilitaires partagés par toutes les fonctions serverless

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // full admin access, server-side only
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'vigieconso2024';

function supabaseAdmin() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('Variables Supabase manquantes. Vérifiez vos variables d\'environnement Netlify.');
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

function cors(origin = '*') {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json',
  };
}

function ok(body, status = 200) {
  return { statusCode: status, headers: cors(), body: JSON.stringify(body) };
}

function err(message, status = 400) {
  return { statusCode: status, headers: cors(), body: JSON.stringify({ error: message }) };
}

function checkAuth(event) {
  const auth = event.headers['authorization'] || '';
  const token = auth.replace('Bearer ', '');
  return token === ADMIN_PASSWORD;
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

module.exports = { supabaseAdmin, cors, ok, err, checkAuth, slugify };
