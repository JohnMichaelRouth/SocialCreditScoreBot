const { SlashCommandBuilder } = require("discord.js");
const parseMilliseconds = require("parse-ms-2");
const profileModel = require("../models/profileSchema");
const { dailyMin, dailyMax } = require("../globalValues.json");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("daily")
        .setDescription("Redeem free social credits for your income"),
    async execute(interaction, profileData) {
        const { dailyLastUsed, socialCreditScore } = profileData;

        const cooldown = 86400000; // 24 hours
        const timeLeft = cooldown - (Date.now() - dailyLastUsed);

        if (timeLeft > 0) {
            await interaction.deferReply({ ephemeral: true });
            const { hours, minutes, seconds } = parseMilliseconds(timeLeft);
            await interaction.editReply(`Claim your next daily in ${hours} hrs ${minutes} minutes ${seconds} sec`);
            return;
        }

        await interaction.deferReply();

        // Adjust the daily reward based on social credit score
        const scoreMultiplier = (socialCreditScore / 500) * 1.25; // Default score is 500, so multiplier is 1 when score is 500
        const randomAmt = Math.floor(
            (Math.random() * (dailyMax - dailyMin + 1) + dailyMin) * scoreMultiplier
        );

        // Increment social credit score by a random value between 1 and 3
        const creditScoreIncrement = Math.floor(Math.random() * 3) + 1;

        try {
            await profileModel.findOneAndUpdate(
                { userId: interaction.user.id },
                {
                    $set: { dailyLastUsed: Date.now() },
                    $inc: {
                        balance: randomAmt,
                        socialCreditScore: creditScoreIncrement
                    },
                }
            );
        } catch (error) {
            console.log(error);
            await interaction.editReply("An error occurred while processing your daily reward.");
            return;
        }

        await interaction.editReply(`You redeemed ${randomAmt} social credits and your social credit score increased by ${creditScoreIncrement} points!`);
    }
};
