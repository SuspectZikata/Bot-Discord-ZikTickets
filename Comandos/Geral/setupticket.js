const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionsBitField, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');

module.exports = {
    name: "setupticket",
    description: "Configura o AutoCall e o Canal de Voz do bot.",
    options: [],

    run: async (client, interaction) => {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ 
                content: "🚫 Você não tem permissão para usar este comando.", 
                ephemeral: true 
            });
        }

        const configPath = path.join(__dirname, '../../config.json');
        const config = require(configPath);

        // Inicializa a lista de cargos se não existir
        if (!config.cargos) {
            config.cargos = [];
            fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        }

        function createMessage() {
            const embed = new EmbedBuilder()
                .setColor(config.autoCall ? "Green" : "Red")
                .setTitle("⚙️ Configuração do Bot")
                .setDescription("Configure o AutoCall e o Canal de Voz")
                .addFields(
                    { name: "AutoCall", value: config.autoCall ? "🟢 Ativado" : "🔴 Desativado" },
                    { name: "Canal de Voz", value: config.canalVozId ? `<#${config.canalVozId}>` : "Nenhum canal configurado" },
                    { name: "Cargos Tickets", value: config.cargos.length > 0 ? config.cargos.map(id => `<@&${id}>`).join(', ') : "Nenhum cargo configurado" }
                );

            const toggleButton = new ButtonBuilder()
                .setCustomId('toggle_autocall')
                .setLabel(config.autoCall ? 'Desativar AutoCall' : 'Ativar AutoCall')
                .setStyle(config.autoCall ? ButtonStyle.Danger : ButtonStyle.Success)
                .setEmoji(config.autoCall ? '🔒' : '🔓');

            const channelButton = new ButtonBuilder()
                .setCustomId('set_channel')
                .setLabel('Configurar Canal')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🛠️');

            const addRoleButton = new ButtonBuilder()
                .setCustomId('add_role')
                .setLabel('Adicionar Cargo')
                .setStyle(ButtonStyle.Success)
                .setEmoji('➕');

            const removeRoleButton = new ButtonBuilder()
                .setCustomId('remove_role')
                .setLabel('Remover Cargo')
                .setStyle(ButtonStyle.Danger)
                .setEmoji('➖');

            // Primeira linha de botões (AutoCall e Configurar Canal)
            const firstActionRow = new ActionRowBuilder()
                .addComponents(toggleButton, channelButton);

            // Segunda linha de botões (Adicionar Cargo e Remover Cargo)
            const secondActionRow = new ActionRowBuilder()
                .addComponents(addRoleButton, removeRoleButton);

            return { embeds: [embed], components: [firstActionRow, secondActionRow] };
        }

        const message = await interaction.reply({
            ...createMessage(),
            ephemeral: true,
            fetchReply: true
        });

        const collector = message.createMessageComponentCollector({ time: 300000 });

        collector.on('collect', async (i) => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({ 
                    content: "🚫 Apenas o executor pode interagir.", 
                    ephemeral: true 
                });
            }

            if (i.customId === 'toggle_autocall') {
                // Toggle AutoCall status
                config.autoCall = !config.autoCall;
                fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

                // Se o AutoCall for desativado, sair do canal de voz
                if (!config.autoCall) {
                    const connection = getVoiceConnection(interaction.guild.id);
                    if (connection) {
                        connection.destroy(); // Sai do canal de voz
                        console.log('✅ Bot saiu do canal de voz (AutoCall desativado).');
                    }
                }

                // Se o AutoCall for ativado e houver um canal configurado, entrar no canal
                if (config.autoCall && config.canalVozId) {
                    const channel = client.channels.cache.get(config.canalVozId);
                    if (channel) {
                        try {
                            joinVoiceChannel({
                                channelId: channel.id,
                                guildId: channel.guild.id,
                                adapterCreator: channel.guild.voiceAdapterCreator,
                            });
                            console.log(`✅ Bot entrou no canal de voz [ ${channel.name} ] (AutoCall ativado).`);
                        } catch (e) {
                            console.log(`❌ Erro ao entrar no canal: ${e}`);
                        }
                    }
                }

                await i.update(createMessage());
            }
            else if (i.customId === 'set_channel') {
                const modal = new ModalBuilder()
                    .setCustomId('set_channel_modal')
                    .setTitle('Configurar Canal de Voz');

                const canalVozInput = new TextInputBuilder()
                    .setCustomId('canalvoz_input')
                    .setLabel('ID do Canal de Voz')
                    .setStyle(TextInputStyle.Short)
                    .setValue(config.canalVozId || '')
                    .setRequired(true);

                const actionRow = new ActionRowBuilder().addComponents(canalVozInput);
                modal.addComponents(actionRow);

                await i.showModal(modal);
            }
            else if (i.customId === 'add_role') {
                const modal = new ModalBuilder()
                    .setCustomId('add_role_modal')
                    .setTitle('Adicionar Cargo');

                const roleInput = new TextInputBuilder()
                    .setCustomId('role_input')
                    .setLabel('ID do Cargo')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const actionRow = new ActionRowBuilder().addComponents(roleInput);
                modal.addComponents(actionRow);

                await i.showModal(modal);
            }
            else if (i.customId === 'remove_role') {
                const modal = new ModalBuilder()
                    .setCustomId('remove_role_modal')
                    .setTitle('Remover Cargo');

                const roleInput = new TextInputBuilder()
                    .setCustomId('role_input')
                    .setLabel('ID do Cargo')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true);

                const actionRow = new ActionRowBuilder().addComponents(roleInput);
                modal.addComponents(actionRow);

                await i.showModal(modal);
            }
        });

        client.on('interactionCreate', async (modalInteraction) => {
            if (!modalInteraction.isModalSubmit()) return;

            await modalInteraction.deferUpdate();

            if (modalInteraction.customId === 'set_channel_modal') {
                const canalVozId = modalInteraction.fields.getTextInputValue('canalvoz_input');
                const canalVoz = client.channels.cache.get(canalVozId);

                if (!canalVoz || canalVoz.type !== ChannelType.GuildVoice) {
                    return modalInteraction.followUp({ content: "❌ Canal de voz inválido ou não encontrado.", ephemeral: true });
                }

                config.canalVozId = canalVozId;
                fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

                await modalInteraction.editReply(createMessage());

                if (config.autoCall) {
                    try {
                        joinVoiceChannel({
                            channelId: canalVozId,
                            guildId: canalVoz.guild.id,
                            adapterCreator: canalVoz.guild.voiceAdapterCreator,
                        });
                        console.log(`✅ Bot entrou no canal de voz [ ${canalVoz.name} ] (AutoCall ativado).`);
                    } catch (e) {
                        console.log(`❌ Erro ao entrar no canal: ${e}`);
                    }
                }

            }
            else if (modalInteraction.customId === 'add_role_modal') {
                const roleId = modalInteraction.fields.getTextInputValue('role_input');
                const role = interaction.guild.roles.cache.get(roleId);

                if (!role) {
                    return modalInteraction.followUp({ content: "❌ Cargo inválido ou não encontrado.", ephemeral: true });
                }

                if (config.cargos.includes(roleId)) {
                    return modalInteraction.followUp({ content: "❌ Este cargo já está configurado.", ephemeral: true });
                }

                config.cargos.push(roleId);
                fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

                await modalInteraction.editReply(createMessage());
             
            }
            else if (modalInteraction.customId === 'remove_role_modal') {
                const roleId = modalInteraction.fields.getTextInputValue('role_input');

                if (!config.cargos.includes(roleId)) {
                    return modalInteraction.followUp({ content: "❌ Este cargo não está configurado.", ephemeral: true });
                }

                config.cargos = config.cargos.filter(id => id !== roleId);
                fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

                await modalInteraction.editReply(createMessage());
              
            }
        });

        collector.on('end', () => {
            interaction.editReply({ components: [] }).catch(() => {});
        });
    }
};