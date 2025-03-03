const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  
  if ('name' in command && 'description' in command) {
    commands.push({
      name: command.name,
      description: command.description,
      options: command.options || [],
      type: command.type,
      default_member_permissions: command.defaultMemberPermissions ? 
        command.defaultMemberPermissions.toString() : null
    });
    
    console.log(`Comando adicionado: ${command.name}`);
  } else {
    console.log(`[AVISO] O comando em ${filePath} está faltando a propriedade "name" ou "description".`);
  }
}

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log(`Iniciando a atualização de ${commands.length} comandos de aplicação (/)`);
    
    let data;
    
    if (process.env.GUILD_ID) {
      // Comandos de guilda (para desenvolvimento)
      data = await rest.put(
        Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
        { body: commands }
      );
      console.log(`Recarregado com sucesso ${data.length} comandos de guilda (/)`);
    } else {
      // Comandos globais (para produção)
      data = await rest.put(
        Routes.applicationCommands(process.env.CLIENT_ID),
        { body: commands }
      );
      console.log(`Recarregado com sucesso ${data.length} comandos globais (/)`);
    }
  } catch (error) {
    console.error(error);
  }
})();