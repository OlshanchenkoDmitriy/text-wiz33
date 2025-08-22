# 🤖 Android без Android Studio: установки и возможности

## 📋 Обзор

Данное руководство описывает, как использовать Android разработку без Android Studio, используя только командную строку и Android SDK. Это полезно для автоматизации сборки, CI/CD пайплайнов, или работы на серверах без графического интерфейса.

## 🛠️ Установка Android SDK без Android Studio

### Шаг 1: Скачивание Command Line Tools

1. **Перейдите** на https://developer.android.com/studio#command-tools
2. **Скачайте** "Command line tools only" для вашей ОС
3. **Распакуйте** архив в папку `C:\Android\sdk\cmdline-tools\latest\` (Windows)

### Шаг 2: Установка переменных среды

**Windows:**
```batch
set ANDROID_HOME=C:\Android\sdk
set PATH=%PATH%;%ANDROID_HOME%\cmdline-tools\latest\bin;%ANDROID_HOME%\platform-tools
```

**Linux/Mac:**
```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools
```

### Шаг 3: Установка необходимых компонентов

```bash
# Принятие лицензий
sdkmanager --licenses

# Установка основных компонентов
sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"

# Проверка установленных компонентов
sdkmanager --list_installed
```

## 🔧 Gradle CLI для сборки APK

Проект уже содержит Gradle Wrapper, что позволяет собирать APK без Android Studio.

### Доступные команды сборки

**Windows:**
```batch
# Навигация в папку android
cd android

# Список всех задач
.\gradlew.bat tasks

# Сборка debug APK
.\gradlew.bat assembleDebug

# Сборка release APK
.\gradlew.bat assembleRelease

# Сборка всех вариантов
.\gradlew.bat assemble

# Установка debug APK на устройство
.\gradlew.bat installDebug

# Очистка проекта
.\gradlew.bat clean
```

**Linux/Mac:**
```bash
# Навигация в папку android
cd android

# Список всех задач
./gradlew tasks

# Сборка debug APK
./gradlew assembleDebug

# Сборка release APK
./gradlew assembleRelease

# Установка debug APK
./gradlew installDebug
```

### Расположение готовых APK

```
android/app/build/outputs/apk/
├── debug/
│   └── app-debug.apk
└── release/
    └── app-release.apk
```

## 🔐 Подпись Release APK через командную строку

### Создание keystore

```bash
keytool -genkey -v -keystore my-release-key.keystore -alias alias_name -keyalg RSA -keysize 2048 -validity 10000
```

### Настройка подписи в gradle.properties

Создайте или дополните файл `android/gradle.properties`:

```properties
MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=alias_name
MYAPP_RELEASE_STORE_PASSWORD=ваш_пароль_keystore
MYAPP_RELEASE_KEY_PASSWORD=ваш_пароль_ключа
```

### Обновление app/build.gradle

Добавьте в `android/app/build.gradle`:

```gradle
android {
    ...
    signingConfigs {
        release {
            if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
                storeFile file(MYAPP_RELEASE_STORE_FILE)
                storePassword MYAPP_RELEASE_STORE_PASSWORD
                keyAlias MYAPP_RELEASE_KEY_ALIAS
                keyPassword MYAPP_RELEASE_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### Сборка подписанного APK

```bash
cd android
.\gradlew.bat assembleRelease
```

## 📱 Установка и тестирование APK

### Через ADB

```bash
# Проверка подключенных устройств
adb devices

# Установка APK
adb install app/build/outputs/apk/debug/app-debug.apk

# Удаление приложения
adb uninstall com.scribe.com

# Просмотр логов
adb logcat
```

### Ручная установка

1. **Скопируйте** APK на устройство
2. **Разрешите** установку из неизвестных источников
3. **Откройте** APK файл для установки

## 🚀 Автоматизация сборки

### Пример скрипта сборки (build.bat)

```batch
@echo off
echo "Начинаем сборку Android APK..."

REM Синхронизация Capacitor
cd ..
call npx cap sync android

REM Сборка APK
cd android
call gradlew.bat clean
call gradlew.bat assembleDebug

echo "APK готов: android\app\build\outputs\apk\debug\app-debug.apk"
pause
```

### CI/CD интеграция

**GitHub Actions пример:**

```yaml
name: Android Build
on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build web assets
      run: npm run build
    
    - name: Setup Java
      uses: actions/setup-java@v3
      with:
        distribution: 'temurin'
        java-version: '17'
    
    - name: Sync Capacitor
      run: npx cap sync android
    
    - name: Build APK
      run: |
        cd android
        ./gradlew assembleDebug
    
    - name: Upload APK
      uses: actions/upload-artifact@v3
      with:
        name: debug-apk
        path: android/app/build/outputs/apk/debug/app-debug.apk
```

## 🔍 Отладка и диагностика

### Полезные команды Gradle

```bash
# Детальная информация о задачах
.\gradlew.bat tasks --all

# Информация о зависимостях
.\gradlew.bat dependencies

# Информация о конфигурации подписи
.\gradlew.bat signingReport

# Проверка среды сборки
.\gradlew.bat buildEnvironment

# Принудительная пересборка
.\gradlew.bat clean build --refresh-dependencies
```

### Решение проблем

**Ошибка: "SDK location not found"**
```bash
# Создайте файл android/local.properties
echo "sdk.dir=C:\\Android\\sdk" > android/local.properties
```

**Ошибка: "Gradle daemon stopped unexpectedly"**
```bash
# Остановите все daemon'ы и пересоберите
.\gradlew.bat --stop
.\gradlew.bat clean build
```

**Ошибка: "Could not find method implementation()"**
```bash
# Проверьте версию Gradle Wrapper
.\gradlew.bat --version
```

## ⚡ Преимущества CLI подхода

### ✅ Плюсы:
- **Быстрота**: Нет загрузки тяжелого IDE
- **Автоматизация**: Легко интегрируется в скрипты
- **Ресурсы**: Меньше потребления RAM и CPU
- **CI/CD**: Идеально для серверной сборки
- **Скриптинг**: Можно автоматизировать весь процесс

### ❌ Минусы:
- **Отладка**: Нет встроенного debugger'а
- **UI**: Нет визуального редактора layout'ов
- **IntelliSense**: Нет автодополнения кода
- **Профилирование**: Нет встроенных инструментов анализа

## 📊 Сравнение методов сборки

| Функция | Android Studio | CLI | Capacitor CLI |
|---------|----------------|-----|---------------|
| Сборка APK | ✅ GUI | ✅ Команды | ❌ Только sync |
| Подпись APK | ✅ Мастер | ✅ Настройка | ❌ |
| Отладка | ✅ Полная | ⚠️ Логи | ❌ |
| Автоматизация | ❌ | ✅ | ⚠️ Частичная |
| Скорость | ⚠️ Медленно | ✅ Быстро | ✅ Быстро |
| Ресурсы | ❌ Много | ✅ Мало | ✅ Мало |

## 🎯 Рекомендуемый workflow

### Для разработки:
1. **Capacitor sync** для синхронизации изменений
2. **Gradle CLI** для быстрой сборки и тестирования
3. **ADB** для установки и отладки
4. **Android Studio** только при необходимости отладки UI

### Для производства:
1. **CI/CD pipeline** с автоматической сборкой
2. **Подписанные APK** через Gradle
3. **Автоматическое тестирование** через Gradle tasks
4. **Деплой** в магазины приложений

---

**📱 Создано для Text Wizard — персональный офлайн‑редактор текста**

*Данное руководство позволяет полностью отказаться от Android Studio для сборки APK, используя только командную строку и стандартные инструменты Android SDK.*