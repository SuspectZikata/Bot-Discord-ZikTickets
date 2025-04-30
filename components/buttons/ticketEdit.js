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
  customId: 'ticket_edit',
  async execute(client, interaction) {
    try {
      // Verificar permissões
      const member = interaction.member;
      const hasPermission = member.permissions.has(PermissionFlagsBits.ManageChannels) || 
                           member.roles.cache.has(config.ticketSettings.adminRoleId);
      
      if (!hasPermission) {
        return interaction.reply({
          content: 'Você não tem permissão para editar este ticket.',
          flags: MessageFlags.Ephemeral
        });
      }

      // Obter ticket do canal
      const ticketManager = require('../../utils/ticketManager');
      const ticket = ticketManager.getTicketByChannelId(interaction.channelId);
      
      if (!ticket) {
        return interaction.reply({
          content: 'Este canal não é um ticket válido.',
          flags: MessageFlags.Ephemeral
        });
      }
      
      // Criar modal
      const modal = new ModalBuilder()
        .setCustomId('edit_ticket_modal')
        .setTitle('Editar Ticket');
      
      // Criar entradas de texto
      const titleInput = new TextInputBuilder()
        .setCustomId('ticket_title')
        .setLabel('Título do Ticket')
        .setPlaceholder('Digite o novo título do ticket')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setValue(ticket.title || `Ticket: ${ticket.type}`);
      
      const descriptionInput = new TextInputBuilder()
        .setCustomId('ticket_description')
        .setLabel('Descrição do Ticket')
        .setPlaceholder('Digite a nova descrição do ticket')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false)
        .setValue(ticket.description || '');
      
      // Adicionar entradas ao modal
      const titleRow = new ActionRowBuilder().addComponents(titleInput);
      const descriptionRow = new ActionRowBuilder().addComponents(descriptionInput);
      modal.addComponents(titleRow, descriptionRow);
      
      // Mostrar modal
      await interaction.showModal(modal);
    } catch (error) {
      console.error('Erro ao mostrar modal de edição de ticket:', error);
      await interaction.reply({
        content: 'Ocorreu um erro ao abrir o formulário de edição. Por favor, tente novamente.',
        flags: MessageFlags.Ephemeral
      });
    }
  }
};