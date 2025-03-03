const { addUserToTicket } = require('../../utils/ticketManager');

module.exports = {
  customId: 'add_user_modal',
  async execute(client, interaction) {
    await interaction.deferReply();
    
    try {
      // Obter ID do usuário a partir da entrada
      let userId = interaction.fields.getTextInputValue('user_id');
      
      // Extrair ID do usuário da menção, se necessário
      if (userId.startsWith('<@') && userId.endsWith('>')) {
        userId = userId.slice(2, -1);
        
        if (userId.startsWith('!')) {
          userId = userId.slice(1);
        }
      }
      
      // Obter ticket do canal
      const ticketManager = require('../../utils/ticketManager');
      const ticket = ticketManager.getTicketByChannelId(interaction.channelId);
      
      if (!ticket) {
        return interaction.editReply('Este canal não é um ticket válido.');
      }
      
      // Adicionar usuário ao ticket
      const result = await addUserToTicket(interaction, ticket.id, userId);
      
      if (result.success) {
        await interaction.editReply(result.message);
      } else {
        await interaction.editReply(result.message);
      }
    } catch (error) {
      console.error('Erro ao adicionar usuário ao ticket:', error);
      await interaction.editReply('Ocorreu um erro ao adicionar o usuário ao ticket. Por favor, tente novamente.');
    }
  }
};