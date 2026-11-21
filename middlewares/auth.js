// Autenticação (quem é você?) e autorização por perfil (o que você pode fazer?).
const { getAuth } = require('../config/firebase');
const usuarios = require('../services/usuarios');

const COOKIE = 'sessao';
const DURACAO_MS = 5 * 24 * 60 * 60 * 1000; // 5 dias

function lerCookies(header = '') {
  const out = {};
  header.split(';').forEach((par) => {
    const i = par.indexOf('=');
    if (i < 0) return;
    const nome = par.slice(0, i).trim();
    if (nome) out[nome] = decodeURIComponent(par.slice(i + 1).trim());
  });
  return out;
}

function opcoesCookie(req) {
  return { httpOnly: true, sameSite: 'lax', secure: req.secure, path: '/' };
}

// Roda em TODAS as requisições: descobre o usuário logado (se houver) e o perfil dele.
// Em req.user ficam { uid, nome, email, perfil }.
async function carregarUsuario(req, res, next) {
  req.user = null;
  res.locals.user = null;
  res.locals.isStaff = false;
  res.locals.isAdmin = false;

  const cookie = lerCookies(req.headers.cookie)[COOKIE];
  if (!cookie) return next();

  let decoded;
  try {
    decoded = await getAuth().verifySessionCookie(cookie);
  } catch (err) {
    // Cookie inválido/expirado: trata como deslogado.
    res.clearCookie(COOKIE, opcoesCookie(req));
    return next();
  }

  // O perfil é lido do Firestore a cada requisição: se um admin mudar o seu perfil,
  // a mudança vale imediatamente. (Erros do Firestore vão para a página de erro.)
  const usuario = await usuarios.obterOuCriar({
    uid: decoded.uid,
    nome: decoded.name || (decoded.email || '').split('@')[0] || 'Usuário',
    email: decoded.email || '',
  });

  req.user = usuario;
  res.locals.user = usuario;
  res.locals.isStaff = usuario.perfil === 'tecnico' || usuario.perfil === 'admin';
  res.locals.isAdmin = usuario.perfil === 'admin';
  return next();
}

// Bloqueia quem não está logado (redireciona para a tela de login).
function exigirLogin(req, res, next) {
  if (req.user) return next();
  return res.redirect('/login');
}

// Bloqueia quem não tem um dos perfis informados. Ex.: exigirPerfil('tecnico', 'admin')
function exigirPerfil(...perfis) {
  return (req, res, next) => {
    if (!req.user) return res.redirect('/login');
    if (perfis.includes(req.user.perfil)) return next();
    return res.status(403).render('403', { title: 'Acesso negado' });
  };
}

module.exports = { COOKIE, DURACAO_MS, lerCookies, opcoesCookie, carregarUsuario, exigirLogin, exigirPerfil };
