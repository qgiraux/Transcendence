FROM	debian:latest

RUN		set -eux; \
			apt-get update; \
			apt-get install -y \
					nodejs \
					npm \
					jq \
					curl \
					openssh-server \
			; \
			apt-get clean all;

#
RUN nodejs --version
RUN npm --version
RUN jq --version
RUN curl --version

RUN useradd -m -s /bin/bash dev
RUN mkdir -p /run/sshd

#EXPOSE 22

ENTRYPOINT [ "/usr/sbin/sshd", "-D" ]
#ENTRYPOINT ["sleep", "infinity"]