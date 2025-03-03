const { closeTicket } = require('../../utils/ticketManager');

module.exports = {
  customId: 'ticket_close',
  async execute(client, interaction) {
    await interaction.deferReply();
    
    try {
      // Obter ticket do canal
      const ticketManager = require('../../utils/ticketManager');
      const ticket = ticketManager.getTicketByChannelId(interaction.channelId);
      
      if (!ticket) {
        return interaction.editReply('Este canal não é um ticket válido.');
      }
      
      // Fechar ticket
      const result = await closeTicket(interaction, ticket.id, interaction.user.id);
      
      if (result.success) {
        await interaction.editReply(result.message);
      } else {
        await interaction.editReply(result.message);
      }
    } catch (error) {
      console.error('Erro ao fechar o ticket:', error);
      await interaction.editReply('Ocorreu um erro ao fechar o ticket. Por favor, tente novamente.');
    }
  }
};