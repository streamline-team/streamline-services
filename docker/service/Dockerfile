FROM node:20.10.0-bookworm-slim AS build

WORKDIR /app

# Copy everything to container
COPY . /app

# Install pnpm globally
RUN npm i -g pnpm@8.11.0

# Prod dependencies
RUN pnpm install

# Build lib
RUN pnpm run build

# Remove existing node_modules
RUN rm -fdr node_modules

# Prod pnpm packages
RUN pnpm install --prefer-offline --prod --ignore-scripts --config.auto-install-peers=true

# ------------ Stage 2 ------------ #

FROM gcr.io/distroless/nodejs20-debian12

ARG PACKAGE

# We only need the transpiled service files
COPY --from=build /app/lib /usr/src/app
# ... package.json
COPY --from=build /app/package.json /usr/src/app
# ... and all production node modules
COPY --from=build /app/node_modules /usr/src/app/node_modules

WORKDIR /usr/src/app

# Server listening on 8080
EXPOSE 8080

# Launch service
CMD ["index.js"]