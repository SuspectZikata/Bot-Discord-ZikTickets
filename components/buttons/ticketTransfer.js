const { 
  ActionRowBuilder, 
  StringSelectMenuBuilder,
  EmbedBuilder
} = require('discord.js');
const config = require('../../config.json');

module.exports = {
  customId: 'ticket_transfer',
  async execute(client, interaction) {
    try {
      // Obter ticket do canal
      const ticketManager = require('../../utils/ticketManager');
      const ticket = ticketManager.getTicketByChannelId(interaction.channelId);
      
      if (!ticket) {
        return interaction.reply({
          content: 'Este canal não é um ticket válido.',
          ephemeral: true
        });
      }
      
      // Obter membros do cargo de suporte
      const supportRole = interaction.guild.roles.cache.get(config.ticketSettings.supportRoleId);
      if (!supportRole) {
        return interaction.reply({
          content: 'Cargo de suporte não encontrado. Por favor, configure o sistema de tickets novamente.',
          ephemeral: true
        });
      }
      
      // Obter membros com o cargo de suporte
      const supportMembers = interaction.guild.members.cache.filter(member => 
        member.roles.cache.has(supportRole.id) && !member.user.bot
      );
      
      if (supportMembers.size === 0) {
        return interaction.reply({
          content: 'Não há membros da equipe de suporte disponíveis para transferência.',
          ephemeral: true
        });
      }
      
      // Criar opções para o menu de seleção
      const options = supportMembers.map(member => ({
        label: member.displayName,
        value: member.id,
        description: `ID: ${member.id}`,
        emoji: '👤'
      }));
      
      // Criar menu de seleção
      const row = new ActionRowBuilder()
        .addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('transfer_select')
            .setPlaceholder('Selecione um membro para transferir o ticket')
            .addOptions(options.slice(0, 25)) // O Discord limita a 25 opções
        );
      
      // Enviar menu de seleção
      await interaction.reply({
        content: 'Selecione um membro da equipe para transferir este ticket:',
        components: [row],
        ephemeral: true
      });
    } catch (error) {
      console.error('Erro ao mostrar a seleção de transferência:', error);
      await interaction.reply({
        content: 'Ocorreu um erro ao mostrar as opções de transferência. Por favor, tente novamente.',
        ephemeral: true
      });
    }
  }
};