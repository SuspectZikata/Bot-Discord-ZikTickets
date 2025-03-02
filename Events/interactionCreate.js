const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  ChannelType
} = require('discord.js');
const Transcript = require('discord-html-transcripts');
const fs = require('fs');
const config = require('../config.json');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    if (!interaction.isStringSelectMenu() && !interaction.isButton()) return;

    // Função para criar embeds com estilo moderno e profissional
    const createEmbed = (title, description, color = '#0099ff') => new EmbedBuilder()
      .setColor(color)
      .setTitle(title)
      .setDescription(description)
      .setFooter({
        text: `${interaction.client.user.username} - Suporte Técnico`,
        iconURL: interaction.client.user.displayAvatarURL()
      });

    // Função para criar linhas de botões
    const createButtonRow = (buttons) => new ActionRowBuilder().addComponents(buttons);

    // Menu de seleção para configurações
    if (interaction.isStringSelectMenu()) {
      switch (interaction.customId) {
        case 'CanalSelecionado':
          config.canalTicket = interaction.values[0];
          fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));

          const canalSelecionado = `📢 **Canal de Tickets:** <#${config.canalTicket}>`;
          const categoriaSelecionada = config.categoriaId ? `📂 **Categoria de Tickets:** <#${config.categoriaId}>` : "📂 **Categoria de Tickets:** Nenhuma";
          const transcriptSelecionado = config.transcriptChannelId ? `📝 **Canal de Transcripts:** <#${config.transcriptChannelId}>` : "📝 **Canal de Transcripts:** Nenhum";

          const updatedMessage = `⚙️ **Configurações do Sistema de Tickets**\n\n` +
            `${canalSelecionado}\n` +
            `${categoriaSelecionada}\n` +
            `${transcriptSelecionado}`;

          await interaction.update({ content: updatedMessage });
          break;

        case 'CategoriaSelecionada':
          config.categoriaId = interaction.values[0];
          fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));

          const canalSelecionadoCategoria = config.canalTicket ? `📢 **Canal de Tickets:** <#${config.canalTicket}>` : "📢 **Canal de Tickets:** Nenhum";
          const categoriaSelecionadaCategoria = `📂 **Categoria de Tickets:** <#${config.categoriaId}>`;
          const transcriptSelecionadoCategoria = config.transcriptChannelId ? `📝 **Canal de Transcripts:** <#${config.transcriptChannelId}>` : "📝 **Canal de Transcripts:** Nenhum";

          const updatedMessageCategoria = `⚙️ **Configurações do Sistema de Tickets**\n\n` +
            `${canalSelecionadoCategoria}\n` +
            `${categoriaSelecionadaCategoria}\n` +
            `${transcriptSelecionadoCategoria}`;

          await interaction.update({ content: updatedMessageCategoria });
          break;

        case 'TranscriptSelecionado':
          config.transcriptChannelId = interaction.values[0];
          fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));

          const canalSelecionadoTranscript = config.canalTicket ? `📢 **Canal de Tickets:** <#${config.canalTicket}>` : "📢 **Canal de Tickets:** Nenhum";
          const categoriaSelecionadaTranscript = config.categoriaId ? `📂 **Categoria de Tickets:** <#${config.categoriaId}>` : "📂 **Categoria de Tickets:** Nenhuma";
          const transcriptSelecionadoTranscript = `📝 **Canal de Transcripts:** <#${config.transcriptChannelId}>`;

          const updatedMessageTranscript = `⚙️ **Configurações do Sistema de Tickets**\n\n` +
            `${canalSelecionadoTranscript}\n` +
            `${categoriaSelecionadaTranscript}\n` +
            `${transcriptSelecionadoTranscript}`;

          await interaction.update({ content: updatedMessageTranscript });
          break;
      }
    }

    // Interações com botões
    if (interaction.isButton()) {
      switch (interaction.customId) {
        case 'EnviarPainel':
          if (!config.canalTicket) {
            return interaction.reply({
              embeds: [createEmbed('❌ Erro de Configuração', 'Nenhum canal configurado para enviar o painel. Configure um canal primeiro.', '#ff0000')],
              ephemeral: true
            });
          }

          const embed = createEmbed('🎟️ Suporte Técnico', 'Para solicitar suporte técnico, clique no botão abaixo para abrir um ticket.');

          const row = createButtonRow([
            new ButtonBuilder()
              .setStyle(ButtonStyle.Primary)
              .setCustomId('Criar')
              .setLabel('Abrir Ticket')
          ]);

          const channel = interaction.guild.channels.cache.get(config.canalTicket);
          if (!channel) {
            return interaction.reply({
              embeds: [createEmbed('❌ Erro de Configuração', 'Canal configurado não encontrado. Verifique as configurações.', '#ff0000')],
              ephemeral: true
            });
          }

          await channel.send({ embeds: [embed], components: [row] });
          await interaction.reply({
            embeds: [createEmbed('✅ Painel Enviado', `Painel de tickets enviado com sucesso para o canal <#${config.canalTicket}>.`, '#00ff00')],
            ephemeral: true
          });
          break;

        case 'Criar':
          if (interaction.guild.channels.cache.find(c => c.topic === interaction.user.id)) {
            return interaction.reply({
              embeds: [createEmbed('⚠️ Limite de Tickets', 'Você já tem um ticket aberto. Feche o ticket existente antes de abrir um novo.', '#ffcc00')],
              ephemeral: true
            });
          }

          config.quantidadeTickets = (config.quantidadeTickets || 0) + 1;
          fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));

          await interaction.deferReply({ ephemeral: true });
          await new Promise(resolve => setTimeout(resolve, 1000));

          const quantidade = String(config.quantidadeTickets).padStart(4, "0");
          const newChannel = await interaction.guild.channels.create({
            name: `${interaction.user.username}-${quantidade}`,
            type: ChannelType.GuildText,
            parent: config.categoriaId,
            permissionOverwrites: [
              {
                id: interaction.guildId,
                deny: [PermissionFlagsBits.ViewChannel]
              },
              {
                id: interaction.user.id,
                allow: [PermissionFlagsBits.ViewChannel]
              },
            ]
          });

          const ticketEmbed = createEmbed('🎟️ Ticket Aberto', 'Nossa equipe de suporte estará com você em breve. Por favor, forneça detalhes sobre o seu problema ou solicitação.');
          const ticketRow = createButtonRow([
            new ButtonBuilder()
              .setStyle(ButtonStyle.Success)
              .setCustomId('Assumir')
              .setLabel('Assumir Ticket'),
            new ButtonBuilder()
              .setStyle(ButtonStyle.Danger)
              .setCustomId('Fechar')
              .setLabel('Fechar Ticket')
          ]);

          newChannel.setTopic(interaction.user.id);
          const cargosMencionados = config.cargos && config.cargos.length > 0 
            ? `\n<@&${config.cargos.join('>, <@&')}>`
            : '';

          await newChannel.send({
            content: `${interaction.user} Bem-vindo ao seu ticket.${cargosMencionados}`,
            embeds: [ticketEmbed],
            components: [ticketRow]
          });

          await interaction.editReply({
            embeds: [createEmbed('✅ Ticket Criado', `Seu ticket foi criado com sucesso: ${newChannel}`, '#00ff00')],
            ephemeral: true
          });
          break;

        case 'Assumir':
          if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
              embeds: [createEmbed('⚠️ Permissão Negada', 'Apenas administradores podem assumir tickets.', '#ffcc00')],
              ephemeral: true
            });
          }

          if (!config.ticketsAssumidos) {
            config.ticketsAssumidos = {};
          }

          if (!config.ticketsAssumidos[interaction.user.id]) {
            config.ticketsAssumidos[interaction.user.id] = {
              nome: interaction.user.username,
              quantidade: 0
            };
          }

          config.ticketsAssumidos[interaction.user.id].quantidade += 1;
          fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));

          const assumirEmbed = createEmbed('👋 Ticket Assumido', `Este ticket foi assumido por ${interaction.user.username}.`);
          const assumirRow = createButtonRow([
            new ButtonBuilder()
              .setStyle(ButtonStyle.Success)
              .setCustomId('Assumir')
              .setLabel('Assumir')
              .setDisabled(true),
            new ButtonBuilder()
              .setStyle(ButtonStyle.Danger)
              .setCustomId('Abdicar')
              .setLabel('Abdicar'),
            new ButtonBuilder()
              .setStyle(ButtonStyle.Secondary)
              .setCustomId('Fechar')
              .setLabel('Fechar')
          ]);

          await interaction.message.edit({ embeds: [assumirEmbed], components: [assumirRow] });
          await interaction.reply({
            embeds: [createEmbed('✅ Ticket Assumido', 'Você assumiu o ticket com sucesso.', '#00ff00')],
            ephemeral: true
          });
          break;

        case 'Abdicar':
          if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
              embeds: [createEmbed('⚠️ Permissão Negada', 'Apenas administradores podem abdicar de tickets.', '#ffcc00')],
              ephemeral: true
            });
          }

          if (!config.ticketsAssumidos || !config.ticketsAssumidos[interaction.user.id]) {
            return interaction.reply({
              embeds: [createEmbed('⚠️ Nenhum Ticket Assumido', 'Você não possui nenhum ticket assumido para abdicar.', '#ffcc00')],
              ephemeral: true
            });
          }

          config.ticketsAssumidos[interaction.user.id].quantidade = Math.max(0, config.ticketsAssumidos[interaction.user.id].quantidade - 1);
          fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));

          const abdicarEmbed = createEmbed('🔄 Ticket Abdicado', 'Este ticket está disponível para outro membro da equipe assumir.');
          const abdicarRow = createButtonRow([
            new ButtonBuilder()
              .setStyle(ButtonStyle.Success)
              .setCustomId('Assumir')
              .setLabel('Assumir')
              .setDisabled(false),
            new ButtonBuilder()
              .setStyle(ButtonStyle.Danger)
              .setCustomId('Fechar')
              .setLabel('Fechar')
          ]);

          await interaction.message.edit({ embeds: [abdicarEmbed], components: [abdicarRow] });
          await interaction.reply({
            embeds: [createEmbed('✅ Ticket Abdicado', 'Você abdicou do ticket com sucesso.', '#00ff00')],
            ephemeral: true
          });
          break;

        case 'Fechar':
          if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
              embeds: [createEmbed('⚠️ Permissão Negada', 'Apenas administradores podem fechar tickets.', '#ffcc00')],
              ephemeral: true
            });
          }

            const fecharRow = createButtonRow([
            new ButtonBuilder()
              .setStyle(ButtonStyle.Danger)
              .setCustomId('Confirmar')
              .setLabel('Fechar'),
            new ButtonBuilder()
              .setStyle(ButtonStyle.Secondary)
              .setCustomId('Cancelar')
              .setLabel('Cancelar')
            ]);

            await interaction.reply({
            embeds: [createEmbed('⚠️ Confirmar Fechamento', 'Tem certeza de que deseja fechar este ticket?', '#ffcc00')],
            components: [fecharRow]
            });
            break;

          case 'Cancelar':
            await interaction.update({
            embeds: [createEmbed('✅ Fechamento Cancelado', 'O fechamento do ticket foi cancelado.', '#00ff00')],
            components: []
            });
            break;

          case 'Confirmar':
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
              embeds: [createEmbed('⚠️ Permissão Negada', 'Apenas administradores podem fechar tickets.', '#ffcc00')],
              ephemeral: true
            });
            }

            try {
            const combinedEmbed = createEmbed('🔒 Ticket Fechado', `Este ticket foi fechado por ${interaction.user.username}.`);

            const confirmarRow = createButtonRow([
              new ButtonBuilder()
              .setStyle(ButtonStyle.Secondary)
              .setCustomId('Transcrição')
              .setLabel('Gerar Transcript'),
              new ButtonBuilder()
              .setStyle(ButtonStyle.Secondary)
              .setCustomId('Abrir')
              .setLabel('Reabrir Ticket'),
              new ButtonBuilder()
              .setStyle(ButtonStyle.Danger)
              .setCustomId('Excluir')
              .setLabel('Excluir Ticket')
            ]);

            await interaction.message.delete();
            await interaction.channel.setName(`fechado-${interaction.channel.name.slice(-4)}`);

            await interaction.channel.send({
              embeds: [combinedEmbed],
              components: [confirmarRow]
            });

          } catch (error) {
            console.error("Erro ao fechar ticket:", error);
            if (!interaction.replied && !interaction.deferred) {
              await interaction.reply({
                embeds: [createEmbed('❌ Erro ao Fechar Ticket', 'Ocorreu um erro ao fechar o ticket. Tente novamente.', '#ff0000')],
                ephemeral: true
              });
            }
          }
          break;

        case 'Transcrição':
          if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
              embeds: [createEmbed('⚠️ Permissão Negada', 'Apenas administradores podem gerar transcripts.', '#ffcc00')],
              ephemeral: true
            });
          }

          try {
            const transcriptFile = await Transcript.createTranscript(interaction.channel);

            if (config.transcriptChannelId) {
              const transcriptChannel = interaction.guild.channels.cache.get(config.transcriptChannelId);
              if (transcriptChannel) {
                await transcriptChannel.send({
                  content: `Transcript do ticket ${interaction.channel.name}:`,
                  files: [transcriptFile]
                });
                await interaction.reply({
                  embeds: [createEmbed('✅ Transcript Enviado', 'O transcript foi enviado com sucesso para o canal configurado.', '#00ff00')],
                  ephemeral: true
                });
              } else {
                await interaction.reply({
                  embeds: [createEmbed('⚠️ Canal de Transcript Não Encontrado', 'Enviando o transcript no canal atual.', '#ffcc00')],
                  files: [transcriptFile],
                  ephemeral: true
                });
              }
            } else {
              await interaction.reply({
                files: [transcriptFile],
                ephemeral: true
              });
            }
          } catch (error) {
            console.error("Erro ao gerar transcript:", error);
            await interaction.reply({
              embeds: [createEmbed('❌ Erro ao Gerar Transcript', 'Ocorreu um erro ao gerar o transcript. Tente novamente.', '#ff0000')],
              ephemeral: true
            });
          }
          break;

        case 'Abrir':
          if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
              embeds: [createEmbed('⚠️ Permissão Negada', 'Apenas administradores podem reabrir tickets.', '#ffcc00')],
              ephemeral: true
            });
          }

          const abrirEmbed = createEmbed('🔓 Ticket Reaberto', `Este ticket foi reaberto por ${interaction.user.username}.`);

          await interaction.message.delete();
          await interaction.channel.permissionOverwrites.edit(
            interaction.channel.topic,
            { ViewChannel: true }
          );
          await interaction.reply({ embeds: [abrirEmbed] });
          break;

        case 'Excluir':
          if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
              embeds: [createEmbed('⚠️ Permissão Negada', 'Apenas administradores podem excluir tickets.', '#ffcc00')],
              ephemeral: true
            });
          }

          interaction.message.components[0].components[2].data.disabled = true;
          await interaction.update({ components: [interaction.message.components[0]] });
          await new Promise(resolve => setTimeout(resolve, 5000));
          await interaction.channel.delete();
          break;
      }
    }
  }
};