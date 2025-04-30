const { unclaimTicket } = require('../../utils/ticketManager');
const { PermissionFlagsBits, MessageFlags } = require('discord.js');
const config = require('../../config.json');

module.exports = {
  customId: 'ticket_unclaim',
  async execute(client, interaction) {
    await interaction.deferReply();
    
    try {

      // Verificar permissões
      const member = interaction.member;
      const hasPermission = member.permissions.has(PermissionFlagsBits.ManageChannels) || 
                           member.roles.cache.has(config.ticketSettings.adminRoleId);
      
      if (!hasPermission) {
        return interaction.reply({
          content: 'Você não tem permissão.',
          flags: MessageFlags.Ephemeral
        });
      }

      // Obter ticket do canal
      const ticketManager = require('../../utils/ticketManager');
      const ticket = ticketManager.getTicketByChannelId(interaction.channelId);
      
      if (!ticket) {
        return interaction.editReply('Este canal não é um ticket válido.');
      }
      
      // Abdicar do ticket
      const result = await unclaimTicket(interaction, ticket.id, interaction.user.id);
      
      if (result.success) {
        await interaction.editReply({ content: result.message, embeds: [result.embed] });
      } else {
        await interaction.editReply(result.message);
      }
    } catch (error) {
      console.error('Erro ao abdicar do ticket:', error);
      await interaction.editReply('Ocorreu um erro ao abdicar do ticket. Por favor, tente novamente.');
    }
  }
};