@echo off
set "JAVA_EXE=C:\Program Files\Eclipse Adoptium\jdk-17.0.17.10-hotspot\bin\java.exe"
set "JAR_PATH=%~dp0target\dota-parser-1.0-SNAPSHOT.jar"

if not exist "%JAVA_EXE%" (
    echo Error: JDK 17 not found at %JAVA_EXE%
    pause
    exit /b 1
)

echo Starting GUI Parser...
start "" "%JAVA_EXE%" -jar "%JAR_PATH%"
