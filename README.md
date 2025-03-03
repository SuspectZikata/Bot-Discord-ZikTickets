# ZikTickets - Bot de Gerenciamento de Tickets para Discord

Este bot foi desenvolvido por **SuspectZikata** com o objetivo de melhorar a gestão de tickets em servidores do Discord. Ele permite a criação, gerenciamento e fechamento de tickets de forma automatizada, além de fornecer funções adicionais como transcrições e funcionalidades de assumir ou abdicar de tickets. Com configurações fáceis de ajustar, este bot oferece uma experiência mais eficiente para a administração de tickets.

## Funcionalidades

- **Abertura de Tickets via Botão**: Usuários podem abrir tickets através de botões em mensagens enviadas pelo bot.
- **Gerenciamento de Tickets**: Sistema completo para gerenciar tickets com JSON como banco de dados.
- **Painéis Interativos**: Botões para ações rápidas como fechar, adicionar usuário, priorizar, etc.
- **Categorias Dinâmicas**: Organização de tickets por tipo (Suporte, Vendas, Dúvidas).
- **Controle de Responsabilidade**: Atendentes podem assumir tickets para melhor organização.
- **Histórico de Tickets**: Geração de transcripts ao fechar tickets.
- **Estatísticas**: Relatórios detalhados sobre tickets abertos, fechados e em andamento.

## Configuração

1. Clone este repositório
2. Instale as dependências com `npm install`
3. Configure o arquivo `.env` com seu token e IDs
4. Execute `node deploy-commands.js` para registrar os comandos
5. Inicie o bot com `npm start`

## Comandos

- `/setupticket` - Configura o sistema de tickets
- `/ticketstats` - Exibe estatísticas do sistema de tickets

## Estrutura do Projeto

```
├── commands/              # Comandos de barra (/)
├── components/            # Componentes interativos
│   ├── buttons/           # Manipuladores de botões
│   ├── selectMenus/       # Manipuladores de menus de seleção
│   └── modals/            # Manipuladores de modais
├── database/              # Arquivos de banco de dados
├── events/                # Manipuladores de eventos
├── utils/                 # Utilitários e funções auxiliares
├── .env                   # Variáveis de ambiente
├── config.json            # Configurações do bot
├── deploy-commands.js     # Script para registrar comandos
├── index.js               # Ponto de entrada do bot
└── package.json           # Dependências e scripts
```

## 📦 Dependências
```json
{
  "dependencies": {
    "discord.js": "^14.14.1",
    "dotenv": "^16.3.1",
    "fs": "^0.0.1-security",
    "path": "^0.12.7",
    "nodemon": "^3.0.1"
  }
}
```

## Uso

1. Use `/setupticket` para configurar o sistema
2. O bot enviará uma mensagem com botão para abrir tickets
3. Usuários podem clicar no botão para criar tickets
4. A equipe de suporte pode gerenciar os tickets através dos botões interativos

## Requisitos

- Node.js v16.9.0 ou superior
- Discord.js v14
- Um bot registrado no [Discord Developer Portal](https://discord.com/developers/applications)

## 📜 Licença
Este projeto foi desenvolvido por **SuspectZikata** e está sob uma licença aberta para uso e modificação conforme necessário.

## 🌟 Contribuição
Se desejar contribuir, fique à vontade para abrir uma *issue* ou enviar um *pull request*!

---
✨ **Mantenha o atendimento ao cliente eficiente e organizado com este bot de tickets!** ✨
