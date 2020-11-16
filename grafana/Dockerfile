FROM alpine:edge

RUN apk add grafana --update-cache --repository http://dl-3.alpinelinux.org/alpine/edge/testing/

COPY ./grafana.ini /etc/grafana/grafana.ini
COPY ./datasource.yml /etc/grafana/provisioning/datasources/

CMD grafana-server --homepath=/usr/share/grafana --config=/etc/grafana/grafana.ini --packaging=docker
