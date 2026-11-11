/*
  PŘIPOJENÍ K DATABÁZI (Supabase)

  Teď jsou tu údaje VÝVOJOVÉHO projektu (filara-vyvoj).
  Filip je při nasazení nahradí hodnotami OSTRÉHO projektu.

  Najdete je v Supabase: Project Settings → API (nebo API Keys):
    supabaseUrl  = Project URL, např. https://abcdefghijklmnop.supabase.co
    supabaseKey  = veřejný klíč: „publishable“ (sb_publishable_…) nebo „anon“ (eyJ…)

  Sem patří JEN veřejný klíč. Je vidět v prohlížeči a chrání ho pravidla v databázi (RLS).
  Tajný klíč (service_role / sb_secret_…) sem NIKDY nepatří – repozitář je veřejný.
*/
window.FILARA_CONFIG = {
  supabaseUrl: "https://tnzuatmewzipepdbxkgf.supabase.co",
  supabaseKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRuenVhdG1ld3ppcGVwZGJ4a2dmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM5Njc4MjksImV4cCI6MjEwOTU0MzgyOX0.srCIshwHqtRZmCWVsQ4NBfQnr0EEj_ulfBHvcxXCHME",
};
