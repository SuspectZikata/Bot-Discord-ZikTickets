const { createTicket } = require('../../utils/ticketManager');

module.exports = {
  customId: 'ticket_type_select',
  async execute(client, interaction) {
    await interaction.deferUpdate();
    
    try {
      // Obter o tipo de ticket selecionado
      const ticketType = interaction.values[0];
      
      // Criar ticket
      const result = await createTicket(interaction, ticketType);
      
      if (result.success) {
        // Editar mensagem original
        await interaction.editReply({
          content: `${result.message} Seu ticket foi criado em ${result.channel}.`,
          embeds: [],
          components: []
        });
      } else {
        // Editar mensagem original com erro
        await interaction.editReply({
          content: result.message,
          embeds: [],
          components: []
        });
      }
    } catch (error) {
      console.error('Erro ao criar o ticket:', error);
      await interaction.editReply({
        content: 'Ocorreu um erro ao criar o ticket. Por favor, tente novamente.',
        embeds: [],
        components: []
      });
    }
  }
};