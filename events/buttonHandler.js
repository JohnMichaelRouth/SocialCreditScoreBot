const { ActionRowBuilder, ButtonBuilder, EmbedBuilder, Events } = require("discord.js");
const profileModel = require("../models/profileSchema");
const Report = require("../models/reportSchema");

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isButton()) return;

        const role = interaction.guild.roles.cache.find(role => role.name === "authoritarian");

        if (!interaction.member.roles.cache.has(role.id)) {
            return interaction.reply({ content: "You do not have permission to perform this action.", ephemeral: true });
        }

        const [action, targetUserId, sourceUserId] = interaction.customId.split('_');

        console.log(`Action: ${action}, Target User ID: ${targetUserId}, Source User ID: ${sourceUserId}`);  // Debugging log

        if (!targetUserId) {
            console.error("Target User ID is missing.");
            return interaction.reply({ content: "An error occurred. Please try again later.", ephemeral: true });
        }

        try {
            let adjustment = 0;
            let actionTaken = "No action was taken.";
            let targetUser = targetUserId;

            if (action.startsWith("praise") || action === "disapprove" || action === "severe" || action === "warn" || action === "noaction") {
                // Handle actions affecting the target user's score
                if (action === "praise1") {
                    adjustment = 1;
                    actionTaken = "+1 social credit score";
                } else if (action === "praise5") {
                    adjustment = 5;
                    actionTaken = "+5 social credit score";
                } else if (action === "praise10") {
                    adjustment = 10;
                    actionTaken = "+10 social credit score";
                } else if (action === "disapprove") {
                    adjustment = -5;
                    actionTaken = "-5 social credit score";
                } else if (action === "severe") {
                    adjustment = -15;
                    actionTaken = "-15 social credit score";
                } else if (action === "warn") {
                    adjustment = -5;
                    actionTaken = "-5 social credit score";
                }
            } else if (action === "falsereport" || action === "falsecommend") {
                // Handle false reports or false commendations
                if (!sourceUserId) {
                    console.error("Source User ID is missing for false action.");
                    return interaction.reply({ content: "An error occurred. Please try again later.", ephemeral: true });
                }
                targetUser = sourceUserId;  // Decrease score of the user who made the report/commendation
                adjustment = -5;
                actionTaken = action === "falsereport"
                    ? "a punishment for a false report. -5 social credit score"
                    : "a punishment for a false commendation. -5 social credit score";
            }

            if (true) {
                const updatedProfile = await profileModel.findOneAndUpdate(
                    { userId: targetUser },
                    { $inc: { socialCreditScore: adjustment } },
                    { new: true }
                );

                // Disable the buttons after an action is taken
                const disabledButtons = interaction.message.components[0].components.map(button =>
                    ButtonBuilder.from(button).setDisabled(true)
                );

                const updatedRow = new ActionRowBuilder().addComponents(disabledButtons);

                await interaction.update({
                    components: [updatedRow]
                });

                // Send the outcome message
                const outcomeEmbed = new EmbedBuilder()
                    .setTitle("Action Outcome")
                    .setColor(action.includes("false") ? 0xff0000 : 0x00ff00) // Red for false reports/commendations, green for others
                    .setDescription(`<@${targetUser}> has received ${actionTaken}. Their current social credit score is ${updatedProfile.socialCreditScore}.`)
                    .setTimestamp();

                await interaction.followUp({ embeds: [outcomeEmbed], ephemeral: false });
            } else {
                await interaction.update({
                    content: "No changes were made to the social credit score.",
                    components: [],
                    ephemeral: true
                });
            }

        } catch (error) {
            console.error("Error handling the button interaction:", error);
            if (!interaction.replied) {
                await interaction.reply({ content: "An error occurred while processing the action. Please try again later.", ephemeral: true });
            }
        }
    },
};
