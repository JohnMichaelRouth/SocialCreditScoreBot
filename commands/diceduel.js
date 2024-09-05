const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const profileModel = require('../models/profileSchema'); // Assuming profile schema is used for player balances

module.exports = {
    data: new SlashCommandBuilder()
        .setName('diceduel')
        .setDescription('Challenge another player to a dice duel.')
        .addUserOption(option =>
            option.setName('opponent')
                .setDescription('The player you want to challenge')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('The amount of leobux to bet')
                .setRequired(true)
                .setMinValue(1)),


    async execute(interaction) {
        const challenger = interaction.user;
        const opponent = interaction.options.getUser('opponent');
        const betAmount = interaction.options.getInteger('amount');

        if (challenger.id === opponent.id) {
            return interaction.reply({ content: "You cannot duel yourself!", ephemeral: true });
        }

        // Fetch both players' profiles from the database
        const challengerProfile = await profileModel.findOne({ userId: challenger.id });
        const opponentProfile = await profileModel.findOne({ userId: opponent.id });

        if (!challengerProfile || !opponentProfile) {
            return interaction.reply({ content: "One or both players do not have a profile.", ephemeral: true });
        }

        // Ensure both players have enough balance
        const challengerBalance = challengerProfile.balance;
        const opponentBalance = opponentProfile.balance;
        const maxBet = Math.min(challengerBalance, opponentBalance);

        if (betAmount > maxBet) {
            return interaction.reply({ content: `The bet amount cannot be higher than ${maxBet} due to the players' balances.`, ephemeral: true });
        }

        // Create the embed message for the duel
        const duelEmbed = new EmbedBuilder()
            .setTitle("Dice Duel Challenge")
            .setDescription(`${challenger} has challenged ${opponent} to a dice duel for ${betAmount} leobux!`)
            .setColor(0xffd700);

        // Create the action row with accept and decline buttons
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`accept_${challenger.id}_${opponent.id}_${betAmount}`)
                    .setLabel('Accept')
                    .setStyle('Success'),
                new ButtonBuilder()
                    .setCustomId(`decline_${challenger.id}_${opponent.id}`)
                    .setLabel('Decline')
                    .setStyle('Danger')
            );

        // Send the duel embed with the buttons
        await interaction.reply({ embeds: [duelEmbed], components: [row] });
    },
};
