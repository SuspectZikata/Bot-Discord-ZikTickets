const { 
  EmbedBuilder 
} = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  customId: 'edit_ticket_modal',
  async execute(client, interaction) {
    await interaction.deferReply();
    
    try {
      // Obter ticket do canal
      const ticketManager = require('../../utils/ticketManager');
      const ticket = ticketManager.getTicketByChannelId(interaction.channelId);
      
      if (!ticket) {
        return interaction.editReply('Este canal não é um ticket válido.');
      }
      
      // Obter valores do formulário
      const title = interaction.fields.getTextInputValue('ticket_title');
      const description = interaction.fields.getTextInputValue('ticket_description');
      
      // Atualizar ticket no banco de dados
      const dbPath = path.join(__dirname, '../../database/tickets.json');
      const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      
      const ticketIndex = db.tickets.findIndex(t => t.id === ticket.id);
      if (ticketIndex === -1) {
        return interaction.editReply('Ticket não encontrado na base de dados.');
      }
      
      db.tickets[ticketIndex].title = title;
      db.tickets[ticketIndex].description = description;
      
      fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
      
      // Criar embed atualizado
      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`Ticket Atualizado: ${title}`)
        .setDescription(description || 'Sem descrição.')
        .addFields(
          { name: 'Editado por', value: `<@${interaction.user.id}>`, inline: true },
          { name: 'ID do Ticket', value: ticket.id, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: 'ZikTickets - Sistema de Suporte' });
      
      // Enviar mensagem atualizada
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Erro ao editar o ticket:', error);
      await interaction.editReply('Ocorreu um erro ao editar o ticket. Por favor, tente novamente.');
    }
  }
};