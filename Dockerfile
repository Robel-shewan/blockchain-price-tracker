FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache --virtual .gyp \
    python3 \
    make \
    g++ 

RUN npm install -g nodemon

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

# Start the application using nodemon for live-reloading
CMD ["npm", "run","start:dev"]

# Clean up node-gyp dependencies (optional to reduce image size)
RUN apk del .gyp
