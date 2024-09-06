const { Events } = require('discord.js');

module.exports = {
    name: Events.MessageReactionAdd,
    async execute(reaction, user) {
        // Ignore bot reactions
        if (user.bot) return;

        // Handle partial reactions (fetch them if necessary)
        if (reaction.partial) {
            try {
                await reaction.fetch();
            } catch (error) {
                console.error('Something went wrong when fetching the reaction:', error);
                return;
            }
        }

        // Handle partial messages (fetch them if necessary)
        if (reaction.message.partial) {
            try {
                await reaction.message.fetch();
            } catch (error) {
                console.error('Something went wrong when fetching the message:', error);
                return;
            }
        }

        // Check if the emoji is the 📌 pushpin
        if (reaction.emoji.name === '📌') {
            try {
                // Fetch all users who reacted with the 📌 emoji
                const pushpinReactions = await reaction.message.reactions.resolve('📌').users.fetch();

                // Check if there are 5 or more unique users (excluding bots)
                const nonBotReactions = pushpinReactions.filter(u => !u.bot);

                if (nonBotReactions.size >= 5) {
                    // Pin the message if it has not already been pinned
                    if (!reaction.message.pinned) {
                        await reaction.message.pin();
                        console.log(`Message pinned: ${reaction.message.content}`);
                    }
                }
            } catch (error) {
                console.error('Error pinning the message:', error);
            }
        }
    },
};
