import os
from datetime import datetime, timezone
from typing import Optional, Dict
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastmcp import FastMCP, Context

# Tool imports
from tools.anemia import diagnose_anemia
from tools.cataract import detect_cataract
from tools.dr import screen_diabetic_retinopathy
from tools.mental_health import analyze_mental_health
from tools.parkinsons import screen_parkinsons
from tools.fhir_ops import get_patient_fhir, query_patient_timeline
from tools.comparison import compare_diagnostic_history
from tools.prior_auth import generate_prior_auth
from tools.workflow import orchestrate_screening_workflow

# A2A / Prompt Opinion Utilities
from utils.agent_card import get_agent_card

# Load environment variables first
load_dotenv()

# ── Sentry (optional monitoring) ─────────────────────────────────────────────
# NOTE: sentry_sdk auto-patches httpx which conflicts with supabase-py.
# We defer the import until AFTER the Supabase client is initialised at
# startup, and we explicitly disable the HttpxIntegration so it does not
# monkey-patch the transport layer.
_sentry_initialized = False


def _init_sentry_safe():
    """
    Initialise Sentry without the HttpxIntegration that breaks supabase-py.
    Called lazily after the event-loop is running to avoid patching httpcore
    during module import.
    """
    global _sentry_initialized
    if _sentry_initialized:
        return
    sentry_dsn = os.getenv("SENTRY_DSN")
    if not sentry_dsn:
        return
    try:
        import sentry_sdk
        from sentry_sdk.integrations.logging import LoggingIntegration
        import logging

        sentry_sdk.init(
            dsn=sentry_dsn,
            traces_sample_rate=float(os.getenv("SENTRY_TRACES_RATE", "0.2")),
            environment=os.getenv("ENVIRONMENT", "development"),
            # Explicitly list integrations — omit HttpxIntegration to prevent
            # it from monkey-patching httpcore used by supabase-py.
            default_integrations=False,
            integrations=[
                LoggingIntegration(level=logging.WARNING, event_level=logging.ERROR),
            ],
        )
        _sentry_initialized = True
        print(
            "Sentry initialized (HttpxIntegration disabled for Supabase compatibility)."
        )
    except Exception as e:
        print(f"Sentry init skipped: {e}")


# ── FastMCP server ────────────────────────────────────────────────────────────
mcp = FastMCP(
    name=os.getenv("MCP_SERVER_NAME", "NetraAI Diagnostic Engine"),
    version=os.getenv("MCP_SERVER_VERSION", "1.0.0"),
)

# SHARP-on-MCP: Capability advertisement is handled via the patched_init_options 
# in the create_app() factory below to ensure compatibility with Prompt Opinion.


# ── FastMCP tool registrations ────────────────────────────────────────────────
@mcp.tool()
async def health_check_tool() -> dict:
    return {"status": "healthy", "server": "NetraAI MCP Server"}


@mcp.tool()
async def diagnose_anemia_tool(
    ctx: Context, image_url: str, patient_id: Optional[str] = None
) -> dict:
    return await diagnose_anemia(ctx=ctx, image_url=image_url, patient_id=patient_id)


@mcp.tool()
async def detect_cataract_tool(
    ctx: Context, image_url: str, patient_id: Optional[str] = None
) -> dict:
    return await detect_cataract(ctx=ctx, image_url=image_url, patient_id=patient_id)


@mcp.tool()
async def screen_dr_tool(
    ctx: Context, image_url: str, patient_id: Optional[str] = None
) -> dict:
    return await screen_diabetic_retinopathy(
        ctx=ctx, image_url=image_url, patient_id=patient_id
    )


@mcp.tool()
async def analyze_mental_health_tool(
    ctx: Context, audio_url: str, patient_id: Optional[str] = None
) -> dict:
    return await analyze_mental_health(
        ctx=ctx, audio_url=audio_url, patient_id=patient_id
    )


@mcp.tool()
async def screen_parkinsons_tool(
    ctx: Context, audio_url: str, patient_id: Optional[str] = None
) -> dict:
    return await screen_parkinsons(ctx=ctx, audio_url=audio_url, patient_id=patient_id)


