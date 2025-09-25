FROM oven/bun:1.2.20 AS dependencies-env
COPY . /arcarchiver

FROM dependencies-env AS development-dependencies-env
COPY ./package.json bun.lock /arcarchiver/
WORKDIR /app
RUN bun i --frozen-lockfile

FROM dependencies-env AS production-dependencies-env
COPY ./package.json bun.lock /arcarchiver/
WORKDIR /arcarchiver
RUN bun i --production

FROM dependencies-env AS build-env
COPY ./package.json bun.lock /arcarchiver/
WORKDIR /arcarchiver
RUN bun i --frozen-lockfile
RUN bun run build

FROM dependencies-env
COPY ./package.json bun.lock /arcarchiver/
COPY --from=production-dependencies-env /arcarchiver/node_modules /arcarchiver/node_modules
COPY --from=build-env /arcarchiver/build /arcarchiver/build
WORKDIR /app
CMD ["bun", "run", "start"]