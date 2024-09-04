const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Replies with Pong!"),
    async execute(interaction) {
        const member = interaction.member; // Get the GuildMember object
        const displayName = member.nickname || interaction.user.globalName || interaction.user.username; // Check for nickname, globalName, then username
        
        await interaction.reply(`Pong! ${displayName}`);
    }        
};
