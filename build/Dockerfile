FROM alpine:edge

RUN apk add -u prometheus bash supervisor
RUN apk add grafana --update-cache --repository http://dl-3.alpinelinux.org/alpine/edge/testing/

COPY ./prometheus/prometheus.yml /etc/prometheus/prometheus.yml
COPY ./grafana/provisioning/ /etc/grafana/provisioning/
COPY ./grafana/provisioning/dashboards/*.json /provisioning/dashboards/
COPY ./grafana/grafana.ini /etc/grafana.ini
COPY ./prometheus/targets /etc/prometheus/targets
COPY ./prometheus/targets /provisioning/targets
COPY supervisord.conf /etc/supervisord/supervisord.conf
COPY entrypoint.sh /usr/local/bin/entrypoint

ENTRYPOINT ["entrypoint"]