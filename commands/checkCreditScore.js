const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
            .setName("socialcreditscore")
            .setDescription("Shows the user's social credit score"),
    async execute(interaction, profileData) {
        const { socialCreditScore } = profileData;
        await interaction.reply(`${interaction.user} has a social credit score of ${socialCreditScore}.`)
    }        
}