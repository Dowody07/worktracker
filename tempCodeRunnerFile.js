require('dotenv').config();
const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);
const userSessions = {}; // Store work start times

bot.start((ctx) => ctx.reply('Welcome! Use /workstart to begin and /workend to stop tracking.'));

bot.command('workstart', (ctx) => {
    const userId = ctx.from.id;
    if (userSessions[userId]) {
        return ctx.reply('You already started working! Use /workend to stop.');
    }
    userSessions[userId] = Date.now(); 
    ctx.reply('Work session started! Use /workend to stop.');
});

bot.command('workend', (ctx) => {
    const userId = ctx.from.id;
    if (!userSessions[userId]) {
        return ctx.reply('You need to start working first using /workstart.');
    }
    const startTime = userSessions[userId];
    const elapsedTime = (Date.now() - startTime) / 1000; // Seconds
    delete userSessions[userId];
    
    const hours = Math.floor(elapsedTime / 3600);
    const minutes = Math.floor((elapsedTime % 3600) / 60);
    const seconds = Math.floor(elapsedTime % 60);

    ctx.reply(`Work session ended! Duration: ${hours}h ${minutes}m ${seconds}s.`);
});

bot.launch();
console.log('Bot is running...');