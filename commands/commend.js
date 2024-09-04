const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const profileModel = require("../models/profileSchema");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("commend")
        .setDescription("Commend a user for positive actions.")
        .addUserOption(option =>
            option.setName("user")
                .setDescription("The user you want to commend")
                .setRequired(true))
        .addStringOption(option =>
            option.setName("reason")
                .setDescription("Reason for commending the user")
                .setRequired(true))
        .addStringOption(option =>
            option.setName("description")
                .setDescription("Detailed description of the positive action")
                .setRequired(true))
        .addStringOption(option =>
            option.setName("proof")
                .setDescription("Link to proof (optional)")
                .setRequired(false)),


    async execute(interaction) {
        const commendingUser = interaction.user.id;
        const commendedUser = interaction.options.getUser("user").id;
        const reason = interaction.options.getString("reason");
        const description = interaction.options.getString("description");
        const proofAttachment = interaction.options.getString("proof") || "No proof provided";

        try {
            // Ensure the commended user is in the database
            let commendedProfile = await profileModel.findOne({ userId: commendedUser });
            if (!commendedProfile) {
                commendedProfile = await profileModel.create({
                    userId: commendedUser,
                    serverId: interaction.guild.id,
                });
            }

            await interaction.reply({
                content: `Your commendation for <@${commendedUser}> has been submitted successfully.`
            });

            const embed = new EmbedBuilder()
                .setTitle("New Commendation Filed")
                .setColor(0x00ff00) // Green color for commendation
                .addFields(
                    { name: "Commended User", value: `<@${commendedUser}>`, inline: true },
                    { name: "Reason", value: reason, inline: true },
                    { name: "Description", value: description },
                    { name: "Proof", value: proofAttachment },
                    { name: "Commended By", value: `<@${commendingUser}>` }
                )
                .setTimestamp();

            try {
                embed.setImage(proofAttachment);
            } catch (error) {

            }

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`disapprove_${commendedUser}_${commendingUser}`)
                        .setLabel('Disapprove (-5)')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId(`praise1_${commendedUser}_${commendingUser}`)
                        .setLabel('Praise (+1)')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`praise5_${commendedUser}_${commendingUser}`)
                        .setLabel('Praise (+5)')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`praise10_${commendedUser}_${commendingUser}`)
                        .setLabel('Praise (+10)')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`falsecommend_${commendedUser}_${commendingUser}`)
                        .setLabel('False Commendation (-5)')
                        .setStyle(ButtonStyle.Danger)
                );

            const commendationsChannel = interaction.guild.channels.cache.find(channel => channel.name === 'social-credit-claims');
            if (commendationsChannel) {
                await commendationsChannel.send({ embeds: [embed], components: [row] });
            } else {
                console.error("Channel 'social-credit-claims' not found.");
            }
        } catch (error) {
            console.error("Error saving the commendation:", error);
            await interaction.reply({ content: "There was an error submitting your commendation. Please try again later.", ephemeral: true });
        }
    },
};
