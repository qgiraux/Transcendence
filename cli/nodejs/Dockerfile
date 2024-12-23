FROM	node:latest

#
RUN nodejs --version

#
COPY . .

RUN npm install -g node-gyp

RUN apt-get update; \
        apt-get install -y \
            nano \
        ;


# RUN apk update
# RUN apk add nano

COPY entrypoint.sh .
ENTRYPOINT [ "sh", "entrypoint.sh" ]
CMD ["sleep", "infinity"]