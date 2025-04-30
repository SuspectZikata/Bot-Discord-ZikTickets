const { 
  EmbedBuilder,
  AttachmentBuilder,
  MessageFlags,
  PermissionFlagsBits
} = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../../config.json');

module.exports = {
  customId: 'ticket_transcript',
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
      
      // Verificar se o canal de logs existe
      const logChannel = client.channels.cache.get(config.ticketSettings.logChannelId);
      if (!logChannel) {
        return interaction.editReply('Canal de logs não encontrado. Por favor, configure o sistema de tickets novamente.');
      }
      
      // Buscar mensagens
      const messages = await interaction.channel.messages.fetch({ limit: 100 });
      
      // Criar conteúdo do transcript
      let transcriptContent = `# Transcript do Ticket: ${ticket.id}\n\n`;
      transcriptContent += `- Criado por: <@${ticket.userId}>\n`;
      transcriptContent += `- Tipo: ${ticket.type}\n`;
      transcriptContent += `- Criado em: ${new Date(ticket.createdAt).toLocaleString()}\n`;
      
      if (ticket.closedAt) {
        transcriptContent += `- Fechado em: ${new Date(ticket.closedAt).toLocaleString()}\n`;
        transcriptContent += `- Fechado por: <@${ticket.closedBy}>\n`;
      }
      
      transcriptContent += `- Atendido por: ${ticket.claimedBy ? `<@${ticket.claimedBy}>` : 'Ninguém'}\n\n`;
      transcriptContent += `## Mensagens\n\n`;
      
      // Adicionar mensagens ao transcript
      const messageArray = Array.from(messages.values()).reverse();
      for (const msg of messageArray) {
        const time = new Date(msg.createdTimestamp).toLocaleString();
        transcriptContent += `**${msg.author.tag}** (${time}):\n`;
        transcriptContent += `${msg.content || '(sem conteúdo)'}\n\n`;
        
        // Adicionar embeds
        if (msg.embeds.length > 0) {
          transcriptContent += `*[Embed]*\n\n`;
        }
        
        // Adicionar anexos
        if (msg.attachments.size > 0) {
          transcriptContent += `*[Anexos: ${msg.attachments.size}]*\n\n`;
        }
      }
      
      // Criar arquivo de transcript
      const transcriptPath = path.join(__dirname, `../../temp_${ticket.id}.txt`);
      fs.writeFileSync(transcriptPath, transcriptContent, 'utf8');
      
      // Criar anexo
      const attachment = new AttachmentBuilder(transcriptPath, { name: `transcript-${ticket.id}.txt` });
      
      // Criar embed do transcript
      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`Transcript: ${ticket.id}`)
        .setDescription(`Transcript do ticket ${ticket.id} gerado por <@${interaction.user.id}>.`)
        .addFields(
          { name: 'Criado por', value: `<@${ticket.userId}>`, inline: true },
          { name: 'Tipo', value: ticket.type, inline: true },
          { name: 'Status', value: ticket.status, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: 'ZikTickets - Sistema de Suporte' });
      
      // Enviar transcript para o canal de logs
      await logChannel.send({ embeds: [embed], files: [attachment] });
      
      // Responder à interação
      await interaction.editReply('Transcript gerado com sucesso e enviado para o canal de logs.');
      
      // Deletar arquivo temporário
      fs.unlinkSync(transcriptPath);
    } catch (error) {
      console.error('Erro ao gerar o transcript:', error);
      await interaction.editReply('Ocorreu um erro ao gerar o transcript. Por favor, tente novamente.');
    }
  }
};