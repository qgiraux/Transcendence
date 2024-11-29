FROM debian:bullseye

RUN apt -y update &&\
	apt -y upgrade && \
	apt -y install nginx &&\
	apt -y install systemctl &&\
	apt -y install openssl &&\
	apt clean

WORKDIR /etc/nginx
COPY	./nginx/conf/nginx.conf /etc/nginx/nginx.conf
COPY	./nginx/tools/create_certificates.sh .
RUN		chmod +x create_certificates.sh &&\
		./create_certificates.sh

RUN	mkdir -p /var/run/nginx &&\
	chmod -R 755 /var/www/html &&\
	chown -R www-data:www-data /var/www/html

COPY ../frontend/* /var/www/html

EXPOSE 5000
ENTRYPOINT ["nginx", "-g", "daemon off;"]
