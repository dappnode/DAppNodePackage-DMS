ARG UPSTREAM_VERSION_PROMETHEUS

FROM prom/prometheus:${UPSTREAM_VERSION_PROMETHEUS}

COPY prometheus.yml /etc/prometheus/

ENTRYPOINT [ "sh","-c","/bin/prometheus --config.file=/etc/prometheus/prometheus.yml \ 
    --storage.tsdb.path=/prometheus \
    --web.console.libraries=/usr/share/prometheus/console_libraries  \ 
    --storage.tsdb.retention.time=${DATA_RETENTION_DAYS}d" ]
