@echo off
robocopy "N:\SelfProject\boutique-catalog" "E:\GitHub Desktop\boutique-catalog" /MIR /XD node_modules .git .vercel
if %errorlevel% leq 7 exit /b 0
exit /b %errorlevel%
