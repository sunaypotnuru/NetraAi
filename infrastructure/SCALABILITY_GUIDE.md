# NetraAI Scalability Guide
## From Free Tier to Enterprise Scale

**Current Status:** 70/100 (Free Tier Limits)  
**Target:** 100/100 (Production Ready)  
**Timeline:** Phased approach (3 tiers)

---

## 📊 Current Architecture Limitations

### Free Tier Constraints

| Service | Current Limit | Bottleneck | Impact |
|---------|--------------|------------|---------|
| HuggingFace Spaces | 16GB RAM, 2 vCPU | Memory, CPU | Service sleep after 48h inactivity |
| Supabase | 500MB DB, 1GB storage | Database size | Limited patient records |
| Vercel | 100GB bandwidth/month | Traffic | ~10K monthly visitors max |
| Groq API | 1,000 req/day | AI requests | ~42 req/hour limit |
| Google Maps | $200 credit/month | Location queries | ~40K requests |

### Scaling Issues
1. **No Horizontal Scaling:** Single instance per service
2. **No Load Balancing:** Direct traffic to single endpoint
3. **No Auto-Scaling:** Manual intervention required
4. **No CDN:** Static assets served from origin
5. **No Caching Layer:** Every request hits backend
6. **No Rate Limiting (AI):** Can exhaust API quotas quickly

**Current Capacity:** ~100 concurrent users, ~1,000 daily active users

---

## 🎯 Scalability Tiers

### Tier 1: Optimized Free Tier (0-1,000 DAU)
**Cost:** $0/month  
**Timeline:** 1 week  
**Effort:** Low

**Improvements:**
1. **Redis Caching** ✅ Already implemented
2. **Database Connection Pooling** ✅ Supabase handles
3. **Static Asset Optimization** - Add CDN
4. **Response Compression** - Enable gzip
5. **API Response Caching** - Cache frequent queries

**Capacity:** 100 concurrent users → **500 concurrent users**

### Tier 2: Production Ready (1,000-10,000 DAU)
**Cost:** ~$124/month  
**Timeline:** 2 weeks  
**Effort:** Medium

**Upgrades:**
1. **HuggingFace Pro** ($5/space × 10) = $50/month
   - No sleep
   - Persistent GPU option
   - 4 vCPU, 32GB RAM

2. **Supabase Pro** = $25/month
   - 8GB database
   - 100GB storage
   - Daily backups
   - Point-in-time recovery

3. **Vercel Pro** = $20/month
   - Unlimited bandwidth
   - Analytics
   - Custom domains

4. **LiveKit Pro** = $29/month
   - 100 hours video included
   - Better quality
   - Recording storage

**Capacity:** 500 concurrent users → **5,000 concurrent users**

### Tier 3: Enterprise Scale (10,000+ DAU)
**Cost:** ~$750-2,000/month  
**Timeline:** 1-2 months  
**Effort:** High

**Infrastructure:**
1. **Kubernetes Cluster** (AWS EKS/GKE)
2. **Load Balancers** (AWS ALB)
3. **Auto-Scaling Groups**
4. **Managed Database** (AWS RDS PostgreSQL)
5. **CDN** (CloudFront/Cloudflare)
6. **API Gateway** (Kong/AWS API Gateway)

**Capacity:** 5,000 concurrent users → **50,000+ concurrent users**

---

## 🚀 Tier 1: Optimization (Free Tier)

### 1. Enable Response Compression

**Backend (FastAPI):**
```python
# backend/core/app/main.py
from fastapi.middleware.gzip import GZipMiddleware

app.add_middleware(GZipMiddleware, minimum_size=1000)
```

**Impact:** 70% reduction in response size

### 2. API Response Caching

**Redis Cache Layer:**
```python
# backend/core/app/utils/cache.py
import redis
import json
from functools import wraps

redis_client = redis.Redis(host='localhost', port=6379, decode_responses=True)

def cached(ttl=300):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key from function name + args
            cache_key = f"{func.__name__}:{json.dumps(args)}:{json.dumps(kwargs)}"
            
            # Check cache
            cached_result = redis_client.get(cache_key)
            if cached_result:
                return json.loads(cached_result)
            
            # Execute function
            result = await func(*args, **kwargs)
            
            # Store in cache
            redis_client.setex(cache_key, ttl, json.dumps(result))
            
            return result
        return wrapper
    return decorator

# Usage:
@router.get("/doctors")
@cached(ttl=600)  # Cache for 10 minutes
async def get_doctors():
    # ...
```

**Impact:** 80% reduction in database queries

### 3. Database Query Optimization

