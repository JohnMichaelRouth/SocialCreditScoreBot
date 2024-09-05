const { ActionRowBuilder, ButtonBuilder, EmbedBuilder, Events } = require('discord.js');
const profileModel = require('../models/profileSchema'); // Assuming profile schema is used for player balances

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isButton()) return;

        // Extract action, the reported/commended user ID, and the reporting/commending user ID
        const [action, targetUserId, sourceUserId] = interaction.customId.split('_');

        const role = interaction.guild.roles.cache.find(role => role.name === "authoritarian");

        if((action === 'accept' || action === 'decline'))
        {
            return;
        }

        if (!interaction.member.roles.cache.has(role.id)) {
            return interaction.reply({ content: "You do not have permission to perform this action.", ephemeral: true });
        }

        try {
            let adjustment = 0;
            let actionTaken = "No action was taken.";
            let targetUser = targetUserId;

            // Handle praise, warn, and severe actions
            if (action.startsWith("praise") || action === "warn" || action === "severe") {
                if (action === "praise1") {
                    adjustment = 1;
                    actionTaken = "+1 social credit score";
                } else if (action === "praise5") {
                    adjustment = 5;
                    actionTaken = "+5 social credit score";
                } else if (action === "praise10") {
                    adjustment = 10;
                    actionTaken = "+10 social credit score";
                } else if (action === "warn") {
                    adjustment = -5;
                    actionTaken = "-5 social credit score";
                } else if (action === "severe") {
                    adjustment = -15;
                    actionTaken = "-15 social credit score";
                }

                // Apply the adjustment to the target user (reported or commended user)
                if (adjustment !== 0) {
                    await profileModel.findOneAndUpdate(
                        { userId: targetUser },
                        { $inc: { socialCreditScore: adjustment } }
                    );
                }

                // Reward the original reporting/commending user with 2 social credit points
                await profileModel.findOneAndUpdate(
                    { userId: sourceUserId },
                    { $inc: { socialCreditScore: 2 } }
                );

                // Fetch the updated profile data for both the target user and the source user
                const updatedTargetProfile = await profileModel.findOne({ userId: targetUser });
                const updatedSourceProfile = await profileModel.findOne({ userId: sourceUserId });

                // Send the outcome message
                const outcomeEmbed = new EmbedBuilder()
                    .setTitle("Action Outcome")
                    .setColor(action.includes("false") ? 0xff0000 : 0x00ff00) // Red for false reports/commendations, green for others
                    .setDescription(`<@${targetUser}> has received ${actionTaken}. Their current social credit score is ${updatedTargetProfile.socialCreditScore}. <@${sourceUserId}> has been awarded 2 social credit score! Their new social credit score is ${updatedSourceProfile.socialCreditScore}.`)
                    .setTimestamp();

                await interaction.update({ embeds: [outcomeEmbed], components: [] });
            }

            // Handle false report/commendation
            if (action === "falsecommend" || action === "falsereport") {
                targetUser = sourceUserId;  // Punish the source user (commending/reporting user) for false action
                adjustment = -5;
                actionTaken = "False action was marked. -5 social credit score.";

                await profileModel.findOneAndUpdate(
                    { userId: targetUser },
                    { $inc: { socialCreditScore: adjustment } }
                );

                // Fetch the updated profile data for the source user
                const updatedSourceProfile = await profileModel.findOne({ userId: sourceUserId });

                const outcomeEmbed = new EmbedBuilder()
                    .setTitle("False Action Outcome")
                    .setColor(0xff0000)
                    .setDescription(`<@${sourceUserId}> has been penalized for a false report/commendation. Their current social credit score is ${updatedSourceProfile.socialCreditScore}.`)
                    .setTimestamp();

                await interaction.update({ embeds: [outcomeEmbed], components: [] });
            }

        } catch (error) {
            console.error("Error handling the button interaction:", error);
            await interaction.reply({ content: "An error occurred while processing the action. Please try again later.", ephemeral: true });
        }
    },
};
