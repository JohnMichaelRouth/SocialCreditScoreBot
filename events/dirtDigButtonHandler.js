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
                return interaction.followUp({ content: "This isn't your job, stinky. Start a new one using /work dirt.", ephemeral: true });
            }
        }

        if (interaction.user.id !== gameSession.userId) {
            if (!interaction.replied) {
                return interaction.reply({ content: "This isn't your job, stinky. Start a new one using /work dirt.", ephemeral: true });
            } else {
                return interaction.followUp({ content: "This isn't your job, stinky. Start a new one using /work dirt.", ephemeral: true });
            }
        }

        const { grid, worms, attemptsLeft, foundWorms } = gameSession;

        // Defer the reply immediately to ensure it's handled
        await interaction.deferUpdate();

        // Check if the user already dug this spot
        if (grid[row][col] !== '🟫') {
            return interaction.followUp({ content: "You already dug this spot! Try another.", ephemeral: true });
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

            // Update the user's worm stat
            try {
                await profileModel.findOneAndUpdate(
                    { userId: interaction.user.id },
                    { $inc: { "stats.wormsFound": 1 } }
                );
            } catch (error) {
                console.error("Error updating wormsFound stat:", error);
            }
        } else {
            grid[row][col] = '🕳'; // Hole emoji if no worm
        }

        // Update the game state
        gameSession.attemptsLeft = updatedAttempts;
        gameSession.foundWorms = updatedFoundWorms;

        // Create the updated grid display
        const gridDisplay = grid.map(row => row.join('')).join('\n');
        let embed = new EmbedBuilder()
            .setTitle("Dirt Digging Job")
            .setDescription("Keep digging!")
            .setColor(0x8B4513)
            .addFields({ name: 'Attempts Left', value: `${updatedAttempts}`, inline: true })
            .addFields({ name: 'Worms Found', value: `${updatedFoundWorms}/${globalValues.dirtWormCount}`, inline: true })
            .addFields({ name: 'Dirt Grid', value: gridDisplay });

        // Check if the game is over
        if (updatedAttempts === 0 || updatedFoundWorms === globalValues.dirtWormCount) {
            let finalMessage = "";  // To hold the message about worms in their pocket

            if (updatedFoundWorms === globalValues.dirtWormCount) {
                // Player found all worms, reward them
                const leoBuxReward = Math.floor( Math.random() * (globalValues.dirtLeobuxRewardMax - globalValues.dirtLeobuxRewardMin + 1) + globalValues.dirtLeobuxRewardMin );
                finalMessage = `Congratulations! You found all the worms and stuffed them in your pocket! You earned ${leoBuxReward} leobux.`;

                // Award leobux to the user and track money earned
                try {
                    await profileModel.findOneAndUpdate(
                        { userId: interaction.user.id },
                        {
                            $inc: { balance: leoBuxReward, "stats.moneyEarnedFromJobs": leoBuxReward }  // Track money earned from jobs
                        }
                    );
                } catch (error) {
                    console.error("Error updating balance and stats:", error);
                }
            } else {
                // Player ran out of attempts, reveal the remaining worms
                worms.forEach(([wormRow, wormCol]) => {
                    if (grid[wormRow][wormCol] === '🟫') {
                        grid[wormRow][wormCol] = '❌'; // Mark unfound worms with an X
                    }
                });

                finalMessage = `You're out of attempts! You stuffed the worm in your pocket. Better luck next time!`;
            }

            const finalGridDisplay = grid.map(row => row.join('')).join('\n');
            embed = new EmbedBuilder()  // Create a new embed to avoid showing two grids
                .setTitle("Dirt Digging Job - Game Over")
                .setColor(0x8B4513)
                .setDescription(finalMessage)
                .addFields({ name: 'Final Grid', value: finalGridDisplay });

            // Update the final state and remove buttons
            await interaction.editReply({ embeds: [embed], components: [] });
            client.gameSessions.delete(interaction.user.id);
        } else {
            // Update the ongoing game state
            await interaction.editReply({ embeds: [embed], components: interaction.message.components });
        }
    },
};
