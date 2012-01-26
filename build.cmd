@echo off
@rem $Id$
set JAR=%~d0\jdk1.6.0_18\bin\jar.exe
set SHA1SUM=%~d0\Develop\cygwin\bin\sha1sum.exe

rem echo.>%~dp0build.log
rem set "LOG=2>&1 | tee -a %~dp0build.log"

call python "%~dp0mkinst.py" -p gprivacy -o "%~dp0\versions" -i "%~dp0." %LOG%
if errorlevel 1 exit /b %errorlevel%
call python "%~dp0mkinst.py" -p gprask   -o "%~dp0\versions" -i "%~dp0engines\ask.com" %LOG%

rem force a new version on commit?
touch "%~dp0chrome\content\about.xul"
