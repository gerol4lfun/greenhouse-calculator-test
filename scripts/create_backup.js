const fs = require('fs');
const path = require('path');

const version = 'v70';
const backupDir = path.join(__dirname, '..', 'backup', version);

// Создаем папку для бэкапа
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    console.log(`✅ Создана папка: ${backupDir}`);
}

// Файлы для копирования
const filesToCopy = [
    { src: 'index.html', dest: 'index.html' },
    { src: 'css/styles.css', dest: 'styles.css' },
    { src: 'js/scripts.js', dest: 'scripts.js' }
];

const projectRoot = path.join(__dirname, '..');

filesToCopy.forEach(({ src, dest }) => {
    const srcPath = path.join(projectRoot, src);
    const destPath = path.join(backupDir, dest);
    
    try {
        if (fs.existsSync(srcPath)) {
            fs.copyFileSync(srcPath, destPath);
            console.log(`✅ Скопирован: ${src} → backup/${version}/${dest}`);
        } else {
            console.error(`❌ Файл не найден: ${src}`);
        }
    } catch (error) {
        console.error(`❌ Ошибка при копировании ${src}:`, error.message);
    }
});

console.log(`\n🎉 Бэкап версии ${version} создан успешно!`);
console.log(`📁 Расположение: backup/${version}/`);
