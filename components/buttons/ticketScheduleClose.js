const { 
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  PermissionFlagsBits
} = require('discord.js');
const config = require('../../config.json');

module.exports = {
  customId: 'ticket_schedule_close',
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
      
      // Verificar se o ticket já está fechado
      if (ticket.status === 'closed') {
        return interaction.editReply('Este ticket já está fechado.');
      }
      
      // Verificar se o ticket já possui um fechamento agendado
      if (ticket.scheduledClose) {
        return interaction.editReply('Este ticket já possui um fechamento agendado.');
      }
      
      // Atualizar ticket no banco de dados
      const fs = require('fs');
      const path = require('path');
      const dbPath = path.join(__dirname, '../../database/tickets.json');
      const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      
      const ticketIndex = db.tickets.findIndex(t => t.id === ticket.id);
      if (ticketIndex === -1) {
        return interaction.editReply('Ticket não encontrado na base de dados.');
      }
      
      // Definir horário de fechamento agendado (24 horas a partir de agora)
      const closeTime = Date.now() + 24 * 60 * 60 * 1000;
      db.tickets[ticketIndex].scheduledClose = closeTime;
      
      fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
      
      // Criar embed de fechamento agendado
      const embed = new EmbedBuilder()
        .setColor('#ff9900')
        .setTitle(`Fechamento Agendado: ${ticket.id}`)
        .setDescription('Este ticket será fechado automaticamente em 24 horas devido à inatividade.')
        .addFields(
          { name: 'Agendado por', value: `<@${interaction.user.id}>`, inline: true },
          { name: 'Fechamento em', value: `<t:${Math.floor(closeTime / 1000)}:R>`, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: 'ZikTickets - Sistema de Suporte' });
      
      // Criar linha de ação com botão de cancelar
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`ticket_cancel_close_${ticket.id}`)
            .setLabel('Cancelar Fechamento')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('❌')
        );
      
      // Enviar mensagem de fechamento agendado
      await interaction.channel.send({ 
        embeds: [embed],
        components: [row]
      });
      
      // Responder à interação
      await interaction.editReply('Fechamento automático agendado para 24 horas.');
      
      // Função de fechamento agendado
      setTimeout(async () => {
        try {
          // Verificar se o ticket ainda possui fechamento agendado
          const currentDb = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
          const currentTicket = currentDb.tickets.find(t => t.id === ticket.id);
          
          if (currentTicket && currentTicket.scheduledClose && currentTicket.status !== 'closed') {
            // Fechar o ticket
            const { closeTicket } = require('../../utils/ticketManager');
            await closeTicket(interaction, ticket.id, client.user.id);
            
            // Enviar mensagem de fechamento automático
            await interaction.channel.send('Este ticket foi fechado automaticamente devido à inatividade.');
          }
        } catch (error) {
          console.error('Erro ao fechar ticket automaticamente:', error);
        }
      }, 24 * 60 * 60 * 1000);
      
    } catch (error) {
      console.error('Erro ao agendar fechamento do ticket:', error);
      await interaction.editReply('Ocorreu um erro ao agendar o fechamento do ticket. Por favor, tente novamente.');
    }
  }
};