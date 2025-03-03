const { 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle, 
  ActionRowBuilder 
} = require('discord.js');

module.exports = {
  customId: 'ticket_add_user',
  async execute(client, interaction) {
    try {
      // Criar modal
      const modal = new ModalBuilder()
        .setCustomId('add_user_modal')
        .setTitle('Adicionar Usuário ao Ticket');
      
      // Criar entrada de texto
      const userIdInput = new TextInputBuilder()
        .setCustomId('user_id')
        .setLabel('ID do Usuário ou Menção')
        .setPlaceholder('Digite o ID do usuário ou a menção (@usuário)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);
      
      // Adicionar entrada ao modal
      const firstActionRow = new ActionRowBuilder().addComponents(userIdInput);
      modal.addComponents(firstActionRow);
      
      // Mostrar modal
      await interaction.showModal(modal);
    } catch (error) {
      console.error('Erro ao mostrar o modal de adicionar usuário:', error);
      await interaction.reply({
        content: 'Ocorreu um erro ao abrir o formulário. Por favor, tente novamente.',
        ephemeral: true
      });
    }
  }
};