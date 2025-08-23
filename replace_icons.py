#!/usr/bin/env python3
"""
Скрипт для замены иконок приложения LinguaScribe
Автоматически копирует сгенерированные иконки в соответствующие папки Android
"""

import os
import shutil
import glob
from pathlib import Path

def replace_android_icons():
    """Заменяет иконки в Android проекте"""
    
    # Пути к папкам Android
    android_base = "android/app/src/main/res"
    icon_mappings = {
        "icon-mipmap-mdpi-48x48.png": f"{android_base}/mipmap-mdpi/ic_launcher.png",
        "icon-mipmap-hdpi-72x72.png": f"{android_base}/mipmap-hdpi/ic_launcher.png",
        "icon-mipmap-xhdpi-96x96.png": f"{android_base}/mipmap-xhdpi/ic_launcher.png",
        "icon-mipmap-xxhdpi-144x144.png": f"{android_base}/mipmap-xxhdpi/ic_launcher.png",
        "icon-mipmap-xxxhdpi-192x192.png": f"{android_base}/mipmap-xxxhdpi/ic_launcher.png",
    }
    
    print("🔄 Замена иконок Android...")
    
    # Проверяем наличие сгенерированных иконок
    generated_icons = glob.glob("icon-*.png")
    
    if not generated_icons:
        print("❌ Сгенерированные иконки не найдены!")
        print("📋 Сначала используйте generate_icons.html для создания иконок")
        return False
    
    # Заменяем иконки
    replaced_count = 0
    for icon_file, target_path in icon_mappings.items():
        if os.path.exists(icon_file):
            try:
                # Создаем папку если её нет
                os.makedirs(os.path.dirname(target_path), exist_ok=True)
                
                # Копируем иконку
                shutil.copy2(icon_file, target_path)
                print(f"✅ {icon_file} → {target_path}")
                replaced_count += 1
            except Exception as e:
                print(f"❌ Ошибка при копировании {icon_file}: {e}")
        else:
            print(f"⚠️  Файл {icon_file} не найден")
    
    print(f"\n🎉 Заменено {replaced_count} иконок из {len(icon_mappings)}")
    return True

def replace_web_icons():
    """Заменяет веб иконки"""
    
    print("\n🌐 Замена веб иконок...")
    
    # Favicon
    if os.path.exists("icon-Favicon-32x32.png"):
        try:
            shutil.copy2("icon-Favicon-32x32.png", "public/favicon.ico")
            print("✅ favicon.ico обновлен")
        except Exception as e:
            print(f"❌ Ошибка при обновлении favicon: {e}")
    
    # Web icon
    if os.path.exists("icon-Web Icon-192x192.png"):
        try:
            shutil.copy2("icon-Web Icon-192x192.png", "public/icon-192.png")
            print("✅ icon-192.png обновлен")
        except Exception as e:
            print(f"❌ Ошибка при обновлении web icon: {e}")

def update_manifest():
    """Обновляет Android манифест для новых иконок"""
    
    manifest_path = "android/app/src/main/AndroidManifest.xml"
    
    if not os.path.exists(manifest_path):
        print("⚠️  AndroidManifest.xml не найден")
        return
    
    print("\n📱 Обновление Android манифеста...")
    
    try:
        with open(manifest_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Проверяем, что иконки уже указаны правильно
        if '@mipmap/ic_launcher' in content:
            print("✅ Иконки в манифесте уже настроены правильно")
        else:
            print("⚠️  Проверьте настройки иконок в AndroidManifest.xml")
            
    except Exception as e:
        print(f"❌ Ошибка при чтении манифеста: {e}")

def main():
    """Основная функция"""
    
    print("🎨 LinguaScribe - Замена иконок приложения")
    print("=" * 50)
    
    # Проверяем наличие Android проекта
    if not os.path.exists("android"):
        print("❌ Android проект не найден!")
        print("📋 Сначала выполните: npx cap add android")
        return
    
    # Заменяем иконки
    android_success = replace_android_icons()
    replace_web_icons()
    update_manifest()
    
    if android_success:
        print("\n🚀 Следующие шаги:")
        print("1. Синхронизируйте проект: npx cap sync android")
        print("2. Откройте в Android Studio: npx cap open android")
        print("3. Соберите APK в Android Studio")
    else:
        print("\n❌ Не удалось заменить иконки Android")
        print("📋 Убедитесь, что сгенерировали иконки через generate_icons.html")

if __name__ == "__main__":
    main() 