@mcp.tool()
async def get_patient_fhir_tool(ctx: Context, patient_id: str) -> dict:
    return await get_patient_fhir(ctx, patient_id)


@mcp.tool()
async def query_patient_timeline_tool(
    ctx: Context, patient_id: str, resource_type: str = "Observation"
) -> dict:
    return await query_patient_timeline(ctx, patient_id, resource_type)

@mcp.tool(name="get_patient_vitals_tool")
async def get_patient_vitals_tool(patient_id: str, ctx: Context) -> Dict:
    """Add BP/Heart Rate to patient."""
    return await query_patient_timeline(ctx, patient_id, "Observation", limit=5)

@mcp.tool(name="get_medical_history_tool")
async def get_medical_history_tool(patient_id: str, ctx: Context) -> Dict:
    """Summarize patient's medical history."""
    return await query_patient_timeline(ctx, patient_id, "DiagnosticReport", limit=10)

@mcp.tool(name="get_lab_results_tool")
async def get_lab_results_tool(patient_id: str, ctx: Context) -> Dict:
    """Show recent lab results."""
    return await query_patient_timeline(ctx, patient_id, "Observation", limit=10)

@mcp.tool(name="get_medications_tool")
async def get_medications_tool(patient_id: str, ctx: Context) -> Dict:
    """Check current medications."""
    return await query_patient_timeline(ctx, patient_id, "MedicationStatement", limit=5)

@mcp.tool(name="get_conditions_tool")
async def get_conditions_tool(patient_id: str, ctx: Context) -> Dict:
    """List all active conditions."""
    return await query_patient_timeline(ctx, patient_id, "Condition", limit=5)



@mcp.tool()
async def compare_diagnostic_history_tool(
    ctx: Context, patient_id: str, diagnostic_type: str
) -> dict:
    return await compare_diagnostic_history(ctx, diagnostic_type, patient_id)


@mcp.tool()
async def generate_prior_auth_tool(
    ctx: Context, patient_id: str, service_requested: str, diagnostic_type: str
) -> dict:
    return await generate_prior_auth(
        ctx=ctx,
        service_requested=service_requested,
        diagnostic_type=diagnostic_type,
        patient_id=patient_id,
    )


@mcp.tool()
async def orchestrate_screening_workflow_tool(
    ctx: Context,
    chief_complaint: str,
    patient_id: Optional[str] = None,
    input_data: Optional[Dict] = None,
) -> dict:
    return await orchestrate_screening_workflow(
        ctx=ctx,
        chief_complaint=chief_complaint,
        patient_id=patient_id,
        input_data=input_data or {},
    )


