const fs = require('fs');
const path = require('path');

const sourceConfig = path.join(__dirname, 'gameConfig.js');
const clientConfig = path.join(__dirname, 'client', 'gameConfig.js');
const serverConfig = path.join(__dirname, 'server', 'gameConfig.js');

function syncConfig() {
  if (!fs.existsSync(sourceConfig)) {
    console.error('Исходный gameConfig.js не найден!');
    process.exit(1);
  }

  const configContent = fs.readFileSync(sourceConfig, 'utf8');
  
  // Копируем в клиент
  fs.writeFileSync(clientConfig, configContent);
  console.log('✓ Конфиг синхронизирован с client/gameConfig.js');
  
  // Копируем на сервер
  fs.writeFileSync(serverConfig, configContent);
  console.log('✓ Конфиг синхронизирован с server/gameConfig.js');
}

if (require.main === module) {
  syncConfig();
}

module.exports = syncConfig;