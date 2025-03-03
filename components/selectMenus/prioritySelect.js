const { setTicketPriority } = require('../../utils/ticketManager');

module.exports = {
  customId: 'priority_select',
  async execute(client, interaction) {
    await interaction.deferUpdate();
    
    try {
      // Obter prioridade selecionada
      const priority = interaction.values[0];
      
      // Obter ticket do canal
      const ticketManager = require('../../utils/ticketManager');
      const ticket = ticketManager.getTicketByChannelId(interaction.channelId);
      
      if (!ticket) {
        return interaction.editReply({
          content: 'Este canal não é um ticket válido.',
          components: []
        });
      }
      
      // Definir prioridade do ticket
      const result = await setTicketPriority(interaction, ticket.id, priority);
      
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
      console.error('Erro ao definir a prioridade do ticket:', error);
      await interaction.editReply({
        content: 'Ocorreu um erro ao definir a prioridade do ticket. Por favor, tente novamente.',
        components: []
      });
    }
  }
};