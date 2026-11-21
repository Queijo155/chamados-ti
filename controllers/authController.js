const { getAuth } = require('../config/firebase');
const { obterConfig, configurado } = require('../config/firebaseClient');
const usuarios = require('../services/usuarios');
const { COOKIE, DURACAO_MS, opcoesCookie } = require('../middlewares/auth');

// GET /login
exports.paginaLogin = (req, res) => {
  // Quem já está logado não precisa ver o login (exceto logo após clicar em "Sair").
  if (req.user && !req.query.saiu) return res.redirect('/');
  const cfg = obterConfig();
  res.render('login', {
    title: 'Entrar',
    firebaseConfig: cfg,
    firebaseConfigurado: configurado(cfg),
    saiu: Boolean(req.query.saiu),
  });
};

// POST /auth/session  { idToken, nome }
// O navegador faz o login no Firebase Authentication e envia o ID token para cá.
// Aqui o token é validado, o usuário é gravado no Firestore (se for o primeiro acesso,
// com perfil "user") e um cookie de sessão é criado.
exports.criarSessao = async (req, res) => {
  const { idToken, nome } = req.body || {};
  if (!idToken || typeof idToken !== 'string') {
    return res.status(400).json({ erro: 'Token de login ausente.' });
  }

  let decoded;
  try {
    decoded = await getAuth().verifyIdToken(idToken);
  } catch (err) {
    return res.status(401).json({ erro: 'Login inválido ou expirado. Tente entrar novamente.' });
  }

  const emailBase = (decoded.email || '').split('@')[0];
  const nomeFinal = String(decoded.name || nome || emailBase || 'Usuário').trim().slice(0, 100);

  let usuario;
  let cookie;
  try {
    cookie = await getAuth().createSessionCookie(idToken, { expiresIn: DURACAO_MS });
    usuario = await usuarios.obterOuCriar({ uid: decoded.uid, nome: nomeFinal, email: decoded.email || '' });
  } catch (err) {
    console.error('Falha ao criar sessão:', err);
    return res.status(500).json({
      erro: 'Não foi possível concluir o login no servidor. Verifique as credenciais do Firebase e se o Firestore foi criado.',
    });
  }

  res.cookie(COOKIE, cookie, { ...opcoesCookie(req), maxAge: DURACAO_MS });
  return res.json({ ok: true, perfil: usuario.perfil, redirect: '/' });
};

// POST /logout — apaga o cookie; a tela de login também executa signOut(auth) no Firebase.
exports.logout = (req, res) => {
  res.clearCookie(COOKIE, opcoesCookie(req));
  res.redirect('/login?saiu=1');
};
