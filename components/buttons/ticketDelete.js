const { 
  PermissionFlagsBits,
  EmbedBuilder
} = require('discord.js');
const config = require('../../config.json');

module.exports = {
  customId: 'ticket_delete',
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
        return interaction.editReply('Você não tem permissão para excluir este ticket.');
      }
      
      // Criar embed de exclusão
      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle(`Ticket Excluído: ${ticket.id}`)
        .setDescription(`Este ticket será excluído em 5 segundos.`)
        .setTimestamp()
        .setFooter({ text: 'ZikTickets - Sistema de Suporte' });
      
      // Enviar mensagem de exclusão
      await interaction.editReply({ embeds: [embed] });
      
      // Excluir canal após 5 segundos
      setTimeout(async () => {
        try {
          await interaction.channel.delete();
        } catch (error) {
          console.error('Erro ao excluir canal:', error);
        }
      }, 5000);
    } catch (error) {
      console.error('Erro ao excluir ticket:', error);
      await interaction.editReply('Ocorreu um erro ao excluir o ticket. Por favor, tente novamente.');
    }
  }
};