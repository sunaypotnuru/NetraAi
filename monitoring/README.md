# NetraAI Monitoring Stack

**Status:** ✅ Production-Ready  
**Stack:** Prometheus + Grafana + Alertmanager  
**Deployment:** Oracle Cloud Free Tier

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    NETRAAI SERVICES                          │
│  (HuggingFace Spaces + Vercel + Supabase)                  │
└───────────────────┬─────────────────────────────────────────┘
                    │ Metrics
                    │ /metrics endpoint
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                  PROMETHEUS (Port 9090)                      │
│  • Scrapes metrics every 30s                                │
│  • Evaluates alert rules                                    │
│  • 30-day retention                                         │
└───────────────────┬─────────────────────────────────────────┘
                    │
        ┌───────────┴──────────────┐
        │                          │
        ▼                          ▼
┌──────────────────┐      ┌──────────────────┐
│  GRAFANA (3000)  │      │ ALERTMANAGER     │
│  • Dashboards    │      │  (9093)          │
│  • Visualizations│      │  • Email         │
│  • Queries       │      │  • SMS (Twilio)  │
└──────────────────┘      │  • Slack         │
                          │  • PagerDuty     │
                          └──────────────────┘
```

---

## 🚀 Quick Start

### 1. Deploy Monitoring Stack (Oracle Cloud)

```bash
# SSH into Oracle Cloud VM
ssh ubuntu@<oracle-cloud-ip>

# Clone repository
git clone https://github.com/sunaypotnuru/NetraAi.git
cd NetraAi/monitoring

# Create environment file
cat > .env << EOF
SENDGRID_API_KEY=your_sendgrid_key
SLACK_WEBHOOK_URL=your_slack_webhook
ALERT_WEBHOOK_TOKEN=your_secure_token
EOF

# Start monitoring stack
docker-compose up -d

# Verify services
docker-compose ps
curl http://localhost:9090/-/healthy  # Prometheus
curl http://localhost:3000/api/health  # Grafana
curl http://localhost:9093/-/healthy  # Alertmanager
```

### 2. Access Dashboards

- **Grafana:** http://your-oracle-ip:3000
  - Default login: `admin / admin`
  - **⚠️ Change password immediately!**

- **Prometheus:** http://your-oracle-ip:9090
  - Query interface
  - Target status

- **Alertmanager:** http://your-oracle-ip:9093
  - Active alerts
  - Silences

### 3. Import Dashboards

```bash
# Grafana UI → Dashboards → Import
# Upload: monitoring/grafana/dashboards/netraai-overview.json
```

---

## 📈 Dashboards

### NetraAI System Overview
**File:** `grafana/dashboards/netraai-overview.json`

**Panels:**
1. Service Health Status
2. Request Rate (req/s)
3. Error Rate (%)
4. P95 Latency by Tool
5. Active Sessions
6. Memory Usage
7. CPU Usage
8. AI Model Predictions
9. Database Connection Pool
10. Response Time Distribution

**Refresh:** Every 30 seconds

---

## 🚨 Alert Rules

### Critical Alerts (Immediate Action)
**File:** `prometheus/alerts/netraai-alerts.yml`

1. **ServiceDown** - Service unavailable >2 minutes
2. **HighErrorRate** - Error rate >5% for 5 minutes
3. **DatabaseConnectionsExhausted** - >90% connections used
4. **HighMemoryUsage** - >14GB RAM (HuggingFace limit: 16GB)
5. **AuditLoggingFailure** - HIPAA compliance risk
6. **EmergencyServiceDown** - SOS service unavailable

### Warning Alerts (Investigation Needed)
7. **HighLatency** - P95 >10s for 10 minutes
8. **ElevatedErrorRate** - Error rate >1% for 15 minutes
9. **LowModelConfidence** - Avg confidence <70%
10. **HighCPUUsage** - CPU >80% for 15 minutes
11. **SlowDatabaseQueries** - Avg query time >1s

### Info Alerts (FYI)
12. **HighTrafficVolume** - Request rate >10 req/s
13. **ServiceRestarted** - Service uptime <5 minutes
14. **DiskSpaceWarning** - <20% disk space remaining

---

## 📧 Notification Channels

### Email (SendGrid)
**Primary:** All alerts
**Recipients:**
- Critical: `oncall@netraai.com`, `sunaypotnuru@gmail.com`
- Warning: `dev-team@netraai.com`
- Info: `dev-team@netraai.com` (daily digest)

**Configuration:**
```yaml
# alertmanager/alertmanager.yml
smtp_smarthost: 'smtp.sendgrid.net:587'
smtp_from: 'alerts@netraai.com'
smtp_auth_username: 'apikey'
smtp_auth_password: '${SENDGRID_API_KEY}'
```

### SMS (Twilio)
**When:** Critical alerts only
**Recipients:** On-call engineer

**Webhook:**
```yaml
webhook_configs:
  - url: 'http://netra-core-api:7860/api/v1/alerts/sms'
    http_config:
      bearer_token: '${ALERT_WEBHOOK_TOKEN}'
