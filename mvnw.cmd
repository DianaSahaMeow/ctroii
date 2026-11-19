@REM ----------------------------------------------------------------------------
@REM Maven Wrapper script for Windows
@REM ----------------------------------------------------------------------------
@echo off
setlocal

if not defined JAVA_HOME (
  if exist "C:\Users\Никита\Desktop\oracleJdk-26" (
    set "JAVA_HOME=C:\Users\Никита\Desktop\oracleJdk-26"
  ) else (
    echo Error: JAVA_HOME is not set.
    exit /b 1
  )
)

if exist "%USERPROFILE%\.tools\apache-maven-3.9.9\bin\mvn.cmd" (
  call "%USERPROFILE%\.tools\apache-maven-3.9.9\bin\mvn.cmd" %*
  exit /b %ERRORLEVEL%
)

mvn %*
exit /b %ERRORLEVEL%
