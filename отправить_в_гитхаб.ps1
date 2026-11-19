Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Отправка проекта в GitHub: DianaSahaMeow/ctroii" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

git branch -M main
git remote set-url origin https://github.com/DianaSahaMeow/ctroii.git
git add .
git commit -m "Complete Defect Tracker full stack with Neon cloud DB"
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host "[УСПЕХ] Проект успешно загружен в GitHub!" -ForegroundColor Green
    Write-Host "Ссылка: https://github.com/DianaSahaMeow/ctroii" -ForegroundColor Green
    Write-Host ""
    Write-Host "Теперь на Render.com выберите репозиторий ctroii!" -ForegroundColor Green
    Write-Host "============================================================" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "[ВНИМАНИЕ] Ошибка при отправке. Проверьте вход в GitHub." -ForegroundColor Yellow
}
