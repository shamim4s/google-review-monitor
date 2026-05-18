FROM apify/actor-node-playwright-chrome:20

COPY --chown=myuser:myuser package*.json ./

USER myuser

RUN npm install

COPY --chown=myuser:myuser . ./

CMD npm start