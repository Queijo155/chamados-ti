# HelpDesk TI — Chamados com Firebase Authentication e Perfis (RBAC)

**Aluno(a):** _SEU NOME COMPLETO AQUI_
**Aplicação no Render:** https://SEU-PROJETO.onrender.com
**Repositório:** https://github.com/Queijo155/chamados-ti

### Credenciais de teste

| Perfil | E-mail | Senha |
|---|---|---|
| Usuário comum (`user`) | _preencher_ | _preencher_ |
| Técnico / Analista de TI (`tecnico`) | _preencher_ | _preencher_ |
| Administrador (`admin`) | _preencher_ | _preencher_ |

> Qualquer pessoa que se cadastra nasce como `user`. Os perfis `tecnico` e `admin` são concedidos no painel **Usuários** (admin) ou, para o primeiro admin, editando o campo `perfil` no Console do Firebase.

---

## O que foi implementado

- **Firebase Authentication** (tela `/login`): e-mail/senha (entrar e criar conta) e **Entrar com Google** (`signInWithPopup`), com mensagens de erro amigáveis.
- **Coleção `usuarios` no Firestore** (documento = `uid`): `{ uid, nome, email, perfil, criadoEm }`. No primeiro acesso (cadastro ou primeiro login Google) o documento é criado automaticamente com `perfil: "user"`.
- **Proteção de rotas no servidor**: sem login → redirecionamento para `/login`. O servidor valida o token do Firebase (Admin SDK), cria um cookie de sessão e lê o `perfil` do Firestore a cada requisição.
- **Chamados** gravam `autorUid`, `autorNome`, `autorEmail`, `status: Aberto` e `tecnicoResponsavel: null`.

| Perfil | O que pode fazer |
|---|---|
| `user` | Criar chamados; ver **somente os próprios** (`autorUid == uid`); comentar nos próprios chamados. Não altera status nem exclui. |
| `tecnico` | Ver **todos** os chamados; **assumir** chamado; registrar **parecer técnico**; alterar status (Aberto → Em Atendimento → Resolvido). Não gerencia usuários nem exclui. |
| `admin` | Acesso total: editar, alterar status/prioridade, **excluir chamados**, **Painel de Gestão de Usuários** (alterar `perfil`) e Categorias. |

Interface condicional: o painel *Usuários* e o botão *Excluir* só aparecem para `admin`; os controles de *Atendimento* para `tecnico`/`admin`. As mesmas regras são **validadas no servidor** (não basta esconder botões).

> Banco de chamados: SQLite (Sequelize), como no projeto base. Os **usuários e perfis** ficam no **Firestore**. No plano gratuito do Render o disco é temporário, então os chamados voltam aos dados de exemplo quando o serviço reinicia.

---

## Como rodar localmente

```bash
npm install
npm start        # http://localhost:3000
```

Antes, configure o Firebase:

1. **Config do navegador:** cole o objeto `firebaseConfig` em `config/firebaseClient.js`.
2. **Credenciais do servidor:** Console do Firebase → ⚙ Configurações do projeto → **Contas de serviço** → *Gerar nova chave privada*. Salve o arquivo como **`serviceAccountKey.json`** na raiz do projeto (ele está no `.gitignore`; **não envie ao GitHub**).
3. No Console: **Authentication** → ativar *E-mail/senha* e *Google*; **Firestore Database** → criar banco (modo de teste); `localhost` deve estar em *Authorized domains*.

## Deploy no Render (Web Service)

- **Build Command:** `npm install`  ·  **Start Command:** `npm start`
- Variáveis de ambiente:
  - `FIREBASE_SERVICE_ACCOUNT` = conteúdo completo do JSON da conta de serviço
  - `NODE_VERSION` = `22`
- Depois do deploy, adicione `seu-projeto.onrender.com` em **Authentication → Settings → Authorized domains**.

## Estrutura (MVC)

```
app.js                 # Express, sessão/perfil e rotas
config/                # constantes, Sequelize, firebase.js (Admin) e firebaseClient.js (navegador)
middlewares/auth.js    # carrega o usuário logado; exigirLogin / exigirPerfil
services/usuarios.js   # coleção "usuarios" do Firestore
controllers/           # auth, chamados, comentários, dashboard, admin, categorias
views/                 # login.ejs, tickets/, admin/usuarios.ejs ...
public/js/login.js     # Firebase Auth no navegador
firestore.rules        # regras de segurança (bônus)
```
