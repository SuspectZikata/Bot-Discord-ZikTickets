const Discord = require('discord.js');
const config = require('../../config.json');

module.exports = {
    name: "ranking",
    description: "Mostra os 3 primeiros lugares das pessoas que mais assumiram tickets.",
    type: Discord.ApplicationCommandType.ChatInput,

    run: async (client, interaction) => {
        // Verifica se o usuário tem permissão de administrador
        if (!interaction.member.permissions.has(Discord.PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ 
                content: "🚫 Você não tem permissão para usar este comando. Apenas administradores podem usar.", 
                ephemeral: true 
            });
        }

        // Verifica se há tickets assumidos no config.json
        if (!config.ticketsAssumidos || Object.keys(config.ticketsAssumidos).length === 0) {
            return interaction.reply({ content: "Nenhum ticket foi assumido ainda.", ephemeral: true });
        }

        // Converte o objeto ticketsAssumidos em um array e ordena por quantidade
        const ranking = Object.entries(config.ticketsAssumidos)
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => b.quantidade - a.quantidade)
            .slice(0, 3); // Pega os 3 primeiros

        // Cria o embed para mostrar o ranking
        const embed = new Discord.EmbedBuilder()
            .setTitle("🏆 Ranking de Tickets Assumidos")
            .setColor('Random')
            .setDescription("Aqui estão os 3 primeiros lugares das pessoas que mais assumiram tickets:")
            .setThumbnail(interaction.guild.iconURL())
            .setFooter({ text: `Ranking atualizado em ${new Date().toLocaleDateString()}` });

        // Adiciona os campos ao embed
        ranking.forEach((user, index) => {
            // Menciona o usuário usando o ID
            embed.addFields({
                name: `🏅 ${index + 1}º Lugar`,
                value: `<@${user.id}> - ${user.quantidade} tickets assumidos`, // Menciona o usuário
                inline: false
            });
        });

        // Envia o embed como resposta
        await interaction.reply({ embeds: [embed] });
    }
};