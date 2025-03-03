const { unclaimTicket } = require('../../utils/ticketManager');

module.exports = {
  customId: 'ticket_unclaim',
  async execute(client, interaction) {
    await interaction.deferReply();
    
    try {
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