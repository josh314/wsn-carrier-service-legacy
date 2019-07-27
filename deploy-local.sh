# mkdir dist
# cp src/index.html dist/
. ~/.nvm/nvm.sh
nvm use v8.10.0 #used by AWS lambda 
npm run lambda-serve &
npm run dev-server