FROM alpine:edge

RUN apk add grafana --update-cache --repository http://dl-3.alpinelinux.org/alpine/edge/testing/

COPY ./grafana.ini /etc/grafana/grafana.ini
COPY ./datasource.yml /etc/grafana/provisioning/datasources/

CMD [ "grafana-server", \
      "--homepath=/usr/share/grafana", \
      "--config=/etc/grafana/grafana.ini", \
      "--packaging=docker", \
      "cfg:default.log.mode=console", \
      "cfg:default.paths.data=/var/lib/grafana", \
      "cfg:default.paths.logs=/var/log/grafana", \
      "cfg:default.paths.plugins=/var/lib/grafana/plugins", \
      "cfg:default.paths.provisioning=/etc/grafana/provisioning" \
    ]

# ENV GF_PATHS_DATA=/var/lib/grafana \
#     GF_PATHS_LOGS=/var/log/grafana \
#     GF_PATHS_PLUGINS=/var/lib/grafana/plugins \
#     GF_PATHS_PROVISIONING=/etc/grafana/provisioning
