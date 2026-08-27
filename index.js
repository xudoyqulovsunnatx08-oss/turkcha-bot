require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');

const bot = new Telegraf(process.env.BOT_TOKEN);

// ==== So'zlar lug'ati ====
const words = [
  { tr: "merhaba", uz: "salom" },
  { tr: "teşekkür ederim", uz: "rahmat" },
  { tr: "günaydın", uz: "xayrli tong" },
  { tr: "iyi akşamlar", uz: "xayrli kech" },
  { tr: "nasılsın", uz: "qandaysiz" },
  { tr: "evet", uz: "ha" },
  { tr: "hayır", uz: "yo'q" },
  { tr: "su", uz: "suv" },
  { tr: "ekmek", uz: "non" },
  { tr: "kitap", uz: "kitob" },
  { tr: "araba", uz: "mashina" },
  { tr: "ev", uz: "uy" },
  { tr: "okul", uz: "maktab" },
  { tr: "dost", uz: "do'st" },
  { tr: "aile", uz: "oila" },
  { tr: "güzel", uz: "chiroyli" },
  { tr: "büyük", uz: "katta" },
  { tr: "küçük", uz: "kichik" },
  { tr: "para", uz: "pul" },
  { tr: "zaman", uz: "vaqt" },
];

// ==== Statistikani fayldan saqlash/o'qish ====
const STATS_FILE = './stats.json';

let userStats = {};
if (fs.existsSync(STATS_FILE)) {
  try {
    userStats = JSON.parse(fs.readFileSync(STATS_FILE, 'utf8'));
  } catch (e) {
    userStats = {};
  }
}

function saveStats() {
  fs.writeFileSync(STATS_FILE, JSON.stringify(userStats, null, 2));
}

function getStats(chatId) {
  if (!userStats[chatId]) {
    userStats[chatId] = { correct: 0, wrong: 0 };
  }
  return userStats[chatId];
}

// ==== /start ====
bot.start((ctx) => {
  ctx.reply(
    `Salom, ${ctx.from.first_name}! 🇹🇷\n\n` +
    `Men senga Turk tilini o'rganishda yordam beraman.\n\n` +
    `Buyruqlar:\n` +
    `/soz - Yangi Turkcha so'z olish\n` +
    `/viktorina - Bilimingni sinash\n` +
    `/royxat - Barcha so'zlar ro'yxati\n` +
    `/statistika - Natijalaringni ko'rish`
  );
});

// ==== /soz - tasodifiy so'z ====
bot.command('soz', (ctx) => {
  const random = words[Math.floor(Math.random() * words.length)];
  ctx.reply(`🇹🇷 ${random.tr}\n🇺🇿 ${random.uz}`);
});

// ==== /royxat - barcha so'zlar ====
bot.command('royxat', (ctx) => {
  const list = words.map(w => `${w.tr} — ${w.uz}`).join('\n');
  ctx.reply(`📖 So'zlar ro'yxati:\n\n${list}`);
});

// ==== /viktorina - inline tugmali test ====
bot.command('viktorina', (ctx) => {
  const correct = words[Math.floor(Math.random() * words.length)];

  let wrongOptions = words.filter(w => w.uz !== correct.uz);
  wrongOptions = wrongOptions.sort(() => 0.5 - Math.random()).slice(0, 3);

  const allOptions = [...wrongOptions, correct].sort(() => 0.5 - Math.random());

  const buttons = allOptions.map(opt =>
    Markup.button.callback(opt.uz, `answer:${opt.uz}:${correct.uz}`)
  );

  ctx.reply(
    `"${correct.tr}" so'zi o'zbekchada nima degani?`,
    Markup.inlineKeyboard(buttons, { columns: 2 })
  );
});

// ==== Tugma bosilganda javobni tekshirish ====
bot.action(/answer:(.+):(.+)/, (ctx) => {
  const chosen = ctx.match[1];
  const correctAnswer = ctx.match[2];
  const chatId = ctx.chat.id;
  const stats = getStats(chatId);

  if (chosen === correctAnswer) {
    stats.correct++;
    saveStats();
    ctx.answerCbQuery("To'g'ri! ✅");
    ctx.editMessageText(`✅ To'g'ri! Javob: "${correctAnswer}"`);
  } else {
    stats.wrong++;
    saveStats();
    ctx.answerCbQuery("Noto'g'ri ❌");
    ctx.editMessageText(`❌ Noto'g'ri. To'g'ri javob: "${correctAnswer}"`);
  }
});

// ==== /statistika ====
bot.command('statistika', (ctx) => {
  const stats = getStats(ctx.chat.id);
  const total = stats.correct + stats.wrong;
  const percent = total > 0 ? Math.round((stats.correct / total) * 100) : 0;

  ctx.reply(
    `📊 Sizning natijalaringiz:\n\n` +
    `✅ To'g'ri: ${stats.correct}\n` +
    `❌ Noto'g'ri: ${stats.wrong}\n` +
    `📈 Foiz: ${percent}%`
  );
});

bot.launch();
console.log("Bot ishga tushdi...");