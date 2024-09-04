const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const profileModel = require("../models/profileSchema");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("viewroles")
        .setDescription("View all roles and their ranks for a user")
        .addUserOption(option =>
            option.setName("user")
                .setDescription("The user whose roles you want to view")
                .setRequired(true)),

    async execute(interaction) {
        const user = interaction.options.getUser("user");
        const userId = user.id;
        const nickname = user.globalName || user.username;

        try {
            const profileData = await profileModel.findOne({ userId: userId, serverId: interaction.guild.id });

            if (!profileData || profileData.roles.length === 0) {
                return interaction.reply(`<@${userId}> has no roles.`);
            }

            const embed = new EmbedBuilder()
                .setTitle(`Roles for ${nickname}`)
                .setColor(0x00FF00);

            profileData.roles.forEach(role => {
                const romanRank = convertToRoman(role.rank);
                embed.addFields({ name: role.name, value: `Rank: ${romanRank}`, inline: true });
            });

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error("Error retrieving roles:", error);
            await interaction.reply("There was an error retrieving the roles. Please try again later.");
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

