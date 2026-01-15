FROM node:20-slim

WORKDIR /app

# Copy everything from the context
COPY . .

# Robust install: try to install in discord-bot if it exists, otherwise in current dir
RUN if [ -d "discord-bot" ]; then \
        cd discord-bot && npm install --production --legacy-peer-deps; \
    else \
        npm install --production --legacy-peer-deps; \
    fi

# Robust start: check where the bot is and run it
CMD ["sh", "-c", "if [ -d 'discord-bot' ]; then npm start --prefix discord-bot; else npm start; fi"]
