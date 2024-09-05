const { SlashCommandBuilder } = require("discord.js");
const profileModel = require("../models/profileSchema"); // Assuming this is where the profiles are stored

module.exports = {
    data: new SlashCommandBuilder()
        .setName("balance")
        .setDescription("Shows the user's or another user's balance")
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user whose balance you want to check')
                .setRequired(false)),

    async execute(interaction) {
        // Check if an optional user argument is provided
        const targetUser = interaction.options.getUser('user') || interaction.user;

        // Fetch the profile data for the target user (or the one who executed the command)
        let profileData = await profileModel.findOne({ userId: targetUser.id });

        if (!profileData) {
            return interaction.reply({ content: `${targetUser} does not have a profile yet.`, ephemeral: true });
        }

        const { balance } = profileData;

        // Reply with the balance of the specified user or the user who executed the command
        await interaction.reply(`${targetUser} has a balance of ${balance} leobux.`);
    }
};
