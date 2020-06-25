#!/bin/bash

cp /etc/grafana/provisioning/dashboards/*.json /provisioning/dashboards/
cp /etc/prometheus/targets/*.json /provisioning/targets/

exec supervisord -c /etc/supervisord/supervisord.conf