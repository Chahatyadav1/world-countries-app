FROM node:20-alpine3.19

WORKDIR /usr/app

COPY package*.json /usr/app/

RUN npm install

COPY . .

ENV MONGO_URI="mongodb+srv://supercluster.d83jj.mongodb.net/superData"
ENV MONGO_USERNAME="root"
ENV MONGO_PASSWORD="password"

EXPOSE 3000

CMD [ "npm", "start" ]
