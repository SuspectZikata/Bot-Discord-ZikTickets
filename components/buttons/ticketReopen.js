const { 
  PermissionFlagsBits,
  MessageFlags,
  EmbedBuilder
} = require('discord.js');
const config = require('../../config.json');

module.exports = {
  customId: 'ticket_reopen',
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
        return interaction.editReply('Você não tem permissão para Reabrir este ticket.');
      }
      
      // Verificar se o ticket está fechado
      if (ticket.status !== 'closed') {
        return interaction.editReply('Este ticket já está aberto.');
      }
      
      // Atualizar ticket no banco de dados
      const db = require('fs').readFileSync(require('path').join(__dirname, '../../database/tickets.json'), 'utf8');
      const ticketData = JSON.parse(db);
      
      const ticketIndex = ticketData.tickets.findIndex(t => t.id === ticket.id);
      if (ticketIndex === -1) {
        return interaction.editReply('Ticket não encontrado na base de dados.');
      }
      
      ticketData.tickets[ticketIndex].status = 'open';
      ticketData.tickets[ticketIndex].closedAt = null;
      ticketData.tickets[ticketIndex].closedBy = null;
      
      require('fs').writeFileSync(
        require('path').join(__dirname, '../../database/tickets.json'),
        JSON.stringify(ticketData, null, 2),
        'utf8'
      );
      
      // Atualizar permissões do canal
      await interaction.channel.permissionOverwrites.edit(ticket.userId, {
        SendMessages: true
      });
      
      // Criar embed de reabertura
      const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle(`Ticket Reaberto: ${ticket.id}`)
        .setDescription(`Este ticket foi reaberto por <@${interaction.user.id}>.`)
        .setTimestamp()
        .setFooter({ text: 'ZikTickets - Sistema de Suporte' });
      
      // Enviar mensagem de reabertura
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Erro ao reabrir o ticket:', error);
      await interaction.editReply('Ocorreu um erro ao reabrir o ticket. Por favor, tente novamente.');
    }
  }
};