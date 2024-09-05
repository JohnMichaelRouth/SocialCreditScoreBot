const { ActionRowBuilder, ButtonBuilder, EmbedBuilder, Events } = require('discord.js');
const profileModel = require('../models/profileSchema'); // Assuming profile schema is used for player balances

// Dice emojis for rolling effect
const diceEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣'];

// Function to roll a die (return a random number between 1 and 6)
function rollDie() {
    return Math.floor(Math.random() * 6) + 1;
}

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isButton()) return;

        const [action, challengerId, opponentId, betAmount] = interaction.customId.split('_');

        if (interaction.user.id !== opponentId) {
            try {
                return await interaction.reply({ content: "Only the challenged player can accept the duel.", ephemeral: true });
            } catch (error) {
                console.error("Error handling the button interaction:", error);
                if (error.code === 10062) {
                    console.log("Interaction has expired.");
                }
                return;
            }
        }

        if (action === 'decline') {
            return interaction.update({ content: `The dice duel was declined by ${interaction.user}.`, components: [] });
        }

        if (action === 'accept') {
            try {
                // Recheck balances for both players
                const challengerProfile = await profileModel.findOne({ userId: challengerId });
                const opponentProfile = await profileModel.findOne({ userId: opponentId });

                const challengerBalance = challengerProfile.balance;
                const opponentBalance = opponentProfile.balance;
                const bet = parseInt(betAmount, 10);

                if (challengerBalance < bet || opponentBalance < bet) {
                    return interaction.update({ content: `One of the players no longer has enough leobux to duel. Duel canceled.`, components: [] });
                }

                // Start rolling animation
                const duelEmbed = new EmbedBuilder()
                    .setTitle("🎲 Dice Duel 🎲")
                    .setDescription(`${interaction.guild.members.cache.get(challengerId).displayName} and ${interaction.guild.members.cache.get(opponentId).displayName} are rolling the dice...`)
                    .setColor(0xffd700)
                    .addFields(
                        { name: `${interaction.guild.members.cache.get(challengerId).displayName}`, value: "Rolling... 🎲" },
                        { name: `${interaction.guild.members.cache.get(opponentId).displayName}`, value: "Rolling... 🎲" }
                    );

                await interaction.update({ embeds: [duelEmbed], components: [] });

                // Simulate a rolling animation by updating the embed 3 times
                for (let i = 0; i < 10; i++) {
                    await new Promise(resolve => setTimeout(resolve, 100));

                    duelEmbed.data.fields = [
                        { name: `${interaction.guild.members.cache.get(challengerId).displayName}`, value: `Rolling... ${diceEmojis[Math.floor(Math.random() * 6)]} ${diceEmojis[Math.floor(Math.random() * 6)]} ${diceEmojis[Math.floor(Math.random() * 6)]}` },
                        { name: `${interaction.guild.members.cache.get(opponentId).displayName}`, value: `Rolling... ${diceEmojis[Math.floor(Math.random() * 6)]} ${diceEmojis[Math.floor(Math.random() * 6)]} ${diceEmojis[Math.floor(Math.random() * 6)]}` }
                    ];

                    await interaction.editReply({ embeds: [duelEmbed] });
                }

                // Final dice rolls
                const c1 = rollDie();
                const c2 = rollDie();
                const c3 = rollDie();
                const o1 = rollDie();
                const o2 = rollDie();
                const o3 = rollDie();
                const challengerRolls = [c1, c2, c3];
                const challengerEmojiRolls = [diceEmojis[c1-1], diceEmojis[c2-1], diceEmojis[c3-1]];
                const opponentRolls = [o1, o2, o3];
                const opponentEmojiRolls = [diceEmojis[o1-1], diceEmojis[o2-1], diceEmojis[o3-1]];

                const challengerTotal = challengerRolls.reduce((a, b) => a + b, 0);
                const opponentTotal = opponentRolls.reduce((a, b) => a + b, 0);

                // Determine the winner and payout
                let resultMessage = '';

                if (challengerTotal > opponentTotal) {
                    await profileModel.findOneAndUpdate(
                        { userId: challengerId },
                        { $inc: { balance: bet } }
                    );
                    await profileModel.findOneAndUpdate(
                        { userId: opponentId },
                        { $inc: { balance: -bet } }
                    );
                    resultMessage = `<@${challengerId}> wins the duel and gains ${bet} leobux!`;
                } else if (challengerTotal < opponentTotal) {
                    await profileModel.findOneAndUpdate(
                        { userId: challengerId },
                        { $inc: { balance: -bet } }
                    );
                    await profileModel.findOneAndUpdate(
                        { userId: opponentId },
                        { $inc: { balance: bet } }
                    );
                    resultMessage = `<@${opponentId}> wins the duel and gains ${bet} leobux!`;
                } else {
                    await profileModel.findOneAndUpdate(
                        { userId: challengerId },
                        { $inc: { balance: Math.floor(-bet / 2) } }
                    );
                    await profileModel.findOneAndUpdate(
                        { userId: opponentId },
                        { $inc: { balance: Math.floor(-bet / 2) } }
                    );
                    resultMessage = `It's a draw! Both players get half of their leobux back.`;
                }

                // Final duel result
                duelEmbed
                    .setDescription(resultMessage)
                    .setFields(
                        { name: `${interaction.guild.members.cache.get(challengerId).displayName}'s Rolls`, value: `(Total: ${challengerTotal}) ${challengerEmojiRolls.join(' ')}` },
                        { name: `${interaction.guild.members.cache.get(opponentId).displayName}'s Rolls`, value: `(Total: ${opponentTotal}) ${opponentEmojiRolls.join(' ')}` }
                    );

                await interaction.editReply({ embeds: [duelEmbed] });

            } catch (error) {
                console.error("Error handling the button interaction:", error);
                if (error.code === 10062) {
                    console.log("Interaction has expired.");
                }
            }
        }
    },
};
