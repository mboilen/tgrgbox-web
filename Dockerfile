FROM node:19.2.0-alpine3.15
WORKDIR /app
COPY . /app
RUN npm install
ENV NODE_ENV=production
CMD ["npm", "start"]
#EXPOSE 3000
