FROM nginx:1.27-alpine

RUN rm -f /etc/nginx/conf.d/default.conf

COPY conf.d/ /etc/nginx/conf.d/
COPY certs/ /etc/nginx/certs/

EXPOSE 80 443
