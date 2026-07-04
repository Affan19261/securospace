@echo off
REM ============================================================
REM  SecuroSpace — Sync Web Assets to Android
REM  Run this after making changes to the web app files.
REM ============================================================

set ASSETS_DIR=app\src\main\assets
set WEB_DIR=..\

echo [SecuroSpace] Syncing web assets to Android assets folder...

copy /Y "%WEB_DIR%index.html"       "%ASSETS_DIR%\index.html"
copy /Y "%WEB_DIR%style.css"        "%ASSETS_DIR%\style.css"
copy /Y "%WEB_DIR%app.js"           "%ASSETS_DIR%\app.js"
copy /Y "%WEB_DIR%crypto-helper.js" "%ASSETS_DIR%\crypto-helper.js"

echo [SecuroSpace] Done! Assets updated.
pause
