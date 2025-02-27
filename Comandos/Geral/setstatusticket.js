const Discord = require("discord.js");
const fs = require('fs');
const config = require('../../config.json');

// Função para atualizar o status do bot
async function updateBotStatus(client, statusConfig) {
    try {
        await client.user.setPresence({
            status: statusConfig.status,
            activities: [{
                name: statusConfig.description || 'Nenhuma descrição',
                type: parseInt(statusConfig.activityType)
            }]
        });

        // Salva no config.json para persistência
        config.status = { ...statusConfig };
        fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
        
        return true;
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        return false;
    }
}

module.exports = {
    updateBotStatus,
    name: "setstatusticket",
    description: "Configure o status do bot de Tickets.",
    options: [],

    run: async (client, interaction) => {
            // Verifica se o usuário tem permissão de administrador
            if (!interaction.member.permissions.has(Discord.PermissionsBitField.Flags.Administrator)) {
                return interaction.reply({ 
                    content: "🚫 Você não tem permissão para usar este comando. Apenas administradores podem usar.", 
                    ephemeral: true 
                });
            }

        // Status options with emojis and descriptions
        const statusOptions = [
            { emoji: "🟢", name: "online", label: "Online", description: "Mostra que o bot está online e ativo" },
            { emoji: "🔴", name: "dnd", label: "Não Perturbe", description: "Mostra que o bot está ocupado" },
            { emoji: "🟡", name: "idle", label: "Ausente", description: "Mostra que o bot está ausente" },
            { emoji: "⚫", name: "invisible", label: "Invisível", description: "Oculta o status do bot" }
        ];

        // Activity type options
        const activityTypes = [
            { name: Discord.ActivityType.Playing, label: "Jogando" },
            { name: Discord.ActivityType.Listening, label: "Ouvindo" },
            { name: Discord.ActivityType.Watching, label: "Assistindo" },
            { name: Discord.ActivityType.Competing, label: "Competindo em" }
        ];

        // Carrega o status atual do config ou usa valores padrão
        let newStatus = {
            status: config.status?.status || 'online',
            activityType: config.status?.activityType || 0,
            description: config.status?.description || ''
        };

        function createComponents() {
            // Create status selection menu
            const statusMenu = new Discord.StringSelectMenuBuilder()
                .setCustomId('status_select')
                .setPlaceholder('Selecione o status')
                .addOptions(
                    statusOptions.map(status => ({
                        label: status.label,
                        description: status.description,
                        value: status.name,
                        emoji: status.emoji,
                        default: status.name === newStatus.status
                    }))
                );

            // Create activity type selection menu
            const activityTypeMenu = new Discord.StringSelectMenuBuilder()
                .setCustomId('activity_type_select')
                .setPlaceholder('Selecione o tipo de atividade')
                .addOptions(
                    activityTypes.map(type => ({
                        label: type.label,
                        value: type.name.toString(),
                        default: type.name === newStatus.activityType
                    }))
                );

            // Create buttons
            const editDescriptionButton = new Discord.ButtonBuilder()
                .setCustomId('edit_description')
                .setLabel('Editar')
                .setStyle(Discord.ButtonStyle.Primary)
                .setEmoji('📝');

            const saveButton = new Discord.ButtonBuilder()
                .setCustomId('save_status')
                .setLabel('Salvar')
                .setStyle(Discord.ButtonStyle.Success)
                .setEmoji('💾');

            // Create action rows
            const statusRow = new Discord.ActionRowBuilder().addComponents(statusMenu);
            const activityTypeRow = new Discord.ActionRowBuilder().addComponents(activityTypeMenu);
            const buttonRow = new Discord.ActionRowBuilder().addComponents(editDescriptionButton, saveButton);

            return [statusRow, activityTypeRow, buttonRow];
        }

        function createEmbed() {
            return new Discord.EmbedBuilder()
                .setColor("Blue")
                .setTitle("🔧 Configuração de Status")
                .setDescription("Configure o status do bot usando as opções abaixo.")
                .addFields(
                    { 
                        name: "Status Atual", 
                        value: `${statusOptions.find(s => s.name === newStatus.status)?.emoji || '🟢'} ${newStatus.status}`
                    },
                    { 
                        name: "Tipo de Atividade", 
                        value: activityTypes.find(t => t.name === newStatus.activityType)?.label || 'Jogando'
                    },
                    { 
                        name: "Descrição", 
                        value: newStatus.description || 'Nenhuma descrição definida'
                    }
                );
        }

        // Send initial message
        const message = await interaction.reply({ 
            embeds: [createEmbed()], 
            components: createComponents(),
            ephemeral: true,
            fetchReply: true
        });

        // Create collector for interactions
        const collector = message.createMessageComponentCollector({ 
            time: 300000 // 5 minutos
        });

        collector.on('collect', async i => {
            if (i.user.id !== interaction.user.id) {
                await i.reply({ 
                    content: 'Você não pode usar estes controles.', 
                    ephemeral: true 
                });
                return;
            }

            try {
                if (i.customId === 'status_select') {
                    newStatus.status = i.values[0];
                    await updateBotStatus(client, newStatus);
                    await i.update({ 
                        embeds: [createEmbed()], 
                        components: createComponents() 
                    });
                }
                else if (i.customId === 'activity_type_select') {
                    newStatus.activityType = parseInt(i.values[0]);
                    await updateBotStatus(client, newStatus);
                    await i.update({ 
                        embeds: [createEmbed()], 
                        components: createComponents() 
                    });
                }
                else if (i.customId === 'edit_description') {
                    const modal = new Discord.ModalBuilder()
                        .setCustomId('description_modal')
                        .setTitle('Editar');

                    const descriptionInput = new Discord.TextInputBuilder()
                        .setCustomId('description_input')
                        .setLabel('Nova descrição')
                        .setStyle(Discord.TextInputStyle.Short)
                        .setMaxLength(128)
                        .setValue(newStatus.description || '')
                        .setRequired(true);

                    const actionRow = new Discord.ActionRowBuilder().addComponents(descriptionInput);
                    modal.addComponents(actionRow);

                    await i.showModal(modal);
                }
                else if (i.customId === 'save_status') {
                    await i.deferUpdate();
                    await updateBotStatus(client, newStatus);
                    
                    await i.editReply({ 
                        embeds: [createEmbed()], 
                        components: createComponents() 
                    });
                    
                    
                }
            } catch (error) {
                console.error('Erro ao processar interação:', error);
                await i.followUp({
                    content: '❌ Ocorreu um erro ao processar sua solicitação.',
                    ephemeral: true
                }).catch(console.error);
            }
        });

        // Handle modal submit
        const modalHandler = async (modalInteraction) => {
            if (!modalInteraction.isModalSubmit()) return;
            if (modalInteraction.customId !== 'description_modal') return;
            if (modalInteraction.user.id !== interaction.user.id) return;

            try {
                await modalInteraction.deferUpdate();
                newStatus.description = modalInteraction.fields.getTextInputValue('description_input');
                await updateBotStatus(client, newStatus);
                
                await modalInteraction.editReply({
                    embeds: [createEmbed()],
                    components: createComponents()
                });
            } catch (error) {
                console.error('Erro ao processar modal:', error);
                await modalInteraction.followUp({
                    content: '❌ Ocorreu um erro ao atualizar a descrição.',
                    ephemeral: true
                }).catch(console.error);
            }
        };

        // Add modal handler
        client.on('interactionCreate', modalHandler);

        // When collector ends
        collector.on('end', () => {
            try {
                interaction.editReply({ 
                    components: [] 
                }).catch(() => {});
                
                // Remove the modal handler
                client.removeListener('interactionCreate', modalHandler);
            } catch (error) {
                console.error('Erro ao finalizar coletor:', error);
            }
        });
    }
};