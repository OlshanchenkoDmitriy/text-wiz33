#!/usr/bin/env python3
"""
Скрипт для автоматического распределения иконок из папки icons
Автоматически находит и копирует иконки в соответствующие папки проекта
"""

import os
import shutil
import glob
from pathlib import Path

def distribute_icons():
    """Распределяет иконки из папки new_icons по нужным папкам проекта"""
    
    # Пути для Android иконок
    android_paths = {
        'ic_launcher-mdpi.png': 'android/app/src/main/res/mipmap-mdpi/ic_launcher.png',
        'ic_launcher-hdpi.png': 'android/app/src/main/res/mipmap-hdpi/ic_launcher.png',
        'ic_launcher-xhdpi.png': 'android/app/src/main/res/mipmap-xhdpi/ic_launcher.png',
        'ic_launcher-xxhdpi.png': 'android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png',
        'ic_launcher-xxxhdpi.png': 'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png',
    }
    
    # Пути для круглых Android иконок
    android_round_paths = {
        'ic_launcher_round-mdpi.png': 'android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png',
        'ic_launcher_round-hdpi.png': 'android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png',
        'ic_launcher_round-xhdpi.png': 'android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png',
        'ic_launcher_round-xxhdpi.png': 'android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png',
        'ic_launcher_round-xxxhdpi.png': 'android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png',
    }
    
    # Пути для Web иконок
    web_paths = {
        'icon-192.png': 'public/icon-192.png',
        'icon-512.png': 'public/icon-512.png',
        'favicon.ico': 'public/favicon.ico',
    }
    
    source_dir = 'new_icons'
    
    if not os.path.exists(source_dir):
        print(f"❌ Папка {source_dir} не найдена!")
        return
    
    print("🚀 Начинаю распределение иконок...")
    
    # Копируем Android иконки
    print("\n📱 Копирую Android иконки:")
    for source, destination in android_paths.items():
        source_path = os.path.join(source_dir, source)
        if os.path.exists(source_path):
            os.makedirs(os.path.dirname(destination), exist_ok=True)
            shutil.copy2(source_path, destination)
            print(f"  ✅ {source} -> {destination}")
        else:
            print(f"  ❌ Файл не найден: {source}")
    
    # Копируем круглые Android иконки
    print("\n🔵 Копирую круглые Android иконки:")
    for source, destination in android_round_paths.items():
        source_path = os.path.join(source_dir, source)
        if os.path.exists(source_path):
            os.makedirs(os.path.dirname(destination), exist_ok=True)
            shutil.copy2(source_path, destination)
            print(f"  ✅ {source} -> {destination}")
        else:
            print(f"  ❌ Файл не найден: {source}")
    
    # Копируем Web иконки
    print("\n🌐 Копирую Web иконки:")
    for source, destination in web_paths.items():
        source_path = os.path.join(source_dir, source)
        if os.path.exists(source_path):
            os.makedirs(os.path.dirname(destination), exist_ok=True)
            shutil.copy2(source_path, destination)
            print(f"  ✅ {source} -> {destination}")
        else:
            print(f"  ❌ Файл не найден: {source}")
    
    print("\n🎉 Распределение иконок завершено!")
    print("\n📋 Следующие шаги:")
    print("1. Пересоберите приложение: npm run build")
    print("2. Синхронизируйте с Android: npx cap sync android")
    print("3. Соберите APK: cd android && .\\gradlew assembleDebug")

def create_web_manifest():
    """Создает или обновляет web app manifest с новыми иконками"""
    
    manifest_path = "public/manifest.json"
    
    manifest_content = {
        "name": "LinguaScribe",
        "short_name": "LinguaScribe", 
        "description": "Универсальный редактор текстов и песен",
        "start_url": "/",
        "display": "standalone",
        "background_color": "#1a1a1a",
        "theme_color": "#4a9eff",
        "icons": [
            {
                "src": "/icon-192.png",
                "sizes": "192x192",
                "type": "image/png"
            }
        ]
    }
    
    try:
        import json
        with open(manifest_path, 'w', encoding='utf-8') as f:
            json.dump(manifest_content, f, indent=2, ensure_ascii=False)
        print(f"✅ Web App Manifest обновлен: {manifest_path}")
    except Exception as e:
        print(f"❌ Ошибка при создании manifest: {e}")

def update_index_html():
    """Обновляет index.html для подключения иконок"""
    
    index_path = "index.html"
    
    if not os.path.exists(index_path):
        print(f"⚠️  index.html не найден")
        return
    
    try:
        with open(index_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Проверяем наличие ссылок на иконки
        icon_links = [
            '<link rel="icon" type="image/x-icon" href="/favicon.ico">',
            '<link rel="apple-touch-icon" href="/icon-192.png">',
            '<link rel="manifest" href="/manifest.json">'
        ]
        
        updated = False
        for link in icon_links:
            if link not in content:
                # Добавляем в head
                if '<head>' in content and '</head>' in content:
                    head_start = content.find('<head>') + 6
                    content = content[:head_start] + '\n    ' + link + content[head_start:]
                    updated = True
        
        if updated:
            with open(index_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ index.html обновлен с иконками")
        else:
            print(f"✅ index.html уже содержит ссылки на иконки")
            
    except Exception as e:
        print(f"❌ Ошибка при обновлении index.html: {e}")

def main():
    """Основная функция"""
    
    print("🎨 LinguaScribe - Автоматическое распределение иконок")
    print("=" * 60)
    
    # Распределяем иконки
    distribute_icons()
    
    if os.path.exists("android"):
        print(f"\n📱 Android проект найден!")
        print(f"🎯 Иконки Android готовы к использованию")
    else:
        print(f"\n⚠️  Android проект не найден")
        print(f"📋 Выполните: npx cap add android")
    
    return True # Always return True as distribute_icons now handles its own success/failure

if __name__ == "__main__":
    main() 