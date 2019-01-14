set NODE_ENV=develop
git clone -b release https://github.com/candysonya/myhitchhiker.git
cd myhitchhiker
call npm install
cd client
call npm install
cd..

set NODE_ENV=production
call gulp package --prod

pause