# ── FastAPI bridge app ────────────────────────────────────────────────────────
def create_app():
    from fastapi import FastAPI, Request
    from fastapi.responses import JSONResponse
    from fastapi.middleware.cors import CORSMiddleware
    from starlette.middleware.trustedhost import TrustedHostMiddleware
    import re
    import uuid
    from collections import defaultdict
    from datetime import timedelta

    # Create FastMCP ASGI app using legacy SSE transport.
    # Prompt Opinion / most MCP clients use the classic two-endpoint SSE protocol:
    #   GET  /mcp/sse      → opens the event stream
    #   POST /mcp/messages → receives JSON-RPC messages
    # The newer 'streamable-http' transport requires a session handshake (session ID)
    # which causes the "Missing session ID" 400 error from external validators.
    mcp_asgi = mcp.http_app(path="/", transport="streamable-http")

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        # Initialise Sentry safely
        _init_sentry_safe()
        # Run FastMCP's lifespan context to initialize task groups
        async with mcp_asgi.router.lifespan_context(app):
            yield

    fastapi_app = FastAPI(
        title="NetraAI MCP Bridge", version="2.0.0", lifespan=lifespan
    )

    # Global request logs for debugging connection issues
    if not hasattr(fastapi_app.state, "request_logs"):
        fastapi_app.state.request_logs = []

    @fastapi_app.middleware("http")
    async def log_requests(request: Request, call_next):
        from datetime import datetime
        method = request.method
        path = request.url.path
        headers = {}
        for k, v in request.headers.items():
            if k.lower() in ["authorization", "x-api-key", "cookie", "proxy-authorization"]:
                headers[k] = "[REDACTED]"
            else:
                headers[k] = v
        
        if "/health" not in path and "/debug/logs" not in path:
            fastapi_app.state.request_logs.append({
                "method": method,
                "path": path,
                "headers": headers,
                "timestamp": datetime.now().isoformat()
            })
            if len(fastapi_app.state.request_logs) > 50:
                fastapi_app.state.request_logs.pop(0)
        
        return await call_next(request)

    @fastapi_app.get("/debug/logs")
    async def get_debug_logs():
        return fastapi_app.state.request_logs

    # ── FHIR Context Extension Support ──
    # Register support for PromptOpinion's FHIR context extension.
    # This enables the marketplace to pass X-FHIR-Server-URL and other headers.
    try:
        original_init_options = mcp._mcp_server.create_initialization_options

        def patched_init_options():
            options = original_init_options()
            # Add the extension declaration required by Prompt Opinion
            options.capabilities.extensions["ai.promptopinion/fhir-context"] = {
                "scopes": [
                    {"name": "patient/Patient.rs", "required": True},
                    {"name": "patient/Observation.rs", "required": True},
                    {"name": "patient/Condition.rs", "required": False},
                ]
            }
            return options

        # Apply the patch to the underlying MCP server instance
        mcp._mcp_server.create_initialization_options = patched_init_options
    except Exception as e:
        print(f"Warning: Could not register FHIR extension: {e}")

    # ── Root Endpoint ──
    @fastapi_app.get("/")
    async def root():
        """Root endpoint for Hugging Face dashboard visibility"""
        return {
            "service": "NetraAI MCP Bridge",
            "version": "2.0.0",
            "status": "operational",
            "environment": os.getenv("ENVIRONMENT", "not-set"),  # Debug info
            "endpoints": {
                "/health": "Health check",
                "/mcp": "FastMCP ASGI bridge",
                "/.well-known/agent-card.json": "Agent card",
                "/v1/chat/completions": "A2A chat completions",
                "/rpc": "A2A JSON-RPC",
            },
        }

    # ── Immediate Health Check ──
    @fastapi_app.get("/health")
    async def health():
        """Standard health check endpoint for Render/Uptime Monitoring"""
        return {
            "status": "healthy",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "service": "netra-ai-mcp-server",
            "region": os.getenv("RENDER_REGION", "unknown"),
        }

    # ── Debug Endpoint for Environment ──
    @fastapi_app.get("/debug/env")
    async def debug_env():
        """Debug endpoint to check environment variables"""
        return {
            "ENVIRONMENT": os.getenv("ENVIRONMENT", "NOT_SET"),
            "PORT": os.getenv("PORT", "NOT_SET"),
            "HOST": os.getenv("HOST", "NOT_SET"),
        }

    # ── A2A Discovery Endpoints ──
    @fastapi_app.get("/.well-known/agent-card.json")
    @fastapi_app.get("/v1/card")
    async def agent_card():
        """A2A v1.0 compliant agent card for discovery"""
        return get_agent_card()

    # ── A2A Interaction Endpoints ──
    @fastapi_app.post("/v1/chat/completions")
    async def chat_completions(request: Request):
        """OpenAI-compatible chat completions interface for A2A with SHARP context support"""
        body = await request.json()
        messages = body.get("messages", [])

        if not messages:
            return JSONResponse({"error": "No messages provided"}, status_code=400)

        last_message = messages[-1].get("content", "")

        # 💎 EXTRACT IMAGE/AUDIO URL from message (Robustness for A2A/POP)
        # Search for common image/audio patterns in the text if not provided in metadata
        input_data = {}
        url_match = re.search(r'(https?://\S+\.(?:jpg|jpeg|png|webp|wav|mp3|ogg))', last_message, re.I)
        if url_match:
            url = url_match.group(1)
            if any(ext in url.lower() for ext in ['.jpg', '.jpeg', '.png', '.webp']):
                input_data["image_url"] = url
            elif any(ext in url.lower() for ext in ['.wav', '.mp3', '.ogg']):
                input_data["audio_url"] = url

        # 💎 EXTRACT SHARP CONTEXT from headers
        fhir_server = request.headers.get("X-FHIR-Server-URL")
        fhir_token = request.headers.get("X-FHIR-Access-Token")
        patient_id = request.headers.get("X-Patient-ID")

        # Use orchestrator to handle the request with FHIR context and extracted media
        result = await orchestrate_screening_workflow(
            ctx=None,
            chief_complaint=last_message,
            patient_id=patient_id,
            input_data=input_data,
            fhir_server=fhir_server,
            fhir_token=fhir_token,
        )

        # Format as OpenAI response with clinical summary
        clinical_summary = result.get("clinical_summary", str(result))

        return {
            "id": f"chatcmpl-{uuid.uuid4()}",
            "object": "chat.completion",
            "created": int(datetime.now().timestamp()),
            "model": "netra-ai-agent",
            "choices": [
                {
                    "index": 0,
                    "message": {"role": "assistant", "content": clinical_summary},
                    "finish_reason": "stop",
                }
            ],
            "usage": {
                "prompt_tokens": len(last_message.split()),
                "completion_tokens": len(clinical_summary.split()),
                "total_tokens": len(last_message.split())
                + len(clinical_summary.split()),
            },
        }

    @fastapi_app.post("/rpc")
    async def json_rpc(request: Request):
        """Standard JSON-RPC 2.0 endpoint for A2A interoperability with SHARP context extraction"""
        body = await request.json()
        method = body.get("method")
        params = body.get("params", {})
        request_id = body.get("id")

        # 💎 EXTRACT SHARP CONTEXT from A2A metadata
        metadata = params.get("metadata", {})
        fhir_context_uri = "https://app.promptopinion.ai/schemas/a2a/v1/fhir-context"
        fhir_context = metadata.get(fhir_context_uri, {})

        # Extract FHIR credentials from metadata or headers
        fhir_server = fhir_context.get("fhirUrl") or request.headers.get(
            "X-FHIR-Server-URL"
        )
        fhir_token = fhir_context.get("fhirToken") or request.headers.get(
            "X-FHIR-Access-Token"
        )
        patient_id = fhir_context.get("patientId") or request.headers.get(
            "X-Patient-ID"
        )

        if method == "agent.interact":
            message = params.get("message", "")

            # 💎 EXTRACT IMAGE/AUDIO URL from message (Robustness for A2A/POP)
            input_data = {}
            url_match = re.search(r'(https?://\S+\.(?:jpg|jpeg|png|webp|wav|mp3|ogg))', message, re.I)
            if url_match:
                url = url_match.group(1)
                if any(ext in url.lower() for ext in ['.jpg', '.jpeg', '.png', '.webp']):
                    input_data["image_url"] = url
                elif any(ext in url.lower() for ext in ['.wav', '.mp3', '.ogg']):
                    input_data["audio_url"] = url

            # Pass FHIR context to orchestrator
            result = await orchestrate_screening_workflow(
                ctx=None,
                chief_complaint=message,
                patient_id=patient_id,
                input_data=input_data,
                fhir_server=fhir_server,
                fhir_token=fhir_token,
            )

            # Use clinical summary for human-readable response
            clinical_summary = result.get("clinical_summary", str(result))

            return {
                "jsonrpc": "2.0",
                "id": request_id,
                "result": {
                    "message": clinical_summary,
                    "metadata": {
                        "source": "NetraAI",
                        "patient_id": patient_id,
                        "fhir_context_used": bool(fhir_server),
                        "workflow": result.get("workflow", "Unknown"),
                        "timestamp": result.get("timestamp"),
                    },
                },
            }

        return {
            "jsonrpc": "2.0",
            "id": request_id,
            "error": {"code": -32601, "message": "Method not found"},
        }

    # S2: CORS Middleware - Allow all origins for Hugging Face Spaces
    # HF Spaces proxy adds various origins that are hard to predict
    is_huggingface = os.getenv("ENVIRONMENT") == "huggingface" or os.getenv("SPACE_ID") is not None
    if is_huggingface:
        fastapi_app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],  # Allow all for HF Spaces
            allow_credentials=False,  # Must be False when allow_origins is "*"
            allow_methods=["GET", "POST", "OPTIONS"],
            allow_headers=["*"],
        )
    else:
        allowed_origins = os.getenv(
            "ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173"
        ).split(",")
        fastapi_app.add_middleware(
            CORSMiddleware,
            allow_origins=[o.strip() for o in allowed_origins],
            allow_credentials=True,
            allow_methods=["GET", "POST", "OPTIONS"],
            allow_headers=["X-API-Key", "Content-Type", "Authorization"],
        )

    # S2.5: Trusted Host Middleware (disabled for Hugging Face Spaces)
    # Hugging Face Spaces use internal routing that doesn't match external hostnames
    # Only enable for non-HF deployments
    if os.getenv("ENVIRONMENT") != "huggingface":
        allowed_hosts = [
            host.strip()
            for host in os.getenv(
                "ALLOWED_HOSTS",
                "localhost,127.0.0.1,netra-mcp-server,*.onrender.com,*.hf.space,*.huggingface.co",
            ).split(",")
            if host.strip()
        ]
        if allowed_hosts:
            fastapi_app.add_middleware(TrustedHostMiddleware, allowed_hosts=allowed_hosts)

    # S3: Low-Level ASGI Middleware (Fixes AssertionError with SSE)
    class SafeStreamingMiddleware:
        def __init__(self, app):
            self.app = app
            self.rate_limit_store = defaultdict(list)
            self.RATE_LIMIT = int(os.getenv("MCP_RATE_LIMIT", "30"))
            self.RATE_WINDOW = 60

        async def __call__(self, scope, receive, send):
            if scope["type"] != "http":
                return await self.app(scope, receive, send)
            
            path = scope.get("path", "")
            # 1. CRITICAL BYPASS: Skip all processing for MCP SSE to avoid crashes
            if path.startswith("/mcp"):
                return await self.app(scope, receive, send)

            # 2. Rate Limiting (Skip for health and HF)
            if path != "/health" and os.getenv("ENVIRONMENT") != "huggingface":
                client_ip = scope.get("client", ["unknown"])[0]
                now = datetime.now()
                self.rate_limit_store[client_ip] = [
                    ts for ts in self.rate_limit_store[client_ip]
                    if now - ts < timedelta(seconds=self.RATE_WINDOW)
                ]
                if len(self.rate_limit_store[client_ip]) >= self.RATE_LIMIT:
                    # Send 429 directly via ASGI
                    await send({
                        "type": "http.response.start",
                        "status": 429,
                        "headers": [(b"content-type", b"application/json")]
                    })
                    await send({
                        "type": "http.response.body",
                        "body": b'{"error": "Rate limit exceeded"}'
                    })
                    return

            # 3. Inject Security Headers in the 'send' wrapper
            async def send_wrapper(message):
                if message["type"] == "http.response.start":
                    headers = dict(message.get("headers", []))
                    headers[b"x-content-type-options"] = b"nosniff"
                    headers[b"x-request-id"] = str(uuid.uuid4()).encode()
                    
                    is_hf = (os.getenv("ENVIRONMENT") == "huggingface" or os.getenv("SPACE_ID") is not None)
                    if is_hf:
                        headers[b"content-security-policy"] = b"frame-ancestors 'self' https://*.huggingface.co https://*.hf.space"
                    else:
                        headers[b"x-frame-options"] = b"DENY"
                        headers[b"strict-transport-security"] = b"max-age=31536000; includeSubDomains"
                    
                    message["headers"] = list(headers.items())
                await send(message)

            await self.app(scope, receive, send_wrapper)

    fastapi_app.add_middleware(SafeStreamingMiddleware)

    # S7: Input Validation
    PATIENT_ID_PATTERN = re.compile(r"^[a-zA-Z0-9\-\_]{1,64}$")

    def validate_patient_id(patient_id: str) -> bool:
        """Validate patient_id: alphanumeric + hyphens only, max 64 chars"""
        if not patient_id or not PATIENT_ID_PATTERN.match(patient_id):
            raise ValueError(f"Invalid patient_id format: {patient_id}")
        return True

    @fastapi_app.post("/tools/call")
    async def call_tool(request: Request):
        body = await request.json()
        name = body.get("name")
        arguments = body.get("arguments", {})

        # Verify API Key (S1: No hardcoded fallback)
        # Skip API key check for Hugging Face Spaces (public demo)
        if os.getenv("ENVIRONMENT") != "huggingface":
            api_key = request.headers.get("X-API-Key")
            mcp_api_key = os.getenv("MCP_API_KEY")
            if not mcp_api_key:
                return JSONResponse(
                    {"error": "Server misconfigured: MCP_API_KEY not set"}, status_code=500
                )
            if api_key != mcp_api_key:
                return JSONResponse({"error": "Unauthorized"}, status_code=401)

        # Extract SHARP context from headers (Agents Assemble Hackathon requirement)
        sharp_patient_id = request.headers.get("X-Patient-ID")
        sharp_fhir_url = request.headers.get("X-FHIR-Server-URL")
        sharp_fhir_token = request.headers.get("X-FHIR-Access-Token")

        if sharp_patient_id and not arguments.get("patient_id"):
            arguments["patient_id"] = sharp_patient_id

        # Inject context for tools that might need FHIR connectivity
        if sharp_fhir_url:
            arguments["fhir_server"] = sharp_fhir_url
        if sharp_fhir_token:
            arguments["fhir_token"] = sharp_fhir_token

        try:
            arguments.pop("ctx", None)  # never pass ctx from external callers

            # S7: Validate patient_id if present
            if "patient_id" in arguments and arguments["patient_id"]:
                try:
                    validate_patient_id(arguments["patient_id"])
                except ValueError as ve:
                    return JSONResponse({"error": str(ve)}, status_code=400)

            tool_map = {
                "diagnose_anemia_tool": lambda: diagnose_anemia(ctx=None, **arguments),
                "detect_cataract_tool": lambda: detect_cataract(ctx=None, **arguments),
                "screen_dr_tool": lambda: screen_diabetic_retinopathy(
                    ctx=None, **arguments
                ),
                "analyze_mental_health_tool": lambda: analyze_mental_health(
                    ctx=None, **arguments
                ),
                "screen_parkinsons_tool": lambda: screen_parkinsons(
                    ctx=None, **arguments
                ),
                "get_patient_fhir_tool": lambda: get_patient_fhir(
                    ctx=None, **arguments
                ),
                "query_patient_timeline_tool": lambda: query_patient_timeline(
                    ctx=None, **arguments
                ),
                "compare_diagnostic_history_tool": lambda: compare_diagnostic_history(
                    ctx=None, **arguments
                ),
                "generate_prior_auth_tool": lambda: generate_prior_auth(
                    ctx=None, **arguments
                ),
                "orchestrate_screening_workflow_tool": lambda: orchestrate_screening_workflow(
                    ctx=None, **arguments
                ),
                "health_check_tool": lambda: {"status": "healthy"},
            }

            if name in tool_map:
                result = tool_map[name]()
                import inspect

                if inspect.isawaitable(result):
                    result = await result
                return result
            else:
                return await mcp.call_tool(name, arguments)

        except Exception:
            # S4+S5: Sanitized error responses (no stack traces)
            import logging

            logger = logging.getLogger(__name__)
            logger.exception(f"Tool {name} failed")
            return JSONResponse(
                {"error": "Internal server error", "tool": name}, status_code=500
            )

    # ── Mount FastMCP ASGI sub-app ────────────────────────────────────────────
    # The ASGI app was created at the top of create_app()
    try:
        fastapi_app.mount("/mcp", mcp_asgi, name="mcp")
    except Exception as e:
        print(f"Could not mount FastMCP ASGI: {e}")

    return fastapi_app


app = create_app()

if __name__ == "__main__":
    import uvicorn

    # Docker ingress requires binding to all interfaces.
    uvicorn.run(app, host="0.0.0.0", port=8080)  # nosec B104
