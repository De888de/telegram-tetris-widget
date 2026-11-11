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
const tetrisHtml = fs.readFileSync(path.join('src', 'widgets', 'tetris.html'), 'utf8');

// --- СИСТЕМА ПОДСЧЕТА ИГРОКОВ ---
const dataDir = path.join('data');
const playersFile = path.join(dataDir, 'players.json');

// Создаем папку data, если ее нет
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Читаем список игроков
let players = new Set();
if (fs.existsSync(playersFile)) {
  try {
    const data = JSON.parse(fs.readFileSync(playersFile, 'utf8'));
    players = new Set(data);
  } catch (e) {
    console.error('Ошибка чтения файла игроков:', e);
  }
}

function addPlayer(userId) {
  if (!players.has(userId)) {
    players.add(userId);
    fs.writeFileSync(playersFile, JSON.stringify(Array.from(players), null, 2));
    return true; // Новый игрок
  }
  return false;
}
// --------------------------------

tg.catch((error) => console.error('🔥 Ошибка:', error));

tg.onMessage(async (message) => {
  if (message.text === '/start') {
    await message.send('👋 Привет! Напиши /tetris, чтобы запустить игру.');
  }
  
  if (message.text === '/tetris') {
    if (message.chat.type !== 'private') return message.send('Только в личных сообщениях.');
    
    // Добавляем игрока в базу
    if (message.from && message.from.id) {
      addPlayer(message.from.id);
    }
    
    const totalPlayers = players.size;

    try {
      await tg.api.sendWidget({
        chat_id: message.chat.id,
        html: tetrisHtml,
        allow_queries: true,
        chat_data: JSON.stringify({ 
          locked: [], 
          score: 0,
          totalPlayers: totalPlayers // Передаем счетчик игроков в виджет
        }),
        caption: `Тетрис | 👥 Игроков: ${totalPlayers}`
      });
    } catch (error) {
      console.error('🔥 Ошибка отправки виджета:', error);
    }
  }
});

tg.on('widget_query', async (query) => {
  console.log('Запрос от виджета:', query.data);
});

tg.startPolling();
console.log(`✅ Бот запущен! Всего игроков в базе: ${players.size}`);
