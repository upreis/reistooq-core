@echo off
echo Limpando cache do Vite e node_modules...

if exist "node_modules\.vite" (
    rmdir /s /q "node_modules\.vite"
    echo Cache .vite removido
)

if exist "dist" (
    rmdir /s /q "dist"
    echo Pasta dist removida
)

echo.
echo IMPORTANTE: Voce PRECISA limpar o cache do navegador!
echo.
echo Chrome/Edge:
echo   1. Abra DevTools (F12)
echo   2. Clique com botao direito no icone de reload
echo   3. Selecione 'Limpar cache e fazer recarga forcada'
echo.
echo Ou simplesmente: Ctrl + Shift + R
echo.
echo Limpeza concluida! Agora recarregue a pagina com Ctrl+Shift+R
pause
