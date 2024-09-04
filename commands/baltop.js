const { SlashCommandBuilder } = require("discord.js");
const { EmbedBuilder } = require("discord.js");
const profileModel = require("../models/profileSchema.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("baltop")
        .setDescription("Shows the top ten users with most balance"),
    async execute(interaction, profileData) {
        await interaction.deferReply();

        const { username, id } = interaction.user;
        const { balance } = profileData;

        let baltopEmbed = new EmbedBuilder()
            .setTitle("**Top 10 wealthiest citizens**")
            .setColor(0x8ACE00)
            .setFooter({ text: "You are not ranked yet"});

        const members = await profileModel
            .find()
            .sort({balance: -1})
            .catch((err) => console.log(err));

        const memberIndex = members.findIndex(member => member.userId === id);

        baltopEmbed.setFooter({text: `You are rank #${memberIndex + 1} with a balance of ${balance}`});

        const topTen = members.slice(0,10);

        let desc = '';
        for(let i = 0; i < topTen.length; i++) {
            let {user} = await interaction.guild.members.fetch(topTen[i].userId);
            if(!user) return;
            let userBalance = topTen[i].balance;
            desc += `**${i + 1}. ${user}:** ${userBalance}\n`;
        }
        if(desc === ""){
            console.log("why is desc empty")
            return;
        }

        baltopEmbed.setDescription(desc);
        await interaction.editReply(
            {embeds: [baltopEmbed]}
        );
    }
};
