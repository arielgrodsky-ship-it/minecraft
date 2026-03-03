const mineflayer = require('mineflayer');
const config = require('./settings.json');
const express = require('express');

const app = express();

app.get('/', (req, res) => {
  res.send('Bot has arrived');
});

app.listen(8000, () => {
  console.log('Server started');
});

function createBot() {
  const bot = mineflayer.createBot({
    username: config['bot-account']['username'],
    password: config['bot-account']['password'],
    auth: config['bot-account']['type'],
    host: config.server.ip,
    port: config.server.port,
    version: config.server.version,
  });

  bot.settings.colorsEnabled = false;

  // =========================
  // AUTO AUTH
  // =========================

  function sendRegister(password) {
    return new Promise((resolve) => {
      bot.chat(`/register ${password} ${password}`);
      console.log('[Auth] Sent /register');

      bot.once('chat', (username, message) => {
        if (
          message.includes('successfully registered') ||
          message.includes('already registered')
        ) {
          console.log('[Auth] Register OK');
          resolve();
        } else {
          resolve();
        }
      });
    });
  }

  function sendLogin(password) {
    return new Promise((resolve) => {
      bot.chat(`/login ${password}`);
      console.log('[Auth] Sent /login');

      bot.once('chat', (username, message) => {
        if (message.includes('successfully logged in')) {
          console.log('[Auth] Login OK');
        }
        resolve();
      });
    });
  }

  // =========================
  // SPAWN
  // =========================

  bot.once('spawn', async () => {
    console.log('\x1b[33m[AfkBot] Human-like random mode enabled\x1b[0m');

    // Auto-auth if enabled
    if (config.utils['auto-auth'].enabled) {
      const password = config.utils['auto-auth'].password;
      await sendRegister(password);
      await sendLogin(password);
    }

    // Stop any movement
    bot.clearControlStates();

    // Prevent digging completely
    bot.on('diggingStarted', () => {
      bot.stopDigging();
    });

    // -----------------------
    // RANDOM JUMP LOOP
    // -----------------------
    function randomJump() {
      const delay = 1500 + Math.random() * 1500; // 1.5–3 sec

      setTimeout(() => {
        bot.setControlState('jump', true);

        setTimeout(() => {
          bot.setControlState('jump', false);
        }, 300 + Math.random() * 200);

        randomJump();
      }, delay);
    }

    randomJump();

    // -----------------------
    // RANDOM LOOK LOOP
    // -----------------------
    function randomLook() {
      const delay = 2000 + Math.random() * 3000; // 2–5 sec

      setTimeout(() => {
        const yaw = Math.random() * Math.PI * 2;
        const pitch = (Math.random() - 0.5) * 0.6;

        bot.look(yaw, pitch, true);

        randomLook();
      }, delay);
    }

    randomLook();
  });

  // =========================
  // EVENTS
  // =========================

  bot.on('death', () => {
    console.log(
      `\x1b[33m[AfkBot] Bot died at ${bot.entity.position}\x1b[0m`
    );
  });

  if (config.utils['auto-reconnect']) {
    bot.on('end', () => {
      console.log('[AfkBot] Disconnected. Reconnecting...');
      setTimeout(() => {
        createBot();
      }, config.utils['auto-reconnect-delay']);
    });
  }

  bot.on('kicked', (reason) =>
    console.log(
      '\x1b[33m',
      `[AfkBot] Kicked from server. Reason:\n${reason}`,
      '\x1b[0m'
    )
  );

  bot.on('error', (err) =>
    console.log(`\x1b[31m[ERROR] ${err.message}\x1b[0m`)
  );
}

createBot();
