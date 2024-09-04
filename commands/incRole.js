const { SlashCommandBuilder } = require("discord.js");
const profileModel = require("../models/profileSchema");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("incrole")
        .setDescription("Increment the rank of a user's role")
        .addUserOption(option =>
            option.setName("user")
                .setDescription("The user whose role rank will be incremented")
                .setRequired(true))
        .addStringOption(option =>
            option.setName("role")
                .setDescription("The name of the role")
                .setRequired(true)),

    async execute(interaction) {
        const userId = interaction.options.getUser("user").id;
        const roleName = interaction.options.getString("role");

        try {
            const profileData = await profileModel.findOneAndUpdate(
                { userId: userId, serverId: interaction.guild.id, "roles.name": { $regex: new RegExp(`^${roleName}$`, "i") } },
                { $inc: { "roles.$.rank": 1 } },
                { new: true }
            );

            if (!profileData) {
                return interaction.reply(`Role "${roleName}" not found for <@${userId}>.`);
            }

            const updatedRole = profileData.roles.find(role => role.name.toLowerCase() === roleName.toLowerCase());
            const romanRank = convertToRoman(updatedRole.rank);

            await interaction.reply(`Rank of role "${updatedRole.name}" has been incremented to ${romanRank} for <@${userId}>.`);
        } catch (error) {
            console.error("Error incrementing role rank:", error);
            await interaction.reply("There was an error incrementing the role rank. Please try again later.");
        }
    },
};

function convertToRoman(num) {
    const romanNumeralMap = [
        { value: 1000, symbol: 'M' },
        { value: 900, symbol: 'CM' },
        { value: 500, symbol: 'D' },
        { value: 400, symbol: 'CD' },
        { value: 100, symbol: 'C' },
        { value: 90, symbol: 'XC' },
        { value: 50, symbol: 'L' },
        { value: 40, symbol: 'XL' },
        { value: 10, symbol: 'X' },
        { value: 9, symbol: 'IX' },
        { value: 5, symbol: 'V' },
        { value: 4, symbol: 'IV' },
        { value: 1, symbol: 'I' }
    ];

    let result = '';
    for (const { value, symbol } of romanNumeralMap) {
        while (num >= value) {
            result += symbol;
            num -= value;
        }
    }
    return result;
}

