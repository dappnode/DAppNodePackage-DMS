FROM alpine:edge

RUN apk add grafana --update-cache --repository http://dl-3.alpinelinux.org/alpine/edge/testing/

ENTRYPOINT [ "grafana-server", \
  "--homepath=/usr/share/grafana", \
  "--config=/etc/grafana.ini", \
  "--packaging=docker", \
  "cfg:default.log.mode=console", \
  "cfg:default.paths.data=/var/lib/grafana", \
  "cfg:default.paths.logs=/var/log/grafana", \
  "cfg:default.paths.plugins=/var/lib/grafana/plugins", \
  "cfg:default.paths.provisioning=/etc/grafana/provisioning" \
  ]
