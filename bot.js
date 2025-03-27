require('dotenv').config();
const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);
const userSessions = {}; // Store work start times and session info
const userHourlyRates = {}; // Store hourly rate
const userEarnings = {}; // Store total earnings
const userPauseTimes = {}; // Store pause start time
const userPausedDurations = {}; // Store total paused time

bot.start((ctx) => ctx.reply('👋 Welcome to the Work Tracker Bot! \n💼 Use /work <session name> <hourly rate> to start your work session. \n⏸️ Pause with /workpause, resume with /workresume, and stop with /workend.')); 

bot.command('work', (ctx) => {
    const userId = ctx.from.id;
    const args = ctx.message.text.split(' ');
    const sessionName = args[1];
    const hourlyRate = parseFloat(args[2]);

    if (!sessionName || isNaN(hourlyRate) || hourlyRate <= 0) {
        return ctx.reply('⚠️ Please provide a valid session name and hourly rate. Example: /work "Project A" 200');
    }

    if (userSessions[userId]) {
        return ctx.reply('🛑 You already started working! Use /workend to stop or /workpause to pause.');
    }

    userSessions[userId] = { startTime: Date.now(), sessionName, totalPausedTime: 0 };
    userHourlyRates[userId] = hourlyRate;

    ctx.reply(`✅ Work session '${sessionName}' started! \n💸 Hourly rate set to ${hourlyRate.toFixed(2)} MDL! \n⏰ I will notify you every hour! \nUse /workend to stop or /workpause to pause your session.`);
});

bot.command('workend', (ctx) => {
    const userId = ctx.from.id;
    if (!userSessions[userId]) return ctx.reply('⚠️ You need to start working first using /work.');

    const { startTime, sessionName, totalPausedTime } = userSessions[userId];
    const elapsedTime = (Date.now() - startTime - (userPausedDurations[userId] || 0)) / 1000;
    delete userSessions[userId];
    delete userPausedDurations[userId];
    delete userPauseTimes[userId];

    const hoursWorked = elapsedTime / 3600;
    const earnings = hoursWorked * userHourlyRates[userId];
    userEarnings[userId] = (userEarnings[userId] || 0) + earnings;

    const h = Math.floor(hoursWorked);
    const m = Math.floor((elapsedTime % 3600) / 60);
    const s = Math.floor(elapsedTime % 60);

    ctx.reply(`🛑 Work session '${sessionName}' ended! \n⏱️ Duration: ${h}h ${m}m ${s}s \n💰 You earned ${earnings.toFixed(2)} MDL \n🏆 Total earnings: ${userEarnings[userId].toFixed(2)} MDL`);
});

bot.command('workpause', (ctx) => {
    const userId = ctx.from.id;
    if (!userSessions[userId]) return ctx.reply('⚠️ You need to start working first using /work.');
    if (userPauseTimes[userId]) return ctx.reply('⏸️ Your work is already paused! Use /workresume to resume.');

    userPauseTimes[userId] = Date.now();
    ctx.reply('⏸️ Work session paused. Use /workresume to continue.');
});

bot.command('workresume', (ctx) => {
    const userId = ctx.from.id;
    if (!userPauseTimes[userId]) return ctx.reply('⚠️ Your work isn\'t paused! Use /work to start or /workpause to pause.');
    
    const pauseDuration = Date.now() - userPauseTimes[userId];
    userPausedDurations[userId] = (userPausedDurations[userId] || 0) + pauseDuration;
    delete userPauseTimes[userId];
    
    ctx.reply('▶️ Work session resumed! Keep going!');
});

bot.command('status', (ctx) => {
    const userId = ctx.from.id;
    if (!userSessions[userId]) return ctx.reply('⚠️ You are not currently working on any session.');

    const { startTime, sessionName } = userSessions[userId];
    const elapsedTime = (Date.now() - startTime - (userPausedDurations[userId] || 0)) / 1000;
    const hoursWorked = elapsedTime / 3600;
    const earnings = hoursWorked * userHourlyRates[userId];

    const h = Math.floor(hoursWorked);
    const m = Math.floor((elapsedTime % 3600) / 60);
    const s = Math.floor(elapsedTime % 60);

    ctx.reply(`🔄 Current work session details:\n\n📝 Session Name: '${sessionName}'\n⏰ Time worked: ${h}h ${m}m ${s}s\n💸 Estimated earnings: ${earnings.toFixed(2)} MDL`);
});

setInterval(() => {
    const now = Date.now();
    for (const userId in userSessions) {
        const { startTime, sessionName } = userSessions[userId];
        const elapsedTime = (now - startTime - (userPausedDurations[userId] || 0)) / 1000;
        const hoursWorked = elapsedTime / 3600;
        const earnings = hoursWorked * userHourlyRates[userId];
        bot.telegram.sendMessage(userId, `⏰ You've been working on session '${sessionName}' for ${Math.floor(hoursWorked)}h ${Math.floor((elapsedTime % 3600) / 60)}m!\n💪 Keep going! \n💸 Estimated earnings so far: ${earnings.toFixed(2)} MDL.`);
    }
}, 3600000);

bot.launch().then(() => console.log('✅ Bot is running...'));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
