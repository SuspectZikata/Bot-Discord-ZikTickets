const Discord = require('discord.js');
const config = require("../../config.json");

module.exports = {
    name: "ticket",
    description: "Configuração e editor de configurações.",
    type: Discord.ApplicationCommandType.ChatInput,

    run: async (client, interaction) => {
        if (!interaction.member.permissions.has(Discord.PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: "🚫 Você não possui permissão para utilizar este comando.", ephemeral: true });
        }

        await interaction.deferReply({ ephemeral: true });

        // Função para criar a mensagem de configuração
        const createConfigMessage = () => {
            const canalSelecionado = config.canalTicket ? `📢 Canal selecionado: <#${config.canalTicket}>` : "📢 Canal selecionado: Nenhum";
            const categoriaSelecionada = config.categoriaId ? `📂 Categoria selecionada: <#${config.categoriaId}>` : "📂 Categoria selecionada: Nenhuma";
            const transcriptSelecionado = config.transcriptChannelId ? `📝 Canal de transcript selecionado: <#${config.transcriptChannelId}>` : "📝 Canal de transcript selecionado: Nenhum";

            return `⚙️ **Editor de configuração básica do Ticket Tool.**\n\n` +
                   `${canalSelecionado}\n` +
                   `${categoriaSelecionada}\n` +
                   `${transcriptSelecionado}`;
        };

        // Criar os menus de seleção
        let canalSelect = new Discord.StringSelectMenuBuilder()
            .setCustomId('CanalSelecionado')
            .setPlaceholder('📢 Selecione um canal para enviar o painel.');

        let categoriaSelect = new Discord.StringSelectMenuBuilder()
            .setCustomId('CategoriaSelecionada')
            .setPlaceholder('📂 Selecione uma categoria para os tickets.');

        let transcriptSelect = new Discord.StringSelectMenuBuilder()
            .setCustomId('TranscriptSelecionado')
            .setPlaceholder('📝 Selecione um canal para os transcripts.');

        // Botão para enviar o painel de tickets
        const sendPanelButton = new Discord.ButtonBuilder()
            .setCustomId('EnviarPainel')
            .setLabel('Enviar Painel')
            .setStyle(Discord.ButtonStyle.Primary);

        // Obter canais e categorias do servidor
        try {
            const channels = await interaction.guild.channels.fetch();
            let canalOptions = [];
            let categoriaOptions = [];
            let transcriptOptions = [];

            channels.forEach(elemento => {
                if (elemento.type === Discord.ChannelType.GuildText) {
                    canalOptions.push({ label: elemento.name.toUpperCase(), value: elemento.id });
                    transcriptOptions.push({ label: elemento.name.toUpperCase(), value: elemento.id });
                }
                if (elemento.type === Discord.ChannelType.GuildCategory) {
                    categoriaOptions.push({ label: elemento.name.toUpperCase(), value: elemento.id });
                }
            });

            // Adicionar opções aos menus
            if (canalOptions.length > 0) {
                canalSelect.addOptions(canalOptions.slice(0, 25)); // Limita a 25 opções
                transcriptSelect.addOptions(transcriptOptions.slice(0, 25)); // Limita a 25 opções
            }
            if (categoriaOptions.length > 0) {
                categoriaSelect.addOptions(categoriaOptions.slice(0, 25)); // Limita a 25 opções
            }

            let canalRow = new Discord.ActionRowBuilder().addComponents(canalSelect);
            let categoriaRow = new Discord.ActionRowBuilder().addComponents(categoriaSelect);
            let transcriptRow = new Discord.ActionRowBuilder().addComponents(transcriptSelect);
            let buttonRow = new Discord.ActionRowBuilder().addComponents(sendPanelButton);

            // Responder a interação
            await interaction.editReply({
                content: createConfigMessage(),
                components: [canalRow, categoriaRow, transcriptRow, buttonRow]
            });

        } catch (error) {
            console.error("Erro ao buscar canais:", error);
            await interaction.editReply({ content: "❌ Ocorreu um erro ao buscar os canais. Tente novamente mais tarde." });
        }
    }
};
