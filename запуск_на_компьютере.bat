@echo off
chcp 65001 > nul
echo ============================================================
echo   СТРОЙКОНТРОЛЬ: Запуск системы приемки квартир
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

echo [2/2] Запуск сервера СтройКонтроль на порту 8080...
echo.
echo Локальный адрес: http://localhost:8080
echo Вход для руководителя: manager / manager123
echo Вход для приемщика:     worker1 / worker123
echo.
echo Открытие браузера через 3 секунды...
start "" timeout /t 3 /nobreak > nul & start http://localhost:8080

"%JAVA_HOME%\bin\java.exe" -jar target\defect-tracker-1.0.0.jar
pause
