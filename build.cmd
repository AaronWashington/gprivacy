@echo off
set JAR=%~d0\jdk1.6.0_18\bin\jar.exe
set SHA1SUM=%~d0\Develop\cygwin\bin\sha1sum.exe

echo.>%~dp0build.log
set "LOG=2>&1 | tee -a %~dp0build.log"

call python ./mkinst.py           -i "%~dp0."               -o "%~dp0\versions" %LOG%
if errorlevel 1 exit
call python ./mkinst.py -p gprask -i "%~dp0engines\ask.com" -o "%~dp0\versions" %LOG%
