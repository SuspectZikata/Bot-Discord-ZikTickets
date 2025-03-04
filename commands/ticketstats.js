const { 
  ApplicationCommandType, 
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  ComponentType
} = require('discord.js');
const { getTicketStats, getHandlerRankings, resetTicketData } = require('../utils/ticketManager');
const { generateTicketGraph } = require('../utils/graphGenerator');

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

      // Criar botões
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('stats_rankings')
            .setLabel('Rankings')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🏆'),
          new ButtonBuilder()
            .setCustomId('stats_graph')
            .setLabel('Gráfico')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('📊')
        );

      const row2 = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('stats_reset')
            .setLabel('Resetar Dados')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🗑️')
        );
      
      // Responder com as estatísticas e botões
      const message = await interaction.editReply({ 
        embeds: [embed],
        components: [row, row2]
      });

      // Criar coletor de botões
      const collector = message.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 300000 // 5 minutos
      });

      collector.on('collect', async (i) => {
        if (i.user.id !== interaction.user.id) {
          return i.reply({ 
            content: 'Apenas quem executou o comando pode usar estes botões.',
            flags: MessageFlags.Ephemeral
          });
        }

        switch (i.customId) {
          case 'stats_rankings':
            const rankings = getHandlerRankings();
            const rankingsEmbed = new EmbedBuilder()
              .setColor('#0099ff')
              .setTitle('Rankings de Atendimento')
              .addFields(
                { name: 'Ranking Total', value: formatRankings(rankings.total), inline: false },
                { name: 'Ranking Mensal', value: formatRankings(rankings.monthly), inline: false },
                { name: 'Ranking Semanal', value: formatRankings(rankings.weekly), inline: false }
              )
              .setTimestamp();
            await i.update({ embeds: [rankingsEmbed], components: [row, row2] });
            break;

          case 'stats_graph':
            const graphText = generateTicketGraph();
            const graphEmbed = new EmbedBuilder()
              .setColor('#0099ff')
              .setTitle('Gráfico de Estatísticas de Tickets')
              .setDescription('```\n' + graphText + '\n```')
              .setTimestamp();
            await i.update({ embeds: [graphEmbed], components: [row, row2] });
            break;

          case 'stats_reset':
            const confirmRow = new ActionRowBuilder()
              .addComponents(
                new ButtonBuilder()
                  .setCustomId('reset_confirm')
                  .setLabel('Confirmar Reset')
                  .setStyle(ButtonStyle.Danger)
                  .setEmoji('⚠️'),
                new ButtonBuilder()
                  .setCustomId('reset_cancel')
                  .setLabel('Cancelar')
                  .setStyle(ButtonStyle.Secondary)
                  .setEmoji('❌')
              );

            const confirmEmbed = new EmbedBuilder()
              .setColor('#ff0000')
              .setTitle('⚠️ Confirmação de Reset')
              .setDescription('Você está prestes a resetar todos os dados de tickets. Esta ação não pode ser desfeita.\n\nClique em "Confirmar Reset" para prosseguir ou "Cancelar" para abortar.')
              .setTimestamp();

            await i.update({ 
              embeds: [confirmEmbed],
              components: [confirmRow]
            });
            break;

          case 'reset_confirm':
            const finalConfirmRow = new ActionRowBuilder()
              .addComponents(
                new ButtonBuilder()
                  .setCustomId('reset_final_confirm')
                  .setLabel('Confirmar Definitivamente')
                  .setStyle(ButtonStyle.Danger)
                  .setEmoji('💥'),
                new ButtonBuilder()
                  .setCustomId('reset_cancel')
                  .setLabel('Cancelar')
                  .setStyle(ButtonStyle.Secondary)
                  .setEmoji('❌')
              );

            const finalConfirmEmbed = new EmbedBuilder()
              .setColor('#ff0000')
              .setTitle('⚠️ Confirmação Final')
              .setDescription('Esta é sua última chance de cancelar. Todos os dados de tickets serão permanentemente apagados.')
              .setTimestamp();

            await i.update({ 
              embeds: [finalConfirmEmbed],
              components: [finalConfirmRow]
            });
            break;

            case 'reset_final_confirm':
            resetTicketData();
            const resetEmbed = new EmbedBuilder()
              .setColor('#00ff00')
              .setTitle('✅ Dados Resetados')
              .setDescription('Todos os dados de tickets foram resetados com sucesso.')
              .setTimestamp();
            await i.update({ 
              embeds: [resetEmbed],
              components: [row, row2]
            });
            break;

          case 'reset_cancel':
            await i.update({ 
              embeds: [embed],
              components: [row, row2]
            });
            break;
        }
      });

      collector.on('end', () => {
        // Desabilitar botões quando o coletor expirar
        const disabledRow = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('stats_rankings')
              .setLabel('Rankings')
              .setStyle(ButtonStyle.Primary)
              .setEmoji('🏆')
              .setDisabled(true),
            new ButtonBuilder()
              .setCustomId('stats_graph')
              .setLabel('Gráfico')
              .setStyle(ButtonStyle.Primary)
              .setEmoji('📊')
              .setDisabled(true)
          );

        const disabledRow2 = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('stats_reset')
              .setLabel('Resetar Dados')
              .setStyle(ButtonStyle.Danger)
              .setEmoji('🗑️')
              .setDisabled(true)
          );

        interaction.editReply({ components: [disabledRow, disabledRow2] });
      });

    } catch (error) {
      console.error('Erro ao obter estatísticas de tickets:', error);
      await interaction.editReply('Ocorreu um erro ao obter as estatísticas de tickets. Por favor, tente novamente.');
    }
  }
};

function formatRankings(rankings) {
  if (!rankings || rankings.length === 0) {
    return 'Nenhum dado disponível';
  }

  return rankings
    .map((rank, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '•';
      return `${medal} <@${rank.userId}>: ${rank.count} tickets`;
    })
    .join('\n');
}