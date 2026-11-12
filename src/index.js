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

// Загружаем HTML для ВСЕХ игр
const tetrisHtml = fs.readFileSync(path.join('src', 'widgets', 'tetris.html'), 'utf8');
const rogueHtml = fs.readFileSync(path.join('src', 'widgets', 'rogue.html'), 'utf8'); // <- Новая игра

// --- СИСТЕМА ПОДСЧЕТА ИГРОКОВ ---
const dataDir = path.join('data');
const playersFile = path.join(dataDir, 'players.json');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

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
// --------------------------------

tg.catch((error) => console.error('🔥 Ошибка:', error));

tg.onMessage(async (message) => {
  if (message.text === '/start') {
    await message.send('👋 Привет! Доступные команды:\n/tetris — запустить Тетрис\n/rogue — запустить изометрический рогалик (прототип)');
  }
  
  // --- ТЕТРИС ---
  if (message.text === '/tetris') {
    if (message.chat.type !== 'private') return message.send('Только в личных сообщениях.');
    if (message.from && message.from.id) addPlayer(message.from.id);
    const totalPlayers = players.size;

    try {
      await tg.api.sendWidget({
        chat_id: message.chat.id,
        html: tetrisHtml,
        allow_queries: true,
        chat_data: JSON.stringify({ locked: [], score: 0, totalPlayers: totalPlayers }),
        caption: `Тетрис | 👥 Игроков: ${totalPlayers}`
      });
    } catch (error) {
      console.error('🔥 Ошибка отправки Тетриса:', error);
    }
  }

  // --- РОГАЛИК ---
  if (message.text === '/rogue') {
    if (message.chat.type !== 'private') return message.send('Только в личных сообщениях.');
    
    try {
      await tg.api.sendWidget({
        chat_id: message.chat.id,
        html: rogueHtml,
        allow_queries: true,
        chat_data: JSON.stringify({ state: 'start' }),
        caption: '⚔️ Изометрический рогалик (Прототип)'
      });
    } catch (error) {
      console.error('🔥 Ошибка отправки Рогалика:', error);
    }
  }
});

tg.startPolling();
console.log(`✅ Бот запущен! Игроков в базе: ${players.size}`);
