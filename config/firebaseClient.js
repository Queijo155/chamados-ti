// Configuração do Firebase para o NAVEGADOR (tela de login).
// Estes valores NÃO são secretos: o Firebase os expõe de propósito em todo app web.
//
// Alternativa: defina a variável de ambiente FIREBASE_WEB_CONFIG com o JSON do objeto.
const configArquivo = {
  apiKey: 'AIzaSyAr6J0neO8SuX6I4C0L5-mHcAaN5cg7_Zs',
  authDomain: 'chamados-ti-rbac-ea929.firebaseapp.com',
  projectId: 'chamados-ti-rbac-ea929',
  storageBucket: 'chamados-ti-rbac-ea929.firebasestorage.app',
  messagingSenderId: '1074346896472',
  appId: '1:1074346896472:web:9a1b2226775f7db972ee2d',
  measurementId: 'G-L7K6PXCTQT',
};

function obterConfig() {
  if (process.env.FIREBASE_WEB_CONFIG) {
    try {
      return JSON.parse(process.env.FIREBASE_WEB_CONFIG);
    } catch (err) {
      console.warn('FIREBASE_WEB_CONFIG não é um JSON válido; usando config/firebaseClient.js');
    }
  }
  return configArquivo;
}

function configurado(cfg = obterConfig()) {
  return Boolean(cfg.apiKey && cfg.projectId && !String(cfg.apiKey).includes('COLE_AQUI'));
}

module.exports = { obterConfig, configurado };