**Add Indexes:**
```sql
-- backend/database/migrations/add_indexes.sql

-- User lookups
CREATE INDEX idx_users_email ON auth.users(email);
CREATE INDEX idx_users_role ON profiles_patient(role);

-- Appointment queries
CREATE INDEX idx_appointments_doctor_date ON appointments(doctor_id, appointment_date);
CREATE INDEX idx_appointments_patient_status ON appointments(patient_id, status);

-- Scan history
CREATE INDEX idx_scans_patient_created ON scans(patient_id, created_at DESC);

-- Messages
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
```

**Impact:** 90% faster queries

### 4. Static Asset CDN

**Vercel Automatic CDN:**
```json
// frontend/vercel.json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/(.*)\\.(?:jpg|jpeg|png|gif|svg|webp)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=2592000"
        }
      ]
    }
  ]
}
```

**Impact:** 50% reduction in origin requests

### 5. AI Request Batching

**Batch Multiple Predictions:**
```python
# backend/mcp-server/utils/batch.py
import asyncio
from typing import List

class PredictionBatcher:
    def __init__(self, max_batch_size=10, max_wait_time=1.0):
        self.max_batch_size = max_batch_size
        self.max_wait_time = max_wait_time
        self.queue = []
        self.processing = False
    
    async def add_request(self, request):
        self.queue.append(request)
        
        if len(self.queue) >= self.max_batch_size:
            await self._process_batch()
        elif not self.processing:
            asyncio.create_task(self._wait_and_process())
    
    async def _wait_and_process(self):
        self.processing = True
        await asyncio.sleep(self.max_wait_time)
        if self.queue:
            await self._process_batch()
        self.processing = False
    
    async def _process_batch(self):
        batch = self.queue[:self.max_batch_size]
        self.queue = self.queue[self.max_batch_size:]
        
        # Process batch in parallel
        results = await asyncio.gather(*[
            process_single(req) for req in batch
        ])
        
        return results
```

**Impact:** 60% reduction in API calls

---

## 🎯 Tier 2: Production Upgrades

### 1. HuggingFace Pro Upgrade

**Benefits:**
- No sleep (always-on)
- 4 vCPU, 32GB RAM
- Persistent GPU option ($60/month additional)
- Better performance
- Custom domain support

**Migration:**
```bash
# 1. Upgrade each space in HuggingFace UI
# Settings → Upgrade to Pro

# 2. Restart spaces for new resources
curl -X POST https://api-inference.huggingface.co/restart \
  -H "Authorization: Bearer $HF_TOKEN"

# 3. Update environment variables
# Add GPU support if needed:
CUDA_VISIBLE_DEVICES=0
```

### 2. Supabase Pro Upgrade

**Benefits:**
- 8GB database (16x increase)
- 100GB storage (100x increase)
- Daily backups (vs weekly)
- Point-in-time recovery
- Better performance
- Priority support

**Migration:**
```bash
# 1. Upgrade in Supabase dashboard
# Project Settings → Billing → Upgrade to Pro

# 2. Enable point-in-time recovery
# Project Settings → Database → Enable PITR

# 3. Configure backups
# Project Settings → Backups → Enable daily
```

### 3. Horizontal Scaling Preparation

**Load Balancer Configuration:**
```yaml
# infrastructure/kubernetes/load-balancer.yaml
apiVersion: v1
kind: Service
metadata:
  name: netra-core-api
spec:
  type: LoadBalancer
  selector:
    app: netra-core-api
  ports:
    - protocol: TCP
      port: 80
      targetPort: 7860
  sessionAffinity: ClientIP
```

### 4. Auto-Scaling Configuration

**Kubernetes Horizontal Pod Autoscaler:**
```yaml
# infrastructure/kubernetes/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: netra-core-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: netra-core-api
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

### 5. Database Connection Pooling

**PgBouncer Configuration:**
```ini
# infrastructure/database/pgbouncer.ini
[databases]
postgres = host=db.supabase.co port=5432 dbname=postgres

