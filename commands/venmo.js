const { SlashCommandBuilder } = require("discord.js");
const profileModel = require("../models/profileSchema.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("venmo")
        .setDescription("Send leobux to another user")
        .addUserOption((option) =>
            option
                .setName("user")
                .setDescription("the user you want to donate to")
                .setRequired(true)
        )
        .addIntegerOption((option) =>
            option
                .setName("amount")
                .setDescription("the amount of leobux you want to send them")
                .setRequired(true)
                .setMinValue(1)
            ),
    async execute(interaction, profileData) {
        const recipient = interaction.options.getUser("user");
        const amount = interaction.options.getInteger("amount");

        //check to see if the sender has the amount available
        const { balance } = profileData;
        if(balance < amount) {
            await interaction.deferReply({ephemeral: true});
            return await interaction.editReply(`You do not have ${amount} balance`);
        }

        const receiveUserData = await profileModel.findOneAndUpdate(
            {
                userId: recipient.id,
            },
            {
                $inc: {
                    balance: amount
                },
            }
        );

        if(!receiveUserData){
            await interaction.deferReply({ephemeral: true});
            return await interaction.editReply(`${recipient.username} doesn't exist in the social credit score system yet, tell them to do /balance`);
        }

        await interaction.deferReply();

        await profileModel.findOneAndUpdate(
            {
                userId: interaction.user.id,
            },
            {
                $inc: {
                    balance: -amount,
                }
            }
        );

        interaction.editReply(`You have sent ${amount} balance to ${recipient.username}`);
    }        
};
