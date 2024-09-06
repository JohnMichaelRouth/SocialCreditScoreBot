const { Events, EmbedBuilder } = require('discord.js');
const profileModel = require('../models/profileSchema');
const globalValues = require('../globalValues.json');  // Load the constants

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isButton()) return;

        const client = interaction.client;
        const [action, row, col] = interaction.customId.split('_');
        if (action !== 'dig') return;

        const gameSession = client.gameSessions.get(interaction.user.id);
        if (!gameSession) {
            if (!interaction.replied) {
                return interaction.reply({ content: "This isn't your job, stinky. Start a new one using /work dirt.", ephemeral: true });
            } else {
                // Use followUp if interaction has already been acknowledged
                return interaction.followUp({ content: "This isn't your job, stinky. Start a new one using /work dirt.", ephemeral: true });
            }
        }

        if (interaction.user.id !== gameSession.userId) {
            if (!interaction.replied) {
                return interaction.reply({ content: "This isn't your job, stinky. Start a new one using /work dirt.", ephemeral: true });
            } else {
                // Use followUp if interaction has already been acknowledged
                return interaction.followUp({ content: "This isn't your job, stinky. Start a new one using /work dirt.", ephemeral: true });
            }
        }

        const { grid, worms, attemptsLeft, foundWorms } = gameSession;

        // Check if the user already dug this spot
        if (grid[row][col] !== '🟫') {
            return interaction.reply({ content: "You already dug this spot! Try another.", ephemeral: true });
        }

        // Decrease attempts and check if a worm is found
        let updatedAttempts = attemptsLeft - 1;
        let updatedFoundWorms = foundWorms;

        // Ensure the coordinates are numbers for proper comparison
        const rowInt = parseInt(row);
        const colInt = parseInt(col);

        if (worms.some(([wormRow, wormCol]) => wormRow === rowInt && wormCol === colInt)) {
            grid[row][col] = '🪱'; // Worm emoji if found
            updatedFoundWorms += 1;
        } else {
            grid[row][col] = '🕳'; // Hole emoji if no worm
        }

        // Update the game state
        gameSession.attemptsLeft = updatedAttempts;
        gameSession.foundWorms = updatedFoundWorms;

        // Create the updated grid display
        const gridDisplay = grid.map(row => row.join('')).join('\n');
        const embed = new EmbedBuilder()
            .setTitle("Dirt Digging Job")
            .setDescription("Keep digging!")
            .setColor(0x8B4513)
            .addFields({ name: 'Attempts Left', value: `${updatedAttempts}`, inline: true })
            .addFields({ name: 'Worms Found', value: `${updatedFoundWorms}/${globalValues.dirtWormCount}`, inline: true })
            .addFields({ name: 'Dirt Grid', value: gridDisplay });

        await interaction.update({ embeds: [embed], components: interaction.message.components });

        // Check if the game is over
        if (updatedAttempts === 0 || updatedFoundWorms === globalValues.dirtWormCount) {
            if (updatedFoundWorms === globalValues.dirtWormCount) {
                const leoBuxReward = Math.floor( Math.random() * (globalValues.dirtLeobuxRewardMax - globalValues.dirtLeobuxRewardMin + 1) + globalValues.dirtLeobuxRewardMin )
                embed.setDescription(`Congratulations! You found all the worms! You earned ${leoBuxReward} leobux.`);
                // Award leobux to the user
                try {
                    await profileModel.findOneAndUpdate(
                        { userId: interaction.user.id },
                        { $inc: { balance: leoBuxReward } }
                    );
                } catch (error) {
                    console.error("Error updating balance:", error);
                }
            } else {
                embed.setDescription("You're out of attempts! Better luck next time.");
            }

            await interaction.editReply({ embeds: [embed], components: [] });
            client.gameSessions.delete(interaction.user.id);
        }
    },
};
