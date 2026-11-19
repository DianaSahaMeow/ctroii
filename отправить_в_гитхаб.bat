@echo off
chcp 65001 > nul
echo ============================================================
echo   Отправка проекта в GitHub: DianaSahaMeow/ctroii
echo ============================================================
echo.

git branch -M main
git remote set-url origin https://github.com/DianaSahaMeow/ctroii.git 2>nul || git remote add origin https://github.com/DianaSahaMeow/ctroii.git
git add .
git commit -m "Complete Defect Tracker full stack with Neon cloud DB" 2>nul

echo Выполняется отправка в GitHub...
echo (Если откроется окно входа GitHub - нажмите 'Sign in with your browser')
echo.

git push -u origin main

if %ERRORLEVEL% equ 0 (
    echo.
    echo ============================================================
    echo [УСПЕХ] Проект успешно загружен в GitHub!
    echo Ссылка: https://github.com/DianaSahaMeow/ctroii
    echo.
    echo Теперь на Render.com выберите репозиторий ctroii!
    echo ============================================================
) else (
    echo.
    echo [ВНИМАНИЕ] Ошибка отправки.
    echo 1. Проверьте, что репозиторий создан на https://github.com/DianaSahaMeow/ctroii
    echo 2. Войдите в браузер под своим аккаунтом DianaSahaMeow.
)

echo.
pause
