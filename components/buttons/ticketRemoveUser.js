const { 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle,
  MessageFlags, 
  ActionRowBuilder,
  PermissionFlagsBits
} = require('discord.js');
const config = require('../../config.json');

module.exports = {
  customId: 'ticket_remove_user',
  async execute(client, interaction) {
    try {

      // Verificar permissões
      const member = interaction.member;
      const hasPermission = member.permissions.has(PermissionFlagsBits.ManageChannels) || 
                           member.roles.cache.has(config.ticketSettings.adminRoleId);
      
      if (!hasPermission) {
        return interaction.reply({
          content: 'Você não tem permissão para remover usuários a este ticket.',
          flags: MessageFlags.Ephemeral
        });
      }

      // Criar modal
      const modal = new ModalBuilder()
        .setCustomId('remove_user_modal')
        .setTitle('Remover Usuário do Ticket');
      
      // Criar campo de texto
      const userIdInput = new TextInputBuilder()
        .setCustomId('user_id')
        .setLabel('ID do Usuário ou Menção')
        .setPlaceholder('Digite o ID do usuário ou a menção (@usuário)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);
      
      // Adicionar campo ao modal
      const firstActionRow = new ActionRowBuilder().addComponents(userIdInput);
      modal.addComponents(firstActionRow);
      
      // Mostrar modal
      await interaction.showModal(modal);
    } catch (error) {
      console.error('Erro ao mostrar modal de remover usuário:', error);
      await interaction.reply({
        content: 'Ocorreu um erro ao abrir o formulário. Por favor, tente novamente.',
        flags: MessageFlags.Ephemeral
      });
    }
  }
};