// Connexion au projet Supabase « Pathway ».
// La clé publishable est faite pour être visible dans le navigateur : ce sont les règles RLS de la base qui protègent les données.
// Ne jamais mettre ici une clé secrète (« Secret key » de Supabase) ni le mot de passe de la base.
window.CAMPUS_CONFIG = Object.freeze({
  supabaseUrl: 'https://ynflykxalfynxoupkxmy.supabase.co',
  supabaseKey: 'sb_publishable_e3Pa5ADDtYVU7BJilbkcxw_qaPPxtKB',
  // Length of the email code: Supabase → Authentication → Providers → Email → Email OTP Length.
  otpLength: 6
});