[pgbouncer]
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 20
reserve_pool_size = 5
reserve_pool_timeout = 3
max_db_connections = 100
```

---

## 🏢 Tier 3: Enterprise Architecture

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE CDN                            │
│  • DDoS Protection • WAF • Global CDN • Edge Caching        │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│               AWS APPLICATION LOAD BALANCER                  │
│  • SSL Termination • Health Checks • Path Routing           │
└───────────────────────────┬─────────────────────────────────┘
                            │
                ┌───────────┴──────────┐
                │                      │
                ▼                      ▼
┌───────────────────────┐   ┌──────────────────────┐
│   FRONTEND (S3+CF)    │   │  API GATEWAY (Kong)  │
│   React Static Site   │   │  Rate Limit │ Auth   │
└───────────────────────┘   └──────────┬───────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
                    ▼                  ▼                  ▼
        ┌───────────────────┐ ┌───────────────────┐ ┌──────────────┐
        │   CORE API (EKS)  │ │  AI SERVICES(EKS) │ │  MCP (EKS)   │
        │   • 3+ replicas   │ │  • GPU nodes      │ │  • 2+ replicas│
        │   • Auto-scaling  │ │  • Model cache    │ │  • Stateless │
        └─────────┬─────────┘ └─────────┬─────────┘ └──────┬───────┘
                  │                     │                   │
                  └──────────┬──────────┴───────────────────┘
                             │
                             ▼
                ┌────────────────────────┐
                │   ELASTICACHE REDIS    │
                │   • Cluster mode       │
                │   • Multi-AZ           │
                └────────────────────────┘
                             │
                             ▼
                ┌────────────────────────┐
                │   RDS POSTGRESQL       │
                │   • Multi-AZ           │
                │   • Read replicas      │
                │   • Automated backups  │
                └────────────────────────┘
```

### 1. Kubernetes Deployment

**Infrastructure as Code (Terraform):**
```hcl
# infrastructure/terraform/eks.tf
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "19.0"

  cluster_name    = "netraai-production"
  cluster_version = "1.28"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  eks_managed_node_groups = {
    general = {
      desired_size = 3
      min_size     = 2
      max_size     = 10

      instance_types = ["t3.large"]
      capacity_type  = "ON_DEMAND"
    }

    gpu = {
      desired_size = 2
      min_size     = 1
      max_size     = 5

      instance_types = ["p3.2xlarge"]  # GPU for AI models
      capacity_type  = "SPOT"
      
      taints = [{
        key    = "nvidia.com/gpu"
        value  = "true"
        effect = "NoSchedule"
      }]
    }
  }
}
```

### 2. Service Mesh (Istio)

**Benefits:**
- mTLS between services
- Traffic management
- Observability
- Resilience (retries, timeouts, circuit breakers)

**Installation:**
```bash
# Install Istio
istioctl install --set profile=production

# Enable sidecar injection
kubectl label namespace default istio-injection=enabled

# Deploy VirtualService for canary deployment
kubectl apply -f infrastructure/istio/virtual-service.yaml
```

### 3. Database Scaling

**Read Replicas:**
```hcl
# infrastructure/terraform/rds.tf
resource "aws_db_instance" "postgres_replica" {
  count                   = 2
  replicate_source_db     = aws_db_instance.postgres_primary.id
  instance_class          = "db.r6g.xlarge"
  publicly_accessible     = false
  skip_final_snapshot     = false
  final_snapshot_identifier = "netraai-replica-${count.index}-final"
}
```

**Connection Routing:**
```python
# backend/core/app/db/connection.py
from sqlalchemy import create_engine
from random import choice

PRIMARY_DB = "postgresql://primary-endpoint"
READ_REPLICAS = [
    "postgresql://replica-1-endpoint",
    "postgresql://replica-2-endpoint",
]

def get_write_engine():
    return create_engine(PRIMARY_DB)

def get_read_engine():
    return create_engine(choice(READ_REPLICAS))
```

### 4. CDN & Edge Computing

**Cloudflare Workers (Edge Functions):**
```javascript
// infrastructure/cloudflare/worker.js
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
  const cache = caches.default
  
  // Check cache first
  let response = await cache.match(request)
  
  if (!response) {
    // Fetch from origin
    response = await fetch(request)
    
    // Cache GET requests for 1 hour
    if (request.method === 'GET') {
      response = new Response(response.body, response)
      response.headers.set('Cache-Control', 'max-age=3600')
      event.waitUntil(cache.put(request, response.clone()))
    }
  }
  
  return response
}
```

### 5. Monitoring & Observability

**Distributed Tracing (Jaeger):**
```python
# backend/core/app/tracing.py
from opentelemetry import trace
from opentelemetry.exporter.jaeger import JaegerExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

def setup_tracing():
    trace.set_tracer_provider(TracerProvider())
    jaeger_exporter = JaegerExporter(
        agent_host_name="jaeger",
        agent_port=6831,
    )
    trace.get_tracer_provider().add_span_processor(
        BatchSpanProcessor(jaeger_exporter)
    )

tracer = trace.get_tracer(__name__)

# Usage in routes:
@router.post("/predict")
@tracer.start_as_current_span("predict_anemia")
async def predict(image: UploadFile):
    # ... prediction logic
```

