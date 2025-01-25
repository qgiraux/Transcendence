FROM python

WORKDIR /avatar_images

COPY avatar/requirements.txt ./
RUN pip install  --upgrade pip \
    && pip install  -r requirements.txt


COPY ./avatar/avatarservice .
RUN chmod 777 docker-entrypoint.sh


EXPOSE 8000

CMD ["./docker-entrypoint.sh"]
