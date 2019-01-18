REM ** 如果您打算部署Hitchhiker，请忽略这个脚本，部署请参考：http://doc.hitchhiker-api.com/cn/installation/  如果是开发，可以参考脚本搭开发环境
REM ** if you try to deploy Hitchhiker, please ignore this file, reference to: http://doc.hitchhiker-api.com/cn/installation/ 
REM ensure mysql is installed with user:'root' password: 'hitchhiker888' and create database 'hitchhiker-prod'
REM replace myhost with your ip

cd /d %~dp0
set host=http://10.86.18.215:8080/

set NODE_ENV=develop
git clone -b release https://github.com/brookshi/Hitchhiker.git
cd hitchhiker
call npm install -g pm2 yarn gulp-cli typescript@2.3.3 pm2-windows-service
call npm install gulp -D
call npm install typescript@2.3.3 --save
call npm install
cd client
call npm install
cd..

set NODE_ENV=production
call gulp release --prod

@echo off&setlocal enabledelayedexpansion
for /f "eol=* tokens=*" %%i in (pm2.json) do (
set a=%%i
set "a=!a:myhost=%host%!"
echo !a!>>$)
move $ pm2.json

pm2 kill
pm2 start pm2.json

REM run as windows service, use cmd.exe with administrator, set PM2_HOME, PM2_SERVICE_PM2_DIR and PM2_SERVICE_SCRIPTS step by step. more to check: https://github.com/jon-hall/pm2-windows-service

REM pm2-service-install -n hitchhiker-api