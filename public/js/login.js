// Tela de login: Firebase Authentication (e-mail/senha e Google).
// Depois de autenticar, o ID token é enviado ao servidor (POST /auth/session), que valida o
// token, cria o documento em "usuarios" (perfil "user" no primeiro acesso) e abre a sessão.
import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';

const script = document.querySelector('script[data-ok]');
const $ = (id) => document.getElementById(id);
const botoes = [$('btn-entrar'), $('btn-criar'), $('btn-google')];

function mostrarErro(texto) {
  $('auth-erro-texto').textContent = texto;
  $('auth-erro').hidden = false;
}
function limparErro() { $('auth-erro').hidden = true; }
function ocupado(sim) { botoes.forEach((b) => { b.disabled = sim; }); }

// Mensagens amigáveis para os erros mais comuns do Firebase Auth.
const ERROS = {
  'auth/invalid-credential': 'E-mail ou senha incorretos.',
  'auth/invalid-login-credentials': 'E-mail ou senha incorretos.',
  'auth/wrong-password': 'E-mail ou senha incorretos.',
  'auth/user-not-found': 'Não existe conta com esse e-mail. Use "Criar conta".',
  'auth/invalid-email': 'O e-mail informado não é válido.',
  'auth/missing-password': 'Informe a senha.',
  'auth/email-already-in-use': 'Esse e-mail já está em uso. Tente entrar.',
  'auth/weak-password': 'Senha fraca: use pelo menos 6 caracteres.',
  'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos e tente de novo.',
  'auth/network-request-failed': 'Sem conexão com a internet. Verifique sua rede.',
  'auth/popup-closed-by-user': 'A janela do Google foi fechada antes de concluir o login.',
  'auth/cancelled-popup-request': 'A janela do Google foi fechada antes de concluir o login.',
  'auth/popup-blocked': 'O navegador bloqueou a janela do Google. Libere pop-ups para este site.',
  'auth/unauthorized-domain': 'Este domínio não está autorizado no Firebase (Authentication > Settings > Authorized domains).',
  'auth/operation-not-allowed': 'Este método de login não está ativado no Firebase.',
  'auth/user-disabled': 'Esta conta foi desativada.',
};
const mensagemErro = (err) => ERROS[err && err.code] || (err && err.message) || 'Não foi possível entrar. Tente novamente.';

if (!script || !script.dataset.ok) {
  ocupado(true);
} else {
  const app = initializeApp(JSON.parse($('firebase-config').textContent));
  const auth = getAuth(app);
  let emFluxo = false; // true enquanto um login iniciado pelos botões está em andamento

  // Envia o token ao servidor; se o servidor aceitar, entra no sistema.
  async function abrirSessao(user, nome) {
    const idToken = await user.getIdToken(true);
    const resp = await fetch('/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken, nome }),
    });
    const dados = await resp.json().catch(() => ({}));
    if (!resp.ok) throw new Error(dados.erro || 'Falha ao abrir a sessão.');
    window.location.href = dados.redirect || '/';
  }

  async function executar(acao) {
    limparErro();
    ocupado(true);
    emFluxo = true;
    try {
      const { user, nome } = await acao();
      await abrirSessao(user, nome);
    } catch (err) {
      mostrarErro(mensagemErro(err));
      ocupado(false);
      emFluxo = false;
    }
  }

  // Entrar com e-mail e senha
  $('form-login').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = $('email').value.trim();
    const senha = $('senha').value;
    if (!email || !senha) return mostrarErro('Informe e-mail e senha.');
    return executar(async () => {
      const cred = await signInWithEmailAndPassword(auth, email, senha);
      return { user: cred.user };
    });
  });

  // Criar conta (e-mail, senha e nome)
  $('btn-criar').addEventListener('click', () => {
    const nome = $('nome').value.trim();
    const email = $('email').value.trim();
    const senha = $('senha').value;
    if (!nome) return mostrarErro('Informe seu nome para criar a conta.');
    if (!email || !senha) return mostrarErro('Informe e-mail e senha.');
    return executar(async () => {
      const cred = await createUserWithEmailAndPassword(auth, email, senha);
      await updateProfile(cred.user, { displayName: nome });
      return { user: cred.user, nome };
    });
  });

  // Entrar com Google
  $('btn-google').addEventListener('click', () => {
    executar(async () => {
      const cred = await signInWithPopup(auth, new GoogleAuthProvider());
      return { user: cred.user };
    });
  });

  // Após "Sair": encerra também a sessão do Firebase no navegador.
  // Se já existir uma sessão do Firebase (sem cookie do servidor), tenta retomá-la.
  if (script.dataset.saiu) {
    signOut(auth);
  } else {
    onAuthStateChanged(auth, async (user) => {
      if (!user || emFluxo) return;
      emFluxo = true;
      ocupado(true);
      try {
        await abrirSessao(user);
      } catch (err) {
        await signOut(auth);
        ocupado(false);
        emFluxo = false;
      }
    });
  }
}
