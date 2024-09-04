const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
            .setName("balance")
            .setDescription("Shows the user's balance"),
    async execute(interaction, profileData) {
        const { balance } = profileData;
        await interaction.reply(`${interaction.user} has a balance of ${balance}.`)
    }        
}