const { 
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../../config.json');

module.exports = {
  customId: 'ticket_cancel_close',
  async execute(client, interaction) {
    // Extrair ID do ticket do custom ID (formato: ticket_cancel_close_TICKETID)
    const ticketId = interaction.customId.split('_').slice(3).join('_');
    
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

      // Obter ticket do banco de dados
      const dbPath = path.join(__dirname, '../../database/tickets.json');
      const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      
      const ticketIndex = db.tickets.findIndex(t => t.id === ticketId);
      if (ticketIndex === -1) {
        return interaction.editReply('Ticket não encontrado na base de dados.');
      }
      
      // Verificar se o ticket possui fechamento agendado
      if (!db.tickets[ticketIndex].scheduledClose) {
        return interaction.editReply('Este ticket não possui um fechamento agendado.');
      }
      
      // Remover fechamento agendado
      db.tickets[ticketIndex].scheduledClose = null;
      
      fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
      
      // Criar embed de cancelamento
      const embed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle(`Fechamento Cancelado: ${ticketId}`)
        .setDescription(`O fechamento automático deste ticket foi cancelado por <@${interaction.user.id}>.`)
        .setTimestamp()
        .setFooter({ text: 'ZikTickets - Sistema de Suporte' });
      
      // Enviar mensagem de cancelamento
      await interaction.editReply({ embeds: [embed] });
      
      // Desativar o botão de cancelamento
      if (interaction.message) {
        await interaction.message.edit({ components: [] });
      }
    } catch (error) {
      console.error('Erro ao cancelar o fechamento agendado:', error);
      await interaction.editReply('Ocorreu um erro ao cancelar o fechamento agendado. Por favor, tente novamente.');
    }
  }
};