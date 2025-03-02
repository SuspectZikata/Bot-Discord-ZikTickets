# Bot de Ticket

## 🤖 Sobre o Bot

Este bot foi desenvolvido por **SuspectZikata** com o objetivo de melhorar a gestão de tickets em servidores do Discord. Ele permite a criação, gerenciamento e fechamento de tickets de forma automatizada, além de fornecer funções adicionais como transcrições e funcionalidades de assumir ou abdicar de tickets. Com configurações fáceis de ajustar, este bot oferece uma experiência mais eficiente para a administração de tickets.

## 🚀 Funcionalidades

### 🔧 Configuração
- **⚙️ ticket** - Configura o canal onde a mensagem para abrir um ticket será enviada.
- **📂 categoriaId** - Define a categoria onde os tickets serão criados.
- **📄 transcriptChannelId** - Define o canal onde os transcripts dos tickets serão armazenados.

### 🛠️ Administração de Ticket
- **🎫 criar** - Cria um novo ticket para o usuário.
- **👤 assumir** - Assume um ticket para gerenciamento.
- **📜 transcript** - Gera a transcrição de um ticket.
- **🔄 reabrir** - Reabre um ticket fechado.
- **❌ abdicar** - Abdica de um ticket que foi assumido.
- **🗝 fechar** - fecha o ticket.
- **🏅 ranking** - Exibe um ranking dos usuários que mais assumiram tickets.

## ⚡ Eventos

- **interactionCreate** - Responsável por gerenciar toda a base do bot, incluindo a criação, fechamento e interação com tickets. Também gerencia o processo de transcrição e reabertura de tickets.

## 📦 Dependências
```json
{
  "dependencies": {
    "@discordjs/voice": "^0.18.0",
    "better-sqlite3": "^11.8.1",
    "discord-html-transcripts": "^3.2.0",
    "discord.js": "^14.18.0",
    "fs": "^0.0.1-security",
    "ms": "^2.1.3",
    "node-fetch": "^3.3.2",
    "wait": "^0.4.2"
  },
  "devDependencies": {
    "nodemon": "^3.1.9"
  }
}
```

## 📜 Licença
Este projeto foi desenvolvido por **SuspectZikata** e está sob uma licença aberta para uso e modificação conforme necessário.

## 🌟 Contribuição
Se desejar contribuir, fique à vontade para abrir uma *issue* ou enviar um *pull request*!

---
✨ **Mantenha o atendimento ao cliente eficiente e organizado com este bot de tickets!** ✨
