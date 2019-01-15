FROM node:7.10
MAINTAINER chan.wang wangchan518@gmail.com

RUN apt-get update

# code folder
RUN mkdir -p /usr/src
WORKDIR /usr/src
RUN git clone -b master https://github.com/candysonya/myhitchhiker.git
WORKDIR /usr/src/myhitchhiker

# npm install -g
RUN npm install -g pm2 yarn gulp-cli typescript@2.3.3 
RUN npm install gulp -D
RUN npm install typescript@2.3.3 --save

# npm install
RUN npm install

RUN cd client && npm install

# gulp build
RUN gulp release --prod

WORKDIR /usr/src/myhitchhiker/build
# start mail
EXPOSE 8080
CMD ["pm2-docker", "index.js"]
