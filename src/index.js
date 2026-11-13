import { Telegram } from 'puregram';
import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

config();

if (!process.env.BOT_TOKEN) {
  console.error('❌ Ошибка: BOT_TOKEN не найден');
  process.exit(1);
}

const tg = Telegram.fromToken(process.env.BOT_TOKEN);

// Загружаем HTML
const tetrisHtml = fs.readFileSync(path.join('src', 'widgets', 'tetris.html'), 'utf8');
const rogueHtml = fs.readFileSync(path.join('src', 'widgets', 'rogue.html'), 'utf8');
const snakeHtml = fs.readFileSync(path.join('src', 'widgets', 'snake.html'), 'utf8');
const arkanoidHtml = fs.readFileSync(path.join('src', 'widgets', 'arkanoid.html'), 'utf8');
const invadersHtml = fs.readFileSync(path.join('src', 'widgets', 'invaders.html'), 'utf8');
// const clickerHtml = fs.readFileSync(path.join('src', 'widgets', 'clicker.html'), 'utf8');

// --- ПОДСЧЕТ ИГРОКОВ ---
const dataDir = path.join('data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
const playersFile = path.join(dataDir, 'players.json');
let players = new Set();
if (fs.existsSync(playersFile)) {
  try { players = new Set(JSON.parse(fs.readFileSync(playersFile, 'utf8'))); } catch (e) {}
}
function addPlayer(userId) {
  if (!players.has(userId)) {
    players.add(userId);
    fs.writeFileSync(playersFile, JSON.stringify(Array.from(players), null, 2));
  }
}

tg.catch((error) => console.error('🔥 Ошибка:', error));

tg.onMessage(async (message) => {
  if (message.text === '/start') {
    await message.send('👋 Привет! Доступные игры:\n/tetris — Тетрис\n/rogue — Рогалик\n/snake — Змейка\n/arkanoid — Арканоид\n/invaders — Космические захватчики\n\n(Кликер временно отключен)');
  }
  
  if (message.text === '/tetris') {
    if (message.chat.type !== 'private') return message.send('Только в личных сообщениях.');
    if (message.from && message.from.id) addPlayer(message.from.id);
    try {
      await tg.api.sendWidget({
        chat_id: message.chat.id, html: tetrisHtml, allow_queries: true,
        chat_data: JSON.stringify({ locked: [], score: 0, totalPlayers: players.size }),
        caption: `Тетрис | 👥 Игроков: ${players.size}`
      });
      console.log('✅ Тетрис отправлен');
    } catch (error) { console.error('🔥 Ошибка Тетриса:', error); }
  }

  if (message.text === '/rogue') {
    if (message.chat.type !== 'private') return message.send('Только в личных сообщениях.');
    try {
      await tg.api.sendWidget({
        chat_id: message.chat.id, html: rogueHtml, allow_queries: true,
        chat_data: JSON.stringify({ state: 'start' }),
        caption: '⚔️ Изометрический рогалик'
      });
      console.log('✅ Рогалик отправлен');
    } catch (error) { console.error('🔥 Ошибка Рогалика:', error); }
  }

  if (message.text === '/snake') {
    if (message.chat.type !== 'private') return message.send('Только в личных сообщениях.');
    try {
      await tg.api.sendWidget({
        chat_id: message.chat.id, html: snakeHtml, allow_queries: false,
        caption: '🐍 Змейка'
      });
      console.log('✅ Змейка отправлена');
    } catch (error) { console.error('🔥 Ошибка Змейки:', error); }
  }

  if (message.text === '/arkanoid') {
    if (message.chat.type !== 'private') return message.send('Только в личных сообщениях.');
    try {
      await tg.api.sendWidget({
        chat_id: message.chat.id, html: arkanoidHtml, allow_queries: false,
        caption: '🧱 Арканоид'
      });
      console.log('✅ Арканоид отправлен');
    } catch (error) { console.error('🔥 Ошибка Арканоида:', error); }
  }

  // --- КОСМИЧЕСКИЕ ЗАХВАТЧИКИ ---
  if (message.text === '/invaders') {
    if (message.chat.type !== 'private') return message.send('Только в личных сообщениях.');
    try {
      await tg.api.sendWidget({
        chat_id: message.chat.id, html: invadersHtml, allow_queries: false,
        caption: '👾 Космические захватчики'
      });
      console.log('✅ Захватчики отправлены');
    } catch (error) { console.error('🔥 Ошибка Захватчиков:', error); }
  }
});

// Обработка запросов
tg.on('widget_query', async (query) => {
  try { await tg.api.answerWidgetQuery({ widget_query_id: query.id }); } catch (e) {}
});

tg.startPolling();
console.log(`✅ Бот запущен! Игроков: ${players.size}`);
