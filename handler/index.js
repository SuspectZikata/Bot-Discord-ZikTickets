const fs = require("fs");

module.exports = async (client) => {
    const SlashsArray = [];

    fs.readdir(`${process.cwd()}/Comandos`, (error, folder) => {
        folder.forEach(subfolder => {
            fs.readdir(`${process.cwd()}/Comandos/${subfolder}/`, (error, files) => {
                files.forEach(files => {
                    if (!files?.endsWith('.js')) return;
                    files = require(`${process.cwd()}/Comandos/${subfolder}/${files}`);
                    if (!files?.name) return;
                    client.slashCommands.set(files?.name, files);
                    SlashsArray.push(files);
                });
            });
        });
    });

    fs.readdir(`${process.cwd()}/Events/`, (erro, files) => {
        files.forEach(file => {
            if (!file.endsWith('.js')) return;
            const event = require(`${process.cwd()}/Events/${file}`);
            if (event.once) {
                client.once(event.name, (...args) => event.execute(...args));
            } else {
                client.on(event.name, (...args) => event.execute(...args));
            }
        });
    });

    client.on("ready", () => {
        client.guilds.cache.forEach(guild => {
            guild.commands.set(SlashsArray);
        });
    });
};