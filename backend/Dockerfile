FROM node:latest

WORKDIR /app
COPY package.json .

RUN npm install
COPY . .
ENV PORT=80
EXPOSE  ${PORT}

CMD ["npm","start"]
