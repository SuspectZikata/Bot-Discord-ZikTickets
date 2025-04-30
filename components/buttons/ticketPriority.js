const { 
  ActionRowBuilder, 
  MessageFlags,
  StringSelectMenuBuilder,
  PermissionFlagsBits
} = require('discord.js');
const config = require('../../config.json');

module.exports = {
  customId: 'ticket_priority',
  async execute(client, interaction) {
    try {

      // Verificar permissões
      const member = interaction.member;
      const hasPermission = member.permissions.has(PermissionFlagsBits.ManageChannels) || 
                           member.roles.cache.has(config.ticketSettings.adminRoleId);
      
      if (!hasPermission) {
        return interaction.editReply('Você não tem permissão.');
      }

      // Criar menu de seleção de prioridade
      const row = new ActionRowBuilder()
        .addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('priority_select')
            .setPlaceholder('Selecione a prioridade')
            .addOptions([
              {
                label: 'Baixa',
                value: 'low',
                description: 'Prioridade baixa',
                emoji: '🟢'
              },
              {
                label: 'Normal',
                value: 'normal',
                description: 'Prioridade normal',
                emoji: '🟡'
              },
              {
                label: 'Alta',
                value: 'high',
                description: 'Prioridade alta',
                emoji: '🟠'
              },
              {
                label: 'Urgente',
                value: 'urgent',
                description: 'Prioridade urgente',
                emoji: '🔴'
              }
            ])
        );
      
      // Enviar menu de seleção
      await interaction.reply({
        content: 'Selecione a prioridade para este ticket:',
        components: [row],
        flags: MessageFlags.Ephemeral
      });
    } catch (error) {
      console.error('Erro ao mostrar a seleção de prioridade:', error);
      await interaction.reply({
        content: 'Ocorreu um erro ao mostrar as opções de prioridade. Por favor, tente novamente.',
        flags: MessageFlags.Ephemeral
      });
    }
  }
};