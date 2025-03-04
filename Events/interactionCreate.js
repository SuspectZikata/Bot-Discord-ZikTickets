const { InteractionType, MessageFlags } = require('discord.js');

module.exports = {
  name: 'interactionCreate',
  async execute(client, interaction) {
    // Lidar com comandos de barra
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      
      if (!command) return;
      
      try {
        await command.run(client, interaction);
      } catch (error) {
        console.error(error);
        await interaction.reply({
          content: 'Ocorreu um erro ao executar este comando!',
          flags: MessageFlags.Ephemeral
        });
      }
    }
    
    // Lidar com botões
    else if (interaction.isButton()) {
      const button = client.buttons.get(interaction.customId) || 
                     client.buttons.find(btn => interaction.customId.startsWith(btn.customId));
      
      if (!button) return;
      
      try {
        await button.execute(client, interaction);
      } catch (error) {
        console.error(error);
        await interaction.reply({
          content: 'Ocorreu um erro ao processar este botão!',
          flags: MessageFlags.Ephemeral
        });
      }
    }
    
    // Lidar com menus de seleção
    else if (interaction.isStringSelectMenu()) {
      const selectMenu = client.selectMenus.get(interaction.customId) ||
                         client.selectMenus.find(menu => interaction.customId.startsWith(menu.customId));
      
      if (!selectMenu) return;
      
      try {
        await selectMenu.execute(client, interaction);
      } catch (error) {
        console.error(error);
        await interaction.reply({
          content: 'Ocorreu um erro ao processar este menu!',
          flags: MessageFlags.Ephemeral
        });
      }
    }
    
    // Lidar com modais
    else if (interaction.type === InteractionType.ModalSubmit) {
      const modal = client.modals.get(interaction.customId) ||
                    client.modals.find(m => interaction.customId.startsWith(m.customId));
      
      if (!modal) return;
      
      try {
        await modal.execute(client, interaction);
      } catch (error) {
        console.error(error);
        await interaction.reply({
          content: 'Ocorreu um erro ao processar este formulário!',
          flags: MessageFlags.Ephemeral
        });
      }
    }
  }
};