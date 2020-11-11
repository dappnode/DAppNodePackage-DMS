FROM prom/prometheus

COPY prometheus.yml /etc/prometheus/prometheus.yml

CMD [ "--config.file=/etc/prometheus/prometheus.yml", \
      "--storage.tsdb.path=/prometheus" \
      "--web.console.libraries=/etc/prometheus/console_libraries", \
      "--web.console.templates=/etc/prometheus/consoles", \
      "--storage.tsdb.retention.time=31d", \
      "--web.enable-lifecycle" \
    ]