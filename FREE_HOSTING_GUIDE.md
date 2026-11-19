# Полное руководство по бесплатному размещению (Сервер, PostgreSQL, Фото)

Данное руководство объясняет, как развернуть веб-приложение **СтройКонтроль** в облаке **на 100% бесплатно** без привязки банковских карт.

---

## 1. Бесплатная база данных PostgreSQL (Рекомендуется: Neon.tech)

**Neon.tech** предоставляет пожизненный бесплатный облачный PostgreSQL 16 с SSL, автоматическим резервным копированием и быстрым подключением.

### Шаги настройки:
1. Зарегистрируйтесь на сайте [https://neon.tech](https://neon.tech) (можно войти через GitHub или Google за 10 секунд).
2. Нажмите **"Create Project"**, укажите имя (например, `defect-tracker`) и выберите ближайший регион (например, `Europe (Frankfurt)`).
3. В открывшемся дашборде скопируйте строку подключения **Connection String**.
4. В строке выберите формат **Connection string** (JDBC):
   ```
   jdbc:postgresql://ep-example-123.eu-central-1.aws.neon.tech/defect_tracker?sslmode=require
   ```
5. Сохраните параметры:
   - `DB_URL` = полученный JDBC URL
   - `DB_USERNAME` = имя пользователя (обычно `neondb_owner` или `postgres`)
   - `DB_PASSWORD` = сгенерированный пароль

> **Альтернатива:** [Supabase.com](https://supabase.com) — дает 2 бесплатных проекта PostgreSQL до 500 МБ данных.

---

## 2. Бесплатный сервер для бэкенда (Рекомендуется: Render.com)

**Render.com** предоставляет бесплатный тариф **Web Service (Free Tier)** с поддержкой Docker, автоматическим SSL HTTPS и автоматическим деплоем из GitHub.

### Шаги запуска:
1. Создайте репозиторий на GitHub (например, `defect-tracker`) и загрузите туда файлы проекта:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/ВАШ_ЛОГИН/defect-tracker.git
   git push -u origin main
   ```
2. Зарегистрируйтесь на [https://render.com](https://render.com) (через GitHub).
3. Нажмите **"New +"** &rarr; **"Web Service"**.
4. Выберите ваш GitHub-репозиторий.
5. Render автоматически обнаружит `Dockerfile`:
   - **Environment:** `Docker`
   - **Region:** `Frankfurt (EU Central)`
   - **Plan:** `Free`
6. В разделе **"Environment Variables"** добавьте переменные:
   - `PORT` = `8080`
   - `SPRING_PROFILES_ACTIVE` = `postgres`
   - `DB_URL` = ваш JDBC URL из Neon.tech (например, `jdbc:postgresql://...`)
   - `DB_USERNAME` = пользователь базы
   - `DB_PASSWORD` = пароль базы
   - `UPLOAD_DIR` = `/app/uploads/defects`
7. Нажмите **"Create Web Service"**.
8. Через 2-3 минуты приложение соберется и запустится на постоянном бесплатном адресе вида:
   ```
   https://defect-tracker-xxxx.onrender.com
   ```

> **Примечание:** В проект уже добавлен файл `render.yaml` — при желании в Render можно нажать **"Blueprints"** и выбрать этот репозиторий для автоматического создания сервиса в 1 клик!

---

## 3. Бесплатное хранилище фотографий дефектов

В системе реализовано 2 варианта хранения фото дефектов:

### Вариант 1: Локальное хранилище на сервере (Включено по умолчанию)
- Приложение сохраняет фотографии в папку `UPLOAD_DIR` (`./uploads/defects` или `/app/uploads/defects`).
- Раздача статики и просмотр фотографий осуществляется через контроллер `/api/files/{fileName}` с кэшированием `Cache-Control: public, max-age=86400`.
- **Клиентское сжатие:** На смартфонах рабочие делают фото камерой 12-48 Мп (10-15 МБ каждое). Встроенный модуль `image-compressor.js` перед отправкой автоматически сжимает фото на Canvas до ~250-400 КБ. Благодаря этому на бесплатном диске можно хранить **более 3 000 – 5 000 фотографий дефектов без превышения лимитов!**

### Вариант 2: Облачное S3-хранилище (Пожизненно бесплатный Cloudflare R2 / Supabase Storage / Backblaze B2)
- **Cloudflare R2**: 10 ГБ навсегда бесплатно, **0 рублей за исходящий трафик**.
- **Supabase Storage**: 1 ГБ бесплатно, совместим с S3 API.
- В проекте предусмотрен класс `S3StorageService.java`. Для переключения на S3 достаточно установить переменную окружения:
  ```properties
  STORAGE_TYPE=s3
  ```

---

## 4. Локальный запуск на компьютере (Zero-Setup)

Если вы хотите запустить и протестировать систему прямо сейчас на своем компьютере:

### Вариант А: Мгновенный запуск без установки внешних баз
По умолчанию в конфигурации `application.yml` активирована встроенная база H2 в режиме эмуляции PostgreSQL с сохранением данных в файл `./data/defectdb`.
```powershell
mvn spring-boot:run
```
Приложение откроется на `http://localhost:8080`.

### Вариант Б: Запуск в Docker Compose (с настоящим PostgreSQL 16)
```bash
docker compose up -d
```
Поднимется контейнер PostgreSQL 16 и контейнер со Spring Boot приложением.
Фотографии дефектов сохраняются в постоянный Docker Volume `defect_photos_storage`.
