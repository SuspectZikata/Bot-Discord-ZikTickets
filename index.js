const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Cria uma nova instância do cliente
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent
  ]
});

// Coleções para comandos e eventos
client.commands = new Collection();
client.buttons = new Collection();
client.selectMenus = new Collection();
client.modals = new Collection();

// Carregar comandos
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  
  if ('name' in command && 'run' in command) {
    client.commands.set(command.name, command);
    console.log(`Comando carregado: ${command.name}`);
  } else {
    console.log(`[AVISO] O comando em ${filePath} está faltando a propriedade "name" ou "run" requerida.`);
  }
}

// Carregar eventos
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  
  if (event.once) {
    client.once(event.name, (...args) => event.execute(client, ...args));
  } else {
    client.on(event.name, (...args) => event.execute(client, ...args));
  }
  
  console.log(`Evento carregado: ${event.name}`);
}

// Carregar componentes (botões, menus de seleção, modais)
const componentsPath = path.join(__dirname, 'components');
const componentFolders = fs.readdirSync(componentsPath);

for (const folder of componentFolders) {
  const componentFiles = fs.readdirSync(path.join(componentsPath, folder)).filter(file => file.endsWith('.js'));
  
  for (const file of componentFiles) {
    const filePath = path.join(componentsPath, folder, file);
    const component = require(filePath);
    
    if ('customId' in component && 'execute' in component) {
      switch (folder) {
        case 'buttons':
          client.buttons.set(component.customId, component);
          break;
        case 'selectMenus':
          client.selectMenus.set(component.customId, component);
          break;
        case 'modals':
          client.modals.set(component.customId, component);
          break;
      }
      console.log(`Componente carregado: ${component.customId}`);
    } else {
      console.log(`[AVISO] O componente em ${filePath} está faltando a propriedade "customId" ou "execute" requerida.`);
    }
  }
}

// Fazer login no Discord com o token do cliente
client.login(process.env.TOKEN);