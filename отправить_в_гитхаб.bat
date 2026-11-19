@echo off
chcp 65001 > nul
echo ============================================================
echo   Отправка проекта в GitHub: DianaSahaMeow/ctroi
echo ============================================================
echo.

git branch -M main
git remote remove origin 2>nul
git remote add origin https://github.com/DianaSahaMeow/ctroi.git
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
    echo Ссылка: https://github.com/DianaSahaMeow/ctroi
    echo.
    echo Теперь на Render.com выберите этот репозиторий!
    echo ============================================================
) else (
    echo.
    echo [ВНИМАНИЕ] Если репозиторий не найден:
    echo 1. Проверьте, что на https://github.com/DianaSahaMeow нажат 'Create repository' с именем 'ctroi'.
    echo 2. Войдите в свой аккаунт DianaSahaMeow при запросе.
)

echo.
pause
