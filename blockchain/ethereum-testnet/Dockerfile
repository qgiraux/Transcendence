# syntax=docker/dockerfile:1
FROM ethereum/client-go
#FROM ethereum/client-go:v1.13.15

#Check
RUN geth --version

RUN		set -eux; \
			apk update; \
			apk add \
				jq \
			;

#Check
RUN jq --version

#Copy
COPY ./genesis.json .
COPY ./entrypoint.sh .

#PID 1
ENTRYPOINT	["/bin/sh", "./entrypoint.sh"]
#CMD ["sleep", "infinity"]
CMD ["geth", "--nodiscover", "--ipcdisable"]
