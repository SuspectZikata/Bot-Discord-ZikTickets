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

    const createEmbed = (description, user) => new EmbedBuilder()
      .setColor('Random')
      .setDescription(description)
      .setThumbnail(interaction.client.user.displayAvatarURL())
      .setFooter({
        text: `${interaction.client.user.username} - Ticket.`,
        iconURL: interaction.client.user.displayAvatarURL()
      });

    const createButtonRow = (buttons) => new ActionRowBuilder().addComponents(buttons);

    if (interaction.isStringSelectMenu()) {
      switch (interaction.customId) {
        case 'CanalSelecionado':
          config.canalTicket = interaction.values[0];
          fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));

          const canalSelecionado = `📢 Canal selecionado: <#${config.canalTicket}>`;
          const categoriaSelecionada = config.categoriaId ? `📂 Categoria selecionada: <#${config.categoriaId}>` : "📂 Categoria selecionada: Nenhuma";
          const transcriptSelecionado = config.transcriptChannelId ? `📝 Canal de transcript selecionado: <#${config.transcriptChannelId}>` : "📝 Canal de transcript selecionado: Nenhum";

          const updatedMessage = `⚙️ **Editor de configuração básica do Ticket Tool.**\n\n` +
            `${canalSelecionado}\n` +
            `${categoriaSelecionada}\n` +
            `${transcriptSelecionado}`;

          await interaction.update({ content: updatedMessage });
          break;

        case 'CategoriaSelecionada':
          config.categoriaId = interaction.values[0];
          fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));

          const canalSelecionadoCategoria = config.canalTicket ? `📢 Canal selecionado: <#${config.canalTicket}>` : "📢 Canal selecionado: Nenhum";
          const categoriaSelecionadaCategoria = `📂 Categoria selecionada: <#${config.categoriaId}>`;
          const transcriptSelecionadoCategoria = config.transcriptChannelId ? `📝 Canal de transcript selecionado: <#${config.transcriptChannelId}>` : "📝 Canal de transcript selecionado: Nenhum";

          const updatedMessageCategoria = `⚙️ **Editor de configuração básica do Ticket Tool.**\n\n` +
            `${canalSelecionadoCategoria}\n` +
            `${categoriaSelecionadaCategoria}\n` +
            `${transcriptSelecionadoCategoria}`;

          await interaction.update({ content: updatedMessageCategoria });
          break;

        case 'TranscriptSelecionado':
          config.transcriptChannelId = interaction.values[0];
          fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));

          const canalSelecionadoTranscript = config.canalTicket ? `📢 Canal selecionado: <#${config.canalTicket}>` : "📢 Canal selecionado: Nenhum";
          const categoriaSelecionadaTranscript = config.categoriaId ? `📂 Categoria selecionada: <#${config.categoriaId}>` : "📂 Categoria selecionada: Nenhuma";
          const transcriptSelecionadoTranscript = `📝 Canal de transcript selecionado: <#${config.transcriptChannelId}>`;

          const updatedMessageTranscript = `⚙️ **Editor de configuração básica do Ticket Tool.**\n\n` +
            `${canalSelecionadoTranscript}\n` +
            `${categoriaSelecionadaTranscript}\n` +
            `${transcriptSelecionadoTranscript}`;

          await interaction.update({ content: updatedMessageTranscript });
          break;
      }
    }

    if (interaction.isButton()) {
      switch (interaction.customId) {
        case 'EnviarPainel':
          if (!config.canalTicket) {
            return interaction.reply({
              content: "❌ Nenhum canal configurado para enviar o painel. Configure um canal primeiro.",
              ephemeral: true
            });
          }

          const embed = new EmbedBuilder()
            .setColor('Random')
            .setDescription('Para criar um ticket, clique em \n ** 📩 Criar Ticket **')
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .setFooter({
              text: `${interaction.client.user.username} - Ticket.`,
              iconURL: interaction.client.user.displayAvatarURL()
            });

          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setStyle(ButtonStyle.Secondary)
              .setCustomId('Criar')
              .setLabel('Criar Ticket')
              .setEmoji('📩')
          );

          const channel = interaction.guild.channels.cache.get(config.canalTicket);
          if (!channel) {
            return interaction.reply({
              content: "❌ Canal configurado não encontrado. Verifique as configurações.",
              ephemeral: true
            });
          }

          await channel.send({ embeds: [embed], components: [row] });
          await interaction.reply({
            content: `✅ Painel de tickets enviado com sucesso para o canal <#${config.canalTicket}>.`,
            ephemeral: true
          });
          break;

        case 'Criar':
          if (interaction.guild.channels.cache.find(c => c.topic === interaction.user.id)) {
            return interaction.reply({
              content: "> **Aviso:** Limite de tickets atingido. Você já tem 1 ticket aberto dos 1 permitidos para este painel.",
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

          const ticketEmbed = createEmbed('🎟️ **Ticket Aberto!** 🚀\nNossa equipe de suporte estará com você em breve!\nEnquanto isso, já adiante as informações necessárias para agilizar seu atendimento. ⏳💬\n\n🔄 Ticket disponível para suporte.');
          const ticketRow = createButtonRow([
            new ButtonBuilder()
              .setStyle(ButtonStyle.Success)
              .setCustomId('Assumir')
              .setLabel('Assumir')
              .setEmoji('👋'),
            new ButtonBuilder()
              .setStyle(ButtonStyle.Secondary)
              .setCustomId('Fechar')
              .setLabel('Fechar')
              .setEmoji('🔒')
          ]);

          newChannel.setTopic(interaction.user.id);
          const cargosMencionados = config.cargos && config.cargos.length > 0 
          ? `\n<@&${config.cargos.join('>, <@&')}>` // Menciona os cargos
          : ''; // Se não houver cargos, não menciona nada
          await newChannel.send({
              content: `${interaction.user} Bem-vindo.${cargosMencionados}`, // Adiciona os cargos mencionados
              embeds: [ticketEmbed],
              components: [ticketRow]
          });

          await interaction.editReply({
            content: `Ticket criado ${newChannel}`,
            ephemeral: true
          });
          break;

        case 'Assumir':
          try {
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
              return await interaction.reply({
                content: "🚫 Apenas administradores podem assumir tickets!",
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

            const assumirEmbed = createEmbed(`🎟️ **Ticket Aberto!** 🚀\nNossa equipe de suporte estará com você em breve!\nEnquanto isso, já adiante as informações necessárias para agilizar seu atendimento. ⏳💬\n\n👋 Ticket assumido por: ${interaction.user}`);
            const assumirRow = createButtonRow([
              new ButtonBuilder()
                .setStyle(ButtonStyle.Success)
                .setCustomId('Assumir')
                .setLabel('Assumir')
                .setEmoji('👋')
                .setDisabled(true),
              new ButtonBuilder()
                .setStyle(ButtonStyle.Danger)
                .setCustomId('Abdicar')
                .setLabel('Abdicar')
                .setEmoji('🔄'),
              new ButtonBuilder()
                .setStyle(ButtonStyle.Secondary)
                .setCustomId('Fechar')
                .setLabel('Fechar')
                .setEmoji('🔒')
            ]);

            await interaction.message.edit({
              embeds: [assumirEmbed],
              components: [assumirRow]
            });

            await interaction.reply({
              content: `Ticket assumido com sucesso! Por favor, ${interaction.user.toString()} seja paciente e respeitoso.`,
              ephemeral: true
            });

          } catch (error) {
            console.error("Erro ao assumir ticket:", error);
            if (!interaction.replied && !interaction.deferred) {
              await interaction.reply({
                content: "Ocorreu um erro ao assumir o ticket. Tente novamente.",
                ephemeral: true
              });
            }
          }
          break;

        case 'Abdicar':
          try {
            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
              return await interaction.reply({
                content: "🚫 Apenas administradores podem abdicar de tickets!",
                ephemeral: true
              });
            }

            if (!config.ticketsAssumidos || !config.ticketsAssumidos[interaction.user.id]) {
              return await interaction.reply({
                content: "Você não possui nenhum ticket assumido para abdicar.",
                ephemeral: true
              });
            }

            config.ticketsAssumidos[interaction.user.id].quantidade = Math.max(0, config.ticketsAssumidos[interaction.user.id].quantidade - 1);
            fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));

            const abdicarEmbed = createEmbed(`🎟️ **Ticket Aberto!** 🚀\nNossa equipe de suporte estará com você em breve!\nEnquanto isso, já adiante as informações necessárias para agilizar seu atendimento. ⏳💬\n\n🔄 Ticket disponível para suporte.`);
            const abdicarRow = createButtonRow([
              new ButtonBuilder()
                .setStyle(ButtonStyle.Success)
                .setCustomId('Assumir')
                .setLabel('Assumir')
                .setEmoji('👋')
                .setDisabled(false),
              new ButtonBuilder()
                .setStyle(ButtonStyle.Secondary)
                .setCustomId('Fechar')
                .setLabel('Fechar')
                .setEmoji('🔒')
            ]);

            await interaction.message.edit({
              embeds: [abdicarEmbed],
              components: [abdicarRow]
            });

            await interaction.reply({
              content: `Você abdicou do ticket com sucesso. O ticket está disponível para outro membro da equipe assumir.`,
              ephemeral: true
            });

          } catch (error) {
            console.error("Erro ao abdicar do ticket:", error);
            if (!interaction.replied && !interaction.deferred) {
              await interaction.reply({
                content: "Ocorreu um erro ao abdicar do ticket. Tente novamente.",
                ephemeral: true
              });
            }
          }
          break;

        case 'Fechar':
          if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
              content: "🚫 Apenas administradores podem fechar tickets!",
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
            content: "Tem certeza que deseja fechar este ticket?",
            components: [fecharRow]
          });
          break;

        case 'Cancelar':
          if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
              content: "🚫 Apenas administradores podem cancelar esta ação!",
              ephemeral: true
            });
          }
          await interaction.message.delete();
          break;

        case 'Confirmar':
          if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
              content: "🚫 Apenas administradores podem fechar tickets!",
              ephemeral: true
            });
          }

          try {
            const combinedEmbed = createEmbed(`Ticket fechado por ${interaction.user}.\n\nControles de ticket da equipe de suporte.`);

            const confirmarRow = createButtonRow([
              new ButtonBuilder()
                .setStyle(ButtonStyle.Secondary)
                .setCustomId('Transcrição')
                .setLabel('Transcrição')
                .setEmoji('📑'),
              new ButtonBuilder()
                .setStyle(ButtonStyle.Secondary)
                .setCustomId('Abrir')
                .setLabel('Abrir')
                .setEmoji('🔓'),
              new ButtonBuilder()
                .setStyle(ButtonStyle.Secondary)
                .setCustomId('Excluir')
                .setLabel('Excluir')
                .setEmoji('⛔')
            ]);

            await interaction.message.delete();
            await interaction.channel.setName(`fechado-${interaction.channel.name.slice(-4)}`);

            const response = await interaction.channel.send({
              embeds: [combinedEmbed],
              components: [confirmarRow]
            });

          } catch (error) {
            console.error("Erro ao fechar ticket:", error);
            if (!interaction.replied && !interaction.deferred) {
              await interaction.reply({
                content: "Ocorreu um erro ao fechar o ticket. Tente novamente.",
                ephemeral: true
              });
            }
          }
          break;

        case 'Transcrição':
          if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
              content: "🚫 Apenas administradores podem gerar transcripts!",
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
                  content: "Transcript enviado com sucesso para o canal configurado!",
                  ephemeral: true
                });
              } else {
                await interaction.reply({
                  content: "Canal de transcript não encontrado. Enviando no canal atual:",
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
              content: "Ocorreu um erro ao gerar o transcript. Tente novamente.",
              ephemeral: true
            });
          }
          break;

        case 'Abrir':
          if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
              content: "🚫 Apenas administradores podem reabrir tickets!",
              ephemeral: true
            });
          }

          const abrirEmbed = createEmbed(`Ticket aberto por ${interaction.user}.`);

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
              content: "🚫 Apenas administradores podem excluir tickets!",
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