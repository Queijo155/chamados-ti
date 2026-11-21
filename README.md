# HelpDesk TI — Chamados com Firebase Authentication e Perfis (RBAC)

**Aluno:** Joel Hideki Ohara Kremer
**Aplicação no Render:** https://chamados-ti-1-gqsw.onrender.com
**Repositório:** https://github.com/Queijo155/chamados-ti

## Credenciais de teste

| Perfil | E-mail | Senha |
|---|---|---|
| Usuário comum (`user`) | usuario@gmail.com | 123456 |
| Técnico / Analista de TI (`tecnico`) | tecnico@gmail.com | 123456 |
| Administrador (`admin`) | admin@gmail.com | 123456 |

## O que foi implementado

- Login com **Firebase Authentication**: e-mail/senha (entrar e criar conta) e Google.
- Coleção **`usuarios`** no Firestore, criada automaticamente no primeiro acesso com `perfil: "user"`.
- Chamados gravam `autorUid`, `autorNome`, `autorEmail`, `status: Aberto` e `tecnicoResponsavel: null`.
- Proteção de rotas no servidor: sem login, redireciona para `/login`.

| Perfil | Permissões |
|---|---|
| `user` | Cria chamados e vê somente os próprios. |
| `tecnico` | Vê todos os chamados, assume chamado, dá parecer técnico e altera o status (Aberto, Em Atendimento, Resolvido). |
| `admin` | Acesso total: edita e exclui chamados, e gerencia os perfis dos usuários. |

## Tecnologias

Node.js, Express, EJS, Sequelize (SQLite), Firebase Authentication e Firestore. Deploy no Render.