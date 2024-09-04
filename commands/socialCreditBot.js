const { SlashCommandBuilder } = require("discord.js");
const { EmbedBuilder } = require("discord.js");
const profileModel = require("../models/profileSchema.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("socialbot")
        .setDescription("Shows the top worst citizens"),
    async execute(interaction, profileData) {
        await interaction.deferReply();

        const { id } = interaction.user;
        const { socialCreditScore } = profileData;

        let socialCreditEmbed = new EmbedBuilder()
            .setTitle("**Top 10 worst citizens**")
            .setColor(0x8ACE00)
            .setFooter({ text: "You are not ranked yet"});

        const members = await profileModel
            .find()
            .sort({socialCreditScore: 1})
            .catch((err) => console.log(err));

        const memberIndex = members.findIndex(member => member.userId === id);

        socialCreditEmbed.setFooter({text: `You are rank #${memberIndex + 1} with a social credit score of ${socialCreditScore}`});

        const topTen = members.slice(0,10);

        let desc = '';
        for(let i = 0; i < topTen.length; i++) {
            let {user} = await interaction.guild.members.fetch(topTen[i].userId);
            if(!user) return;
            let userCreditScore = topTen[i].socialCreditScore;
            desc += `**${i + 1}.** ${user}: ${userCreditScore}\n`;
        }
        if(desc === ""){
            console.log("why is desc empty")
            return;
        }

        socialCreditEmbed.setDescription(desc);
        await interaction.editReply(
            {embeds: [socialCreditEmbed]}
        );
    }
};
