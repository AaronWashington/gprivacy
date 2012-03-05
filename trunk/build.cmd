@echo off
@rem $Id$
if not defined JAR     set JAR=%~d0\jdk1.6.0_18\bin\jar.exe
if not defined SHA1SUM set SHA1SUM=%~d0\Develop\cygwin\bin\sha1sum.exe
if not defined XULLINT set XULLINT=python %~dp0xullint.py

rem echo.>%~dp0build.log
rem set "LOG=2>&1 | tee -a %~dp0build.log"

rem make jar output more compact ;-)
set JAVA_TOOL_OPTIONS=-Duser.language=en -Duser.country=US

call python26 "%~dp0mkinst.py" -p gprivacy -o "%~dp0\versions" -i "%~dp0." --AMO --latest %LOG%
if errorlevel 1 exit /b %errorlevel%
call python26 "%~dp0mkinst.py" -p gprask   -o "%~dp0\versions" -i "%~dp0engines\ask.com" -m "%~dp0chrome.manifest" %LOG%
