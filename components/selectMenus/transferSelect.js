const { transferTicket } = require('../../utils/ticketManager');

module.exports = {
  customId: 'transfer_select',
  async execute(client, interaction) {
    await interaction.deferUpdate();
    
    try {
      // Obter ID do membro selecionado
      const memberId = interaction.values[0];
      
      // Obter ticket do canal
      const ticketManager = require('../../utils/ticketManager');
      const ticket = ticketManager.getTicketByChannelId(interaction.channelId);
      
      if (!ticket) {
        return interaction.editReply({
          content: 'Este canal não é um ticket válido.',
          components: []
        });
      }
      
      // Transferir ticket
      const result = await transferTicket(interaction, ticket.id, memberId);
      
      if (result.success) {
        // Editar mensagem original
        await interaction.editReply({
          content: result.message,
          components: []
        });
        
        // Enviar embed para o canal
        await interaction.channel.send({ embeds: [result.embed] });
      } else {
        // Editar mensagem original com erro
        await interaction.editReply({
          content: result.message,
          components: []
        });
      }
    } catch (error) {
      console.error('Erro ao transferir o ticket:', error);
      await interaction.editReply({
        content: 'Ocorreu um erro ao transferir o ticket. Por favor, tente novamente.',
        components: []
      });
    }
  }
};