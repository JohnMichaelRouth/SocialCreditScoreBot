const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const profileModel = require('../models/profileSchema');
const globalValues = require('../globalValues.json');  // Load the constants

// Initialize a map to track cooldowns
const cooldowns = new Map();

// Helper function to generate a random grid with worms hidden
function generateGrid() {
    const grid = Array(globalValues.dirtRows).fill().map(() => Array(globalValues.dirtColumns).fill('🟫'));
    const worms = [];
    const wormAmount = Math.floor(Math.random() * globalValues.dirtRandomWorms + globalValues.dirtWormCount);

    // Randomly place worms
    while (worms.length < wormAmount) {
        const randomRow = Math.floor(Math.random() * globalValues.dirtRows);
        const randomCol = Math.floor(Math.random() * globalValues.dirtColumns);
        if (!worms.some(([row, col]) => row === randomRow && col === randomCol)) {
            worms.push([randomRow, randomCol]);
        }
    }

    return { grid, worms };
}

// Function to create the button grid for the player to interact with
function createButtonGrid() {
    const rows = [];
    for (let i = 0; i < globalValues.dirtRows; i++) {
        const row = new ActionRowBuilder();
        for (let j = 0; j < globalValues.dirtColumns; j++) {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`dig_${i}_${j}`)
                    .setLabel(`${i + 1},${j + 1}`)
                    .setStyle(ButtonStyle.Secondary)
            );
        }
        rows.push(row);
    }
    return rows;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('work')
        .setDescription('Start a job game!')
        .addStringOption(option => option.setName('job').setDescription('The job to work').setRequired(true).addChoices(
            { name: 'Dirt', value: 'dirt' },
        )),

    async execute(interaction, profileData) {
        const job = interaction.options.getString('job');
        const client = interaction.client;
        const cooldownTime = 30000;  // 30 seconds cooldown

        const now = Date.now();
        const userCooldown = cooldowns.get(interaction.user.id);

        if (userCooldown && now < userCooldown + cooldownTime) {
            const timeLeft = Math.ceil((userCooldown + cooldownTime - now) / 1000);
            return interaction.reply({ content: `Please wait ${timeLeft} more seconds before using /work again.`, ephemeral: true });
        }

        // If no cooldown, set it
        cooldowns.set(interaction.user.id, now);

        if (job === 'dirt') {
            const { grid, worms } = generateGrid();
            const attempts = globalValues.dirtWorkAttempts;
            const foundWorms = 0;

            const workEmbed = new EmbedBuilder()
                .setTitle("Dirt Digging Job")
                .setDescription(`Find the ${globalValues.dirtWormCount} worms hidden in the dirt! You have ${globalValues.dirtWorkAttempts} durability left on your shovel.`)
                .setColor(0x8B4513)
                .addFields({ name: 'Attempts Left', value: `${attempts}`, inline: true })
                .addFields({ name: 'Worms Found', value: `${foundWorms}/${globalValues.dirtWormCount}`, inline: true })
                .addFields({ name: 'Dirt Grid', value: '🟫🟫🟫🟫🟫\n🟫🟫🟫🟫🟫\n🟫🟫🟫🟫🟫' });

            await interaction.reply({ embeds: [workEmbed], components: createButtonGrid() });

            // Save game state to the user session
            client.gameSessions.set(interaction.user.id, {
                attemptsLeft: attempts,
                grid,
                worms,
                foundWorms,
                interactionId: interaction.id,
                userId: interaction.user.id
            });
        }
    },
};
