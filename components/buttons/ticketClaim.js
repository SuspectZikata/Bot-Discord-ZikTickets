const { claimTicket } = require('../../utils/ticketManager');
const { PermissionFlagsBits, MessageFlags } = require('discord.js');
const config = require('../../config.json');

module.exports = {
  customId: 'ticket_claim',
  async execute(client, interaction) {
    await interaction.deferReply();
    
    try {
      // Obter ticket do canal
      const ticketManager = require('../../utils/ticketManager');
      const ticket = ticketManager.getTicketByChannelId(interaction.channelId);
      
      if (!ticket) {
        return interaction.editReply('Este canal não é um ticket válido.');
      }

      // Verificar permissões
      const member = interaction.member;
      const hasPermission = member.permissions.has(PermissionFlagsBits.ManageChannels) || 
                           member.roles.cache.has(config.ticketSettings.adminRoleId);
      
      if (!hasPermission) {
        return interaction.editReply('Você não tem permissão Assumir este ticket.');
      }
      
      // Atender ticket
      const result = await claimTicket(interaction, ticket.id, interaction.user.id);
      
      if (result.success) {
        await interaction.editReply({ content: result.message, embeds: [result.embed] });
      } else {
        await interaction.editReply(result.message);
      }
    } catch (error) {
      console.error('Erro ao atender o ticket:', error);
      await interaction.editReply('Ocorreu um erro ao atender o ticket. Por favor, tente novamente.');
    }
  }
};