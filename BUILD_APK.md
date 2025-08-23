# 📱 Сборка APK в Android Studio

## 🚀 Пошаговая инструкция

### Шаг 1: Открытие проекта
✅ Проект уже открыт в Android Studio

### Шаг 2: Проверка настроек
1. **Откройте** `android/app/build.gradle`
2. **Проверьте** версию приложения:
   ```gradle
   android {
       defaultConfig {
           applicationId "com.scribe.com"
           versionCode 1
           versionName "1.0.0"
       }
   }
   ```

### Шаг 3: Сборка APK

#### Вариант A: Debug APK (быстрая сборка)
1. **Меню** → **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
2. **Дождитесь** завершения сборки
3. **APK будет** в `android/app/build/outputs/apk/debug/app-debug.apk`

#### Вариант B: Release APK (для публикации)
1. **Меню** → **Build** → **Generate Signed Bundle / APK**
2. **Выберите** "APK"
3. **Создайте** keystore или используйте существующий
4. **Заполните** данные подписи
5. **Выберите** "release" build variant
6. **Нажмите** "Finish"

### Шаг 4: Настройка подписи (для Release)

#### Создание keystore:
```bash
keytool -genkey -v -keystore my-release-key.keystore -alias alias_name -keyalg RSA -keysize 2048 -validity 10000
```

#### Данные для подписи:
- **Key store path**: `my-release-key.keystore`
- **Key store password**: (ваш пароль)
- **Key alias**: `alias_name`
- **Key password**: (ваш пароль)

### Шаг 5: Проверка APK

#### Debug APK:
- **Размер**: ~15-25 MB
- **Подпись**: Debug key
- **Использование**: Тестирование

#### Release APK:
- **Размер**: ~15-25 MB
- **Подпись**: Ваш keystore
- **Использование**: Публикация

## 🔧 Возможные проблемы

### Ошибка 1: "Gradle sync failed"
**Решение:**
1. **File** → **Sync Project with Gradle Files**
2. **File** → **Invalidate Caches and Restart**

### Ошибка 2: "Build failed"
**Решение:**
1. **Build** → **Clean Project**
2. **Build** → **Rebuild Project**

### Ошибка 3: "Missing signing config"
**Решение:**
1. Создайте keystore (см. Шаг 4)
2. Настройте signing config в `build.gradle`

## 📋 Чек-лист перед сборкой

### ✅ Проверьте:
- [ ] Все иконки на месте
- [ ] Разрешения в AndroidManifest.xml
- [ ] Версия приложения в build.gradle
- [ ] Название приложения в strings.xml (Text Wizard)
- [ ] Capacitor синхронизирован (`npx cap sync android`)

### ✅ Тестирование:
- [ ] Приложение запускается
- [ ] Буфер обмена работает
- [ ] Все функции работают
- [ ] Иконки отображаются

## 🎯 Готовые команды

### Для быстрой сборки:
```bash
# Синхронизация
npx cap sync android

# Открытие в Android Studio
npx cap open android

# Затем в Android Studio: Build → Build APK(s)
```

### Для release сборки:
```bash
# Синхронизация
npx cap sync android

# Открытие в Android Studio
npx cap open android

# Затем в Android Studio: Build → Generate Signed Bundle/APK
```

## 📱 Установка APK

### На устройстве:
1. **Разрешите** установку из неизвестных источников
2. **Скачайте** APK на устройство
3. **Откройте** APK файл
4. **Нажмите** "Установить"

### Через ADB:
```bash
adb install app-debug.apk
```

## 🚀 Публикация

### Google Play Store:
1. **Создайте** аккаунт разработчика
2. **Загрузите** Release APK
3. **Заполните** информацию о приложении
4. **Опубликуйте** в магазине

### Альтернативные магазины:
- **APKPure**
- **APKMirror**
- **F-Droid**

## 🤖 Альтернатива: Android без Android Studio

Если вы предпочитаете работать только с командной строкой или хотите настроить автоматизированную сборку, ознакомьтесь с подробным руководством:

**📖 [ANDROID_CLI.md](ANDROID_CLI.md) — полное руководство по использованию Android без Android Studio**

---

**📱 Создано для Text Wizard — персональный офлайн‑редактор текста**
