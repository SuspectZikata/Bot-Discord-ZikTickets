const { 
  ApplicationCommandType, 
  ApplicationCommandOptionType, 
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config.json');

module.exports = {
  name: 'setupticket',
  description: 'Configura o sistema de tickets',
  type: ApplicationCommandType.ChatInput,
  options: [
    {
      name: 'channel',
      description: 'Canal onde o painel de tickets será enviado',
      type: ApplicationCommandOptionType.Channel,
      required: true,
    },
    {
      name: 'category',
      description: 'Categoria onde os tickets serão criados',
      type: ApplicationCommandOptionType.Channel,
      channelTypes: [ChannelType.GuildCategory],
      required: true,
    },
    {
      name: 'log_channel',
      description: 'Canal onde os logs de tickets serão enviados',
      type: ApplicationCommandOptionType.Channel,
      required: true,
    },
    {
      name: 'support_role',
      description: 'Cargo da equipe de suporte',
      type: ApplicationCommandOptionType.Role,
      required: true,
    },
    {
      name: 'admin_role',
      description: 'Cargo de administrador',
      type: ApplicationCommandOptionType.Role,
      required: true,
    }
  ],
  defaultMemberPermissions: PermissionFlagsBits.Administrator,

  run: async (client, interaction) => {
    await interaction.deferReply({ ephemeral: true });
    
    try {
      // Obter opções
      const channel = interaction.options.getChannel('channel');
      const category = interaction.options.getChannel('category');
      const logChannel = interaction.options.getChannel('log_channel');
      const supportRole = interaction.options.getRole('support_role');
      const adminRole = interaction.options.getRole('admin_role');
      
      // Validar tipos de canal
      if (channel.type !== ChannelType.GuildText) {
        return interaction.editReply('O canal de tickets deve ser um canal de texto.');
      }
      
      if (category.type !== ChannelType.GuildCategory) {
        return interaction.editReply('A categoria deve ser uma categoria válida.');
      }
      
      if (logChannel.type !== ChannelType.GuildText) {
        return interaction.editReply('O canal de logs deve ser um canal de texto.');
      }
      
      // Atualizar configuração
      const configPath = path.join(__dirname, '../config.json');
      const configData = { ...config };
      
      configData.ticketSettings.categoryId = category.id;
      configData.ticketSettings.logChannelId = logChannel.id;
      configData.ticketSettings.supportRoleId = supportRole.id;
      configData.ticketSettings.adminRoleId = adminRole.id;
      
      // Salvar configuração
      fs.writeFileSync(configPath, JSON.stringify(configData, null, 2), 'utf8');
      
      // Criar embed do painel de tickets
      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('Sistema de Tickets')
        .setDescription(config.messages.welcomeMessage)
        .addFields(
          { name: 'Suporte', value: 'Para problemas técnicos ou dúvidas sobre o servidor', inline: false },
          { name: 'Vendas', value: 'Para informações sobre produtos e serviços', inline: false },
          { name: 'Dúvidas', value: 'Para perguntas gerais', inline: false }
        )
        .setFooter({ text: 'ZikTickets - Sistema de Suporte' });
      
      // Criar linha de ação com botão
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('create_ticket')
            .setLabel('Abrir Ticket')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🎫')
        );
      
      // Enviar painel de tickets
      await channel.send({ embeds: [embed], components: [row] });
      
      // Responder à interação
      await interaction.editReply({
        content: `Sistema de tickets configurado com sucesso! Painel enviado em ${channel}.`,
        ephemeral: true
      });
    } catch (error) {
      console.error('Erro ao configurar o sistema de tickets:', error);
      await interaction.editReply({
        content: 'Ocorreu um erro ao configurar o sistema de tickets. Por favor, tente novamente.',
        ephemeral: true
      });
    }
  }
};