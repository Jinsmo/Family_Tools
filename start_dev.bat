@echo off
setlocal

echo ========================================================
echo        FM Tools 项目一键启动脚本
echo ========================================================
echo.

REM 检查后端依赖
if not exist "node_modules" (
    echo [INFO] 检测到后端依赖未安装，正在安装...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] 后端依赖安装失败！
        pause
        exit /b %errorlevel%
    )
    echo [INFO] 后端依赖安装完成。
    echo.
)

REM 检查前端依赖
if not exist "frontend\node_modules" (
    echo [INFO] 检测到前端依赖未安装，正在安装...
    cd frontend
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] 前端依赖安装失败！
        cd ..
        pause
        exit /b %errorlevel%
    )
    cd ..
    echo [INFO] 前端依赖安装完成。
    echo.
)

echo [INFO] 正在启动前后端服务...
echo [INFO] 按 Ctrl+C 可停止服务
echo.

call npm run dev:all

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] 服务启动过程中发生错误。
    pause
)

endlocal
