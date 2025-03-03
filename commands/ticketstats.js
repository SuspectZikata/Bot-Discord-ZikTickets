const { 
  ApplicationCommandType, 
  PermissionFlagsBits,
  EmbedBuilder
} = require('discord.js');
const { getTicketStats } = require('../utils/ticketManager');

module.exports = {
  name: 'ticketstats',
  description: 'Exibe estatísticas do sistema de tickets',
  type: ApplicationCommandType.ChatInput,
  defaultMemberPermissions: PermissionFlagsBits.ManageGuild,

  run: async (client, interaction) => {
    await interaction.deferReply();
    
    try {
      // Obter estatísticas de tickets
      const stats = getTicketStats();
      
      // Formatar tempo médio de resolução
      const avgTime = stats.averageResolutionTime;
      let formattedTime = 'N/A';
      
      if (avgTime > 0) {
        const seconds = Math.floor(avgTime / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) {
          formattedTime = `${days}d ${hours % 24}h ${minutes % 60}m`;
        } else if (hours > 0) {
          formattedTime = `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
          formattedTime = `${minutes}m ${seconds % 60}s`;
        } else {
          formattedTime = `${seconds}s`;
        }
      }
      
      // Criar embed de estatísticas
      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('Estatísticas de Tickets')
        .addFields(
          { name: 'Total de Tickets Criados', value: stats.totalCreated.toString(), inline: true },
          { name: 'Total de Tickets Fechados', value: stats.totalClosed.toString(), inline: true },
          { name: 'Tickets Abertos', value: (stats.totalCreated - stats.totalClosed).toString(), inline: true },
          { name: 'Tempo Médio de Resolução', value: formattedTime, inline: false }
        )
        .setTimestamp()
        .setFooter({ text: 'ZikTickets - Sistema de Suporte' });
      
      // Responder com as estatísticas
      await interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error('Erro ao obter estatísticas de tickets:', error);
      await interaction.editReply('Ocorreu um erro ao obter as estatísticas de tickets. Por favor, tente novamente.');
    }
  }
};