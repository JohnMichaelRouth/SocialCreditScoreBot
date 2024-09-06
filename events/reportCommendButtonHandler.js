const { ActionRowBuilder, ButtonBuilder, EmbedBuilder, Events } = require("discord.js");
const profileModel = require("../models/profileSchema");
const Report = require("../models/reportSchema");

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isButton()) return;

        // Extract action, the reported/commended user ID, and the reporting/commending user ID
        const [action, targetUserId, sourceUserId] = interaction.customId.split('_');

        const role = interaction.guild.roles.cache.find(role => role.name === "authoritarian");

        if(!(action.startsWith("praise") || action === "warn" || action === "punish" || action === "noaction" || action === "disapprove" || action === "falsecommend" || action === "falsereport" || action === "noaction")){
            return;
        }

        if (!interaction.member.roles.cache.has(role.id)) {
            return interaction.reply({ content: "You do not have permission to perform this action.", ephemeral: true });
        }

        try {
            let adjustment = 0;
            let actionTaken = "No action was taken.";
            let targetUser = targetUserId;

            // Handle praise, warn, severe, and no action
            if (action.startsWith("praise") || action === "warn" || action === "punish" || action === "noaction" || action === "disapprove") {
                if (action === "praise1") {
                    adjustment = 1;
                    actionTaken = "praised and receives +1 social credit score";
                } else if (action === "praise5") {
                    adjustment = 5;
                    actionTaken = "praised and receives +5 social credit score";
                } else if (action === "praise10") {
                    adjustment = 10;
                    actionTaken = "praised and receives +10 social credit score";
                } else if (action === "warn") {
                    adjustment = -5;
                    actionTaken = "warned and receives -5 social credit score";
                } else if (action === "punish") {
                    adjustment = -15;
                    actionTaken = "punished and receives -15 social credit score";
                } else if (action === "noaction") {
                    actionTaken = "excused with no action against them";
                } else if (action === "disapprove") {
                    actionTaken = "warned for this commendation and receives -5 social credit score. This shouldn't be commended";
                }

                // Apply the adjustment to the target user (reported or commended user) if needed
                if (adjustment !== 0) {
                    await profileModel.findOneAndUpdate(
                        { userId: targetUser },
                        { $inc: { socialCreditScore: adjustment } }
                    );
                }

                // If action is not "noaction", reward the original reporting/commending user with 2 social credit points
                if (action !== "noaction") {
                    await profileModel.findOneAndUpdate(
                        { userId: sourceUserId },
                        { $inc: { socialCreditScore: 2 } }
                    );
                }

                // Fetch the updated profile data for both the target user and the source user
                const updatedTargetProfile = await profileModel.findOne({ userId: targetUser });
                const updatedSourceProfile = await profileModel.findOne({ userId: sourceUserId });

                // Disable the buttons after an action is taken
                const disabledButtons = interaction.message.components[0].components.map(button =>
                    ButtonBuilder.from(button).setDisabled(true)
                );
                const updatedRow = new ActionRowBuilder().addComponents(disabledButtons);

                await interaction.update({
                    components: [updatedRow]
                });

                // Send a separate embed with the outcome
                const outcomeEmbed = new EmbedBuilder()
                    .setTitle("Action Outcome")
                    .setColor(action.includes("false") ? 0xff0000 : 0x00ff00) // Red for false reports/commendations, green for others
                    .setDescription(
                        action === "noaction" ?
                            `No action was taken against <@${targetUser}>.` :
                            `<@${targetUser}> has been ${actionTaken}. Their current social credit score is ${updatedTargetProfile.socialCreditScore}.\n
                             <@${sourceUserId}> has been awarded 2 social credit points! Their new social credit score is ${updatedSourceProfile.socialCreditScore}.`
                    )
                    .setTimestamp();

                return await interaction.followUp({ embeds: [outcomeEmbed], ephemeral: false });
            }

            // Handle false report/commendation
            if (action === "falsecommend" || action === "falsereport") {
                targetUser = sourceUserId;  // Punish the source user (commending/reporting user) for false action
                adjustment = -5;
                actionTaken = action === "falsereport" ? "report" : "commendation";

                await profileModel.findOneAndUpdate(
                    { userId: targetUser },
                    { $inc: { socialCreditScore: adjustment } }
                );

                // Fetch the updated profile data for the source user
                const updatedSourceProfile = await profileModel.findOne({ userId: sourceUserId });

                // Disable the buttons after an action is taken
                const disabledButtons = interaction.message.components[0].components.map(button =>
                    ButtonBuilder.from(button).setDisabled(true)
                );
                const updatedRow = new ActionRowBuilder().addComponents(disabledButtons);

                await interaction.update({
                    components: [updatedRow]
                });

                const outcomeEmbed = new EmbedBuilder()
                    .setTitle("False Action Outcome")
                    .setColor(0xff0000)
                    .setDescription(`<@${sourceUserId}> has been penalized for a false ${actionTaken}. Their current social credit score is ${updatedSourceProfile.socialCreditScore}.`)
                    .setTimestamp();

                return await interaction.followUp({ embeds: [outcomeEmbed], ephemeral: false });
            }

        } catch (error) {
            console.error("Error handling the button interaction:", error);
            await interaction.reply({ content: "An error occurred while processing the action. Please try again later.", ephemeral: true });
        }
    },
};
