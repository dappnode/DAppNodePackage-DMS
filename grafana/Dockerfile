FROM grafana/grafana:7.3.3

USER root

COPY ./grafana.ini /etc/grafana/grafana.ini
COPY ./datasource.yml /etc/grafana/provisioning/datasources/

CMD [ "grafana-server", \
      "--homepath=/usr/share/grafana", \
      "--config=/etc/grafana/grafana.ini", \
      "--packaging=docker" \
    ]