---

## 📊 Performance Benchmarks

### Current Performance (Free Tier)

| Metric | Current | Target Tier 2 | Target Tier 3 |
|--------|---------|---------------|---------------|
| Concurrent Users | 100 | 5,000 | 50,000 |
| Requests/second | 10 | 500 | 5,000 |
| P95 Latency | 2s | 500ms | 100ms |
| Uptime | 99% | 99.9% | 99.99% |
| Database Connections | 20 | 200 | 2,000 |
| AI Predictions/day | 1,000 | 50,000 | 500,000 |

### Load Testing

**k6 Load Test Script:**
```javascript
// infrastructure/load-tests/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 },  // Ramp to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 for 5m
    { duration: '2m', target: 500 },  // Ramp to 500 users
    { duration: '5m', target: 500 },  // Stay at 500 for 5m
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% under 2s
    http_req_failed: ['rate<0.01'],     // <1% failures
  },
};

export default function () {
  let res = http.get('https://netra-core-api.hf.space/health');
  check(res, { 'status was 200': (r) => r.status == 200 });
  sleep(1);
}
```

**Run Load Test:**
```bash
k6 run infrastructure/load-tests/load-test.js
```

---

## 💰 Cost Optimization

### Cost Breakdown (Enterprise)

| Service | Cost/Month | Purpose |
|---------|-----------|----------|
| AWS EKS | $150 | Kubernetes cluster |
| EC2 Instances (t3.large × 3) | $180 | General compute |
| EC2 GPU (p3.2xlarge × 2 spot) | $300 | AI inference |
| RDS PostgreSQL (db.r6g.xlarge) | $250 | Primary database |
| RDS Read Replicas (× 2) | $400 | Read scaling |
| ElastiCache Redis | $100 | Caching layer |
| ALB | $25 | Load balancing |
| CloudFront | $50 | CDN |
| S3 Storage | $20 | Static assets |
| **Total** | **$1,475/month** | |

### Cost Optimization Strategies

1. **Use Spot Instances for AI:** 70% savings
2. **Reserved Instances:** 40% savings (1-year commitment)
3. **S3 Intelligent-Tiering:** Automatic cost optimization
4. **Right-sizing:** Monitor and adjust instance sizes
5. **Autoscaling:** Scale down during off-peak hours

**Optimized Cost:** ~$750-900/month

---

## 🎯 Migration Checklist

### Phase 1: Optimization (Week 1)
- [ ] Enable response compression
- [ ] Implement Redis caching
- [ ] Add database indexes
- [ ] Configure CDN headers
- [ ] Enable connection pooling

### Phase 2: Pro Tier (Week 2-3)
- [ ] Upgrade HuggingFace Spaces to Pro
- [ ] Upgrade Supabase to Pro
- [ ] Upgrade Vercel to Pro
- [ ] Upgrade LiveKit to Pro
- [ ] Enable daily backups

### Phase 3: Kubernetes (Month 2)
- [ ] Set up AWS/GCP account
- [ ] Deploy Terraform infrastructure
- [ ] Migrate services to Kubernetes
- [ ] Configure auto-scaling
- [ ] Set up monitoring (Prometheus/Grafana)
- [ ] Implement service mesh
- [ ] Load testing and optimization

---

## 📈 Scalability Scorecard

### Current: 70/100

- **Infrastructure:** 60/100 (Single instance, no redundancy)
- **Performance:** 70/100 (Acceptable for MVP)
- **Reliability:** 70/100 (Basic health checks)
- **Capacity:** 70/100 (Limited by free tier)
- **Cost Efficiency:** 90/100 (Free tier optimized)

### Target (Tier 2): 90/100

- **Infrastructure:** 85/100 (Pro tier, better resources)
- **Performance:** 90/100 (Improved latency)
- **Reliability:** 90/100 (No sleep, better uptime)
- **Capacity:** 90/100 (10x capacity increase)
- **Cost Efficiency:** 80/100 (Good value for scale)

### Target (Tier 3): 100/100

- **Infrastructure:** 100/100 (Multi-AZ, redundant)
- **Performance:** 100/100 (Sub-100ms latency)
- **Reliability:** 100/100 (99.99% uptime SLA)
- **Capacity:** 100/100 (Unlimited scaling)
- **Cost Efficiency:** 70/100 (Higher cost, but justified)

---

**Document Owner:** DevOps Team  
**Last Updated:** December 2024  
**Next Review:** Quarterly (based on growth)  
**Status:** ✅ Ready for Tier 2 Migration
