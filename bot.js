require('dotenv').config();
const { Telegraf } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);
const userSessions = {}; // Store work start times and session info
const userProjectPrices = {}; // Store project prices
const userEarnings = {}; // Store total earnings
const userPauseTimes = {}; // Store pause times

bot.start((ctx) => ctx.reply('👋 Welcome to the Work Tracker Bot! \n💼 Use /work <session name> <project price> to start your work session, /workend to stop, /workpause to pause and resume with /workresume. \n💰 Set your project price during session creation.'));

bot.command('work', (ctx) => {
    const userId = ctx.from.id;
    const args = ctx.message.text.split(' ');
    const sessionName = args[1];
    const price = parseFloat(args[2]);

    if (!sessionName || isNaN(price) || price <= 0) {
        return ctx.reply('⚠️ Please provide a valid session name and price. Example: /work "Project A" 1000');
    }

    if (userSessions[userId]) {
        return ctx.reply('🛑 You already started working! Use /workend to stop or /workpause to pause.');
    }

    const startTime = Date.now();
    const sessionDate = new Date(startTime);
    const weekDay = sessionDate.toLocaleString('en-us', { weekday: 'long' });

    userSessions[userId] = { startTime, sessionName, sessionDate, weekDay };
    userProjectPrices[userId] = price; // Store project price for the user

    ctx.reply(`✅ Work session '${sessionName}' started on ${weekDay}, ${sessionDate.toLocaleDateString()} \n💸 Project price set to ${price.toFixed(2)} MDL! \n⏰ I will notify you every hour! \nUse /workend to stop or /workpause to pause your session.`);
});

bot.command('workend', (ctx) => {
    const userId = ctx.from.id;
    if (!userSessions[userId]) return ctx.reply('⚠️ You need to start working first using /work.');

    const { startTime, sessionName } = userSessions[userId];
    const elapsedTime = (Date.now() - startTime) / 1000;
    delete userSessions[userId];

    const projectTime = elapsedTime / 3600; // Convert seconds to hours
    const totalProjectTime = 8; // Define the total time for the project (for example, 8 hours for a full project)
    const earnings = (projectTime / totalProjectTime) * userProjectPrices[userId]; // Calculate earnings based on worked time relative to total project time

    userEarnings[userId] = (userEarnings[userId] || 0) + earnings;

    const h = Math.floor(elapsedTime / 3600);
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
    if (!userPauseTimes[userId]) return ctx.reply('⚠️ Your work isn\'t paused! Use /workstart to begin or /workpause to pause.');
    
    const pauseDuration = Date.now() - userPauseTimes[userId];
    delete userPauseTimes[userId];
    
    userSessions[userId].startTime = Date.now() - pauseDuration; 
    ctx.reply('▶️ Work session resumed! Keep going!');
});

bot.command('checktime', (ctx) => {
    const userId = ctx.from.id;
    if (!userSessions[userId]) return ctx.reply('⚠️ You need to start working first using /work.');

    const { startTime, sessionName } = userSessions[userId];
    const elapsedTime = (Date.now() - startTime) / 1000;
    const projectTime = elapsedTime / 3600; // Convert seconds to hours
    const totalProjectTime = 8; // Total time for the project (8 hours)
    const earnings = (projectTime / totalProjectTime) * (userProjectPrices[userId] || 0);

    const h = Math.floor(elapsedTime / 3600);
    const m = Math.floor((elapsedTime % 3600) / 60);
    const s = Math.floor(elapsedTime % 60);

    ctx.reply(`⏰ Time worked on session '${sessionName}': ${h}h ${m}m ${s}s\n💰 Estimated earnings so far: ${earnings.toFixed(2)} MDL`);
});

bot.command('checkstatus', (ctx) => {
    const userId = ctx.from.id;
    if (!userSessions[userId]) return ctx.reply('⚠️ You are not currently working on any session.');

    const { startTime, sessionName, sessionDate, weekDay } = userSessions[userId];
    const elapsedTime = (Date.now() - startTime) / 1000;
    const projectTime = elapsedTime / 3600; // Convert seconds to hours
    const earnings = (projectTime / 8) * (userProjectPrices[userId] || 0); // Calculate earnings based on worked time relative to total project time

    const h = Math.floor(elapsedTime / 3600);
    const m = Math.floor((elapsedTime % 3600) / 60);
    const s = Math.floor(elapsedTime % 60);

    ctx.reply(`🔄 Status of session '${sessionName}':\n📅 Date: ${sessionDate.toLocaleDateString()} | 🗓️ Weekday: ${weekDay}\n⏰ Time worked: ${h}h ${m}m ${s}s\n💸 Estimated earnings: ${earnings.toFixed(2)} MDL`);
});

bot.command('status', (ctx) => {
    const userId = ctx.from.id;
    if (!userSessions[userId]) return ctx.reply('⚠️ You are not currently working on any session.');

    const { startTime, sessionName, sessionDate, weekDay } = userSessions[userId];
    const elapsedTime = (Date.now() - startTime) / 1000;
    const projectTime = elapsedTime / 3600; // Convert seconds to hours
    const earnings = (projectTime / 8) * (userProjectPrices[userId] || 0); // Calculate earnings based on worked time relative to total project time

    const h = Math.floor(elapsedTime / 3600);
    const m = Math.floor((elapsedTime % 3600) / 60);
    const s = Math.floor(elapsedTime % 60);

    ctx.reply(`🔄 Current work session details:\n\n📝 Session Name: '${sessionName}'\n📅 Date: ${sessionDate.toLocaleDateString()} | 🗓️ Weekday: ${weekDay}\n⏰ Time worked: ${h}h ${m}m ${s}s\n💸 Estimated earnings: ${earnings.toFixed(2)} MDL\n`);
});

setInterval(() => {
    const now = Date.now();
    for (const userId in userSessions) {
        const { startTime, sessionName } = userSessions[userId];
        const elapsedTime = (now - startTime) / 1000;
        const projectTime = elapsedTime / 3600; // Convert seconds to hours
        const earnings = (projectTime / 8) * (userProjectPrices[userId] || 0);
        bot.telegram.sendMessage(userId, `⏰ You've been working on session '${sessionName}' for ${Math.floor(projectTime)}h ${Math.floor((elapsedTime % 3600) / 60)}m!\n💪 Keep going! \n💸 Estimated earnings so far: ${earnings.toFixed(2)} MDL.`);
    }
}, 3600000);

bot.launch().then(() => console.log('✅ Bot is running...'));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));