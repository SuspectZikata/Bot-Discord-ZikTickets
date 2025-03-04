const { 
  ActionRowBuilder, 
  StringSelectMenuBuilder,
  MessageFlags,
  EmbedBuilder
} = require('discord.js');
const config = require('../../config.json');

module.exports = {
  customId: 'create_ticket',
  async execute(client, interaction) {
    try {
      // Criar menu de seleção de tipo de ticket
      const options = config.ticketTypes.map(type => ({
        label: type.label,
        value: type.id,
        description: type.description,
        emoji: type.emoji
      }));
      
      const row = new ActionRowBuilder()
        .addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('ticket_type_select')
            .setPlaceholder('Selecione o tipo de ticket')
            .addOptions(options)
        );
      
      // Criar embed de seleção
      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('Criar um Ticket')
        .setDescription('Por favor, selecione o tipo de ticket que deseja criar:')
        .setFooter({ text: 'ZikTickets - Sistema de Suporte' });
      
      // Enviar menu de seleção
      await interaction.reply({
        embeds: [embed],
        components: [row],
        flags: MessageFlags.Ephemeral
      });
    } catch (error) {
      console.error('Erro ao criar a seleção de tickets:', error);
      await interaction.reply({
        content: 'Ocorreu um erro ao criar o menu de seleção de tickets. Por favor, tente novamente.',
        flags: MessageFlags.Ephemeral
      });
    }
  }
};