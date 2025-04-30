const { 
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits
} = require('discord.js');
const config = require('../../config.json');

module.exports = {
  customId: 'ticket_notify',
  async execute(client, interaction) {
    await interaction.deferReply();
    
    try {
      // Obter ticket do canal
      const ticketManager = require('../../utils/ticketManager');
      const ticket = ticketManager.getTicketByChannelId(interaction.channelId);
      
      if (!ticket) {
        return interaction.editReply('Este canal não é um ticket válido.');
      }
      
      // Obter cargo de suporte
      const supportRole = interaction.guild.roles.cache.get(config.ticketSettings.supportRoleId);
      if (!supportRole) {
        return interaction.editReply('Cargo de suporte não encontrado. Por favor, configure o sistema de tickets novamente.');
      }
      
      // Criar embed de notificação
      const embed = new EmbedBuilder()
        .setColor('#ff9900')
        .setTitle(`Notificação de Ticket: ${ticket.id}`)
        .setDescription(`<@${interaction.user.id}> solicita atenção para este ticket!`)
        .addFields(
          { name: 'Criado por', value: `<@${ticket.userId}>`, inline: true },
          { name: 'Tipo', value: ticket.type, inline: true },
          { name: 'Link', value: `[Clique aqui](https://discord.com/channels/${interaction.guild.id}/${interaction.channel.id})`, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: 'ZikTickets - Sistema de Suporte' });
      
      // Enviar notificação para o canal
      await interaction.channel.send({
        content: `<@&${config.ticketSettings.supportRoleId}>`,
        embeds: [embed]
      });
      
      // Responder à interação
      await interaction.editReply('Notificação enviada com sucesso para a equipe de suporte.');
    } catch (error) {
      console.error('Erro ao notificar a equipe de suporte:', error);
      await interaction.editReply('Ocorreu um erro ao notificar a equipe de suporte. Por favor, tente novamente.');
    }
  }
};