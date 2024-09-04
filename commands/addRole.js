const { SlashCommandBuilder } = require("discord.js");
const profileModel = require("../models/profileSchema");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("addrole")
        .setDescription("Add a role to a user")
        .addUserOption(option =>
            option.setName("user")
                .setDescription("The user to add the role to")
                .setRequired(true))
        .addStringOption(option =>
            option.setName("role")
                .setDescription("The name of the role")
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName("rank")
                .setDescription("The rank of the role")
                .setRequired(true)),

    async execute(interaction) {
        const userId = interaction.options.getUser("user").id;
        const roleName = interaction.options.getString("role");
        const roleRank = interaction.options.getInteger("rank");

        try {
            // Find the user's profile
            const profileData = await profileModel.findOne({ userId: userId, serverId: interaction.guild.id });

            // Check if the role (case-insensitive) already exists
            const roleExists = profileData?.roles.some(role => role.name.toLowerCase() === roleName.toLowerCase());

            if (roleExists) {
                return interaction.reply(`Role "${roleName}" already exists for <@${userId}>. No duplicate roles allowed.`);
            }

            // Add the role if it doesn't exist
            await profileModel.findOneAndUpdate(
                { userId: userId, serverId: interaction.guild.id },
                { $push: { roles: { name: roleName, rank: roleRank } } },
                { new: true, upsert: true }
            );

            await interaction.reply(`Role "${roleName}" with rank ${roleRank} has been added to <@${userId}>.`);
        } catch (error) {
            console.error("Error adding role:", error);
            await interaction.reply("There was an error adding the role. Please try again later.");
        }
    },
};
