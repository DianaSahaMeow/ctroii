@echo off
chcp 65001 > nul
echo ============================================================
echo   СТРОЙКОНТРОЛЬ: Запуск системы приемки квартир
echo   База данных: Neon PostgreSQL (ОБЛАКО)
echo ============================================================
echo.

set JAVA_HOME=C:\Users\Никита\Desktop\oracleJdk-26
set PATH=%JAVA_HOME%\bin;%PATH%

if not exist "%JAVA_HOME%\bin\java.exe" (
    echo [ОШИБКА] JDK не найден по пути: %JAVA_HOME%
    pause
    exit /b 1
)

echo [1/2] Проверка собранного приложения...
if not exist "target\defect-tracker-1.0.0.jar" (
    echo [ИНФО] Сборка приложения через Maven...
    call "%USERPROFILE%\.tools\apache-maven-3.9.9\bin\mvn.cmd" package -DskipTests
)

echo [2/2] Подключение к облачной базе Neon и запуск на порту 8080...
echo.
echo Локальный адрес: http://localhost:8080
echo Вход для руководителя: manager / manager123
echo Вход для приемщика:     worker1 / worker123
echo.
echo Открытие браузера через 4 секунды...
start "" timeout /t 4 /nobreak > nul & start http://localhost:8080

"%JAVA_HOME%\bin\java.exe" -jar target\defect-tracker-1.0.0.jar --spring.profiles.active=postgres --spring.datasource.url="jdbc:postgresql://ep-sparkling-river-bd78sy4s-pooler.c-8.us-east-2.aws.neon.tech/neondb?sslmode=require" --spring.datasource.username="neondb_owner" --spring.datasource.password="npg_yYqRTo1Nf5GC" --server.port=8080
pause
