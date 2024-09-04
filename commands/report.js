const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const profileModel = require("../models/profileSchema");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("report")
        .setDescription("Report a user for misconduct.")
        .addUserOption(option =>
            option.setName("user")
                .setDescription("The user you want to report")
                .setRequired(true))
        .addStringOption(option =>
            option.setName("reason")
                .setDescription("Reason for reporting the user")
                .setRequired(true))
        .addStringOption(option =>
            option.setName("description")
                .setDescription("Detailed description of the incident")
                .setRequired(true))
        .addStringOption(option =>
            option.setName("proof")
                .setDescription("Link to proof (optional)")
                .setRequired(false)),

    async execute(interaction) {
        const reportingUser = interaction.user.id;
        const reportedUser = interaction.options.getUser("user").id;
        const reason = interaction.options.getString("reason");
        const description = interaction.options.getString("description");
        const proofAttachment = interaction.options.getString("proof") || "No proof provided";

        try {
            // Ensure the reported user is in the database
            let reportedProfile = await profileModel.findOne({ userId: reportedUser });
            if (!reportedProfile) {
                reportedProfile = await profileModel.create({
                    userId: reportedUser,
                    serverId: interaction.guild.id,
                });
            }

            await interaction.reply({
                content: `Your report against <@${reportedUser}> has been submitted successfully.`
            });

            const embed = new EmbedBuilder()
                .setTitle("New Report Filed")
                .setColor(0xff0000)
                .addFields(
                    { name: "Reported User", value: `<@${reportedUser}>`, inline: true },
                    { name: "Reason", value: reason, inline: true },
                    { name: "Description", value: description },
                    { name: "Proof", value: proofAttachment },
                    { name: "Reported By", value: `<@${reportingUser}>` }
                )
                .setTimestamp();

            try {
                embed.setImage(proofAttachment);
            } catch (error) {

            }

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId(`praise5_${reportedUser}_${reportingUser}`)
                        .setLabel('Praise (+5)')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`noaction_${reportedUser}_${reportingUser}`)
                        .setLabel('No Action')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId(`warn_${reportedUser}_${reportingUser}`)
                        .setLabel('Warn (-5)')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId(`severe_${reportedUser}_${reportingUser}`)
                        .setLabel('Severe (-15)')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId(`falsereport_${reportedUser}_${reportingUser}`)
                        .setLabel('False Report (-5)')
                        .setStyle(ButtonStyle.Danger)
                );

            const claimsChannel = interaction.guild.channels.cache.find(channel => channel.name === 'social-credit-claims');
            if (claimsChannel) {
                await claimsChannel.send({ embeds: [embed], components: [row] });
            } else {
                console.error("Channel 'social-credit-claims' not found.");
            }
        } catch (error) {
            console.error("Error saving the report:", error);
            await interaction.reply({ content: "There was an error submitting your report. Please try again later.", ephemeral: true });
        }
    },
};