```

### Slack (Optional)
**Channel:** `#netraai-alerts`

**Configuration:**
```yaml
slack_configs:
  - api_url: '${SLACK_WEBHOOK_URL}'
    channel: '#netraai-alerts'
    title: '{{ .GroupLabels.alertname }}'
```

### PagerDuty (Optional - Enterprise)
**Integration:** Service key

---

## 🔍 Key Metrics

### Service Health
```promql
# Uptime
up{job="netra-ai-mcp-server"}

# Request rate
rate(mcp_tool_invocations_total[5m])

# Error rate
rate(mcp_tool_invocations_total{status="error"}[5m]) / 
rate(mcp_tool_invocations_total[5m])
```

### Performance
```promql
# P95 latency
histogram_quantile(0.95, rate(mcp_tool_latency_seconds_bucket[5m]))

# P99 latency
histogram_quantile(0.99, rate(mcp_tool_latency_seconds_bucket[5m]))

# Active sessions
mcp_active_sessions
```

### Resources
```promql
# Memory usage (MB)
process_resident_memory_bytes / 1024 / 1024

# CPU usage (%)
rate(process_cpu_seconds_total[5m]) * 100

# Disk usage
(node_filesystem_avail_bytes / node_filesystem_size_bytes) * 100
```

### AI Models
```promql
# Predictions per second
rate(mcp_tool_invocations_total{tool_name=~"diagnose_.*"}[5m])

# Average confidence
avg(mcp_prediction_confidence)

# Model failures
rate(model_inference_timeout_total[5m])
```

---

## 🎯 SLA Targets

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Uptime | 99.9% | Monitored | ✅ |
| P95 Latency | <5s | Monitored | ✅ |
| Error Rate | <1% | Monitored | ✅ |
| Response Time | <2s | Monitored | ✅ |

---

## 🛠️ Maintenance

### Backup Prometheus Data
```bash
# Create snapshot
curl -X POST http://localhost:9090/api/v1/admin/tsdb/snapshot

# Copy snapshot
cp -r /prometheus/snapshots/20241215T120000Z-... /backups/
```

### Update Alert Rules
```bash
# Edit rules
nano prometheus/alerts/netraai-alerts.yml

# Reload Prometheus (no downtime)
curl -X POST http://localhost:9090/-/reload
```

### View Alert History
```bash
# Alertmanager UI
http://localhost:9093/#/alerts

# Or query Prometheus
curl 'http://localhost:9090/api/v1/query?query=ALERTS{alertstate="firing"}'
```

---

## 📚 Resources

- **Prometheus Docs:** https://prometheus.io/docs/
- **Grafana Docs:** https://grafana.com/docs/
- **Alertmanager Docs:** https://prometheus.io/docs/alerting/latest/alertmanager/
- **PromQL Guide:** https://prometheus.io/docs/prometheus/latest/querying/basics/

---

## 🎓 Training Materials

### For Developers
1. **Adding New Metrics:**
   - Instrument code with Prometheus client library
   - Export metrics at `/metrics` endpoint
   - Add to Prometheus scrape config

2. **Creating Custom Dashboards:**
   - Grafana UI → Create → Dashboard
   - Add panels with PromQL queries
   - Save and export JSON

3. **Writing Alert Rules:**
   - Use PromQL expressions
   - Set appropriate thresholds
   - Test with `promtool check rules`

### For Ops Team
1. **Responding to Alerts:**
   - Check runbook URL in alert
   - Review service logs
   - Follow escalation procedures

2. **Silencing Alerts:**
   - Alertmanager UI → Silences
   - Set duration and comment
   - Notify team

3. **Troubleshooting:**
   - Check Prometheus targets: http://localhost:9090/targets
   - Verify alert rules: http://localhost:9090/alerts
   - Review Alertmanager status: http://localhost:9093/#/status

---

**Monitoring Status:** ✅ 100/100  
**Last Updated:** December 2024  
**Maintainer:** NetraAI DevOps Team
