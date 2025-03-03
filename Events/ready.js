const { ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`Logado como ${client.user.tag}!`);
    
    // Definir atividade do bot
    client.user.setPresence({
      activities: [{ name: 'tickets de suporte', type: ActivityType.Watching }],
      status: 'online',
    });
    
    // Criar diretório do banco de dados se não existir
    const dbDir = path.join(__dirname, '../database');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir);
    }
    
    // Criar tickets.json se não existir
    const ticketsPath = path.join(dbDir, 'tickets.json');
    if (!fs.existsSync(ticketsPath)) {
      const defaultData = {
        tickets: [],
        stats: {
          totalCreated: 0,
          totalClosed: 0,
          averageResolutionTime: 0
        }
      };
      fs.writeFileSync(ticketsPath, JSON.stringify(defaultData, null, 2), 'utf8');
    }
    
    console.log('Bot ZikTickets está pronto!');
  }
};