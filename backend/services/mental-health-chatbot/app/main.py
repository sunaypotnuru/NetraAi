"""
Mental Health Chatbot - Industrial Level (FREE)
Uses Ollama (FREE, local LLM) for conversational AI
Based on Llama 3.2 or Mistral models
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import logging
import os
from datetime import datetime
import httpx

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Mental Health Chatbot API",
    description="FREE conversational AI for mental health support using Ollama",
    version="1.0.0",
)

# Configure CORS - use environment variable for production
allowed_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:5173,http://localhost:8080",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,  # Environment-based for production security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger.info(f"CORS configured for origins: {allowed_origins}")

# Groq configuration (Cloud-based, fast, and production-ready)
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-70b-versatile")
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"


class Message(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: List[Message]
    model: Optional[str] = GROQ_MODEL
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 500


class ChatResponse(BaseModel):
    response: str
    model: str
    timestamp: str
    tokens_used: Optional[int] = None


# System prompt for mental health support with enhanced crisis protocols
MENTAL_HEALTH_SYSTEM_PROMPT = """You are a compassionate mental health support assistant. Your role is to:

1. Listen empathetically to users' concerns
2. Provide emotional support and validation
3. Suggest evidence-based coping strategies
4. Recognize crisis situations and provide appropriate resources
5. Encourage professional help when needed

IMPORTANT GUIDELINES:
- You are NOT a replacement for professional therapy or medical advice
- Always encourage users to seek professional help for serious concerns
- If you detect ANY crisis indicators (suicide, self-harm, violence), IMMEDIATELY:
  * Express concern and validate their feelings
  * Provide crisis hotlines prominently
  * Strongly urge immediate professional intervention
  * DO NOT try to "solve" the crisis - escalate to professionals
- Be warm, non-judgmental, and supportive
- Use simple, clear language
- Provide actionable advice for non-crisis situations
- Acknowledge limitations - refer to mental health professionals when appropriate

CRISIS DETECTION KEYWORDS (trigger immediate escalation):
- Suicide ideation: "kill myself", "end my life", "want to die", "planning suicide"
- Self-harm: "cut myself", "hurt myself", "self-harm", "overdose"
- Severe distress: "can't go on", "no reason to live", "better off dead"

CRISIS RESPONSE PROTOCOL:
1. Acknowledge their pain: "I hear you're in a lot of pain right now"
2. Express concern: "I'm very concerned about your safety"
3. Provide hotlines: List 988 and Crisis Text Line prominently
4. Encourage immediate action: "Please reach out to these resources right now"
5. Validate decision to seek help: "Reaching out takes courage"

CRISIS HOTLINES (always mention for crisis situations):
- National Suicide Prevention Lifeline: 988 (24/7 free support)
- Crisis Text Line: Text HOME to 741741 (24/7 text support)
- SAMHSA National Helpline: 1-800-662-4357 (substance abuse/mental health)

NON-CRISIS SUPPORT:
- For anxiety: Breathing exercises, grounding techniques
- For depression: Behavioral activation, self-care routines
- For stress: Time management, boundary setting
- Always suggest professional therapy as complement to coping strategies

Remember: You're here to support and guide toward professional help, not to diagnose, treat, or manage crises alone."""


async def chat_with_groq(
    messages: List[Message], model: str, temperature: float, max_tokens: int
):
    """
    Chat with Groq API (Cloud-based inference)
    """
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not configured")

    try:
        # Prepare messages with system prompt
        formatted_messages = [
            {"role": "system", "content": MENTAL_HEALTH_SYSTEM_PROMPT}
        ]

        for msg in messages:
            formatted_messages.append({"role": msg.role, "content": msg.content})

        # Call Groq API
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                GROQ_URL,
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": formatted_messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                },
            )

            if response.status_code != 200:
                logger.error(f"Groq API error: {response.text}")
                raise HTTPException(status_code=500, detail="Groq API error")

            result = response.json()
            return result.get("choices", [{}])[0].get("message", {}).get("content", "")

    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")


def detect_crisis_in_response(user_message: str, ai_response: str) -> dict:
    """
    Enhanced multi-layer crisis detection with pattern matching
    Returns crisis info if detected
    
    LAYERS:
    1. Direct suicide/self-harm keywords
    2. Contextual phrases indicating intent
    3. Combination patterns (e.g., "feel" + "worthless" + "give up")
    """
    text_lower = user_message.lower()
    
    # Layer 1: High-severity direct keywords (immediate crisis)
    critical_keywords = [
        "kill myself",
        "suicide",
        "end my life",
        "want to die",
        "going to die",
        "planning to die",
        "better off dead",
        "should be dead",
        "wish i was dead",
        "no reason to live",
        "can't go on anymore"
    ]
    
    # Layer 2: Self-harm indicators
    self_harm_keywords = [
        "cut myself",
        "hurt myself",
        "self harm",
        "self-harm",
        "harm myself",
        "cutting",
        "burning myself",
        "overdose"
    ]
    
    # Layer 3: Contextual crisis indicators (combined patterns)
    despair_indicators = ["hopeless", "worthless", "pointless", "meaningless", "can't do this"]
    giving_up_indicators = ["give up", "giving up", "quit life", "done with life", "no point"]
    
    # Check critical keywords first
    for keyword in critical_keywords:
        if keyword in text_lower:
            return {
                "crisis_detected": True,
                "severity": "critical",
                "message": "I'm very concerned about what you're sharing. Please reach out for immediate help.",
                "hotlines": [
                    {
                        "name": "National Suicide Prevention Lifeline",
                        "number": "988",
                        "description": "24/7 free and confidential support",
                    },
                    {
                        "name": "Crisis Text Line",
                        "number": "Text HOME to 741741",
                        "description": "24/7 text support",
                    },
                    {
                        "name": "SAMHSA National Helpline",
                        "number": "1-800-662-4357",
                        "description": "Substance abuse and mental health services",
                    },
                ],
            }
    
    # Check self-harm keywords
    for keyword in self_harm_keywords:
        if keyword in text_lower:
            return {
                "crisis_detected": True,
                "severity": "high",
                "message": "I'm concerned about your safety. Please reach out for help right away.",
                "hotlines": [
                    {
                        "name": "National Suicide Prevention Lifeline",
                        "number": "988",
                        "description": "24/7 free and confidential support",
                    },
                    {
                        "name": "Crisis Text Line",
                        "number": "Text HOME to 741741",
                        "description": "24/7 text support",
                    },
                ],
            }
    
    # Check contextual patterns (despair + giving up)
    despair_count = sum(1 for phrase in despair_indicators if phrase in text_lower)
    giving_up_count = sum(1 for phrase in giving_up_indicators if phrase in text_lower)
    
    if despair_count >= 2 or (despair_count >= 1 and giving_up_count >= 1):
        return {
            "crisis_detected": True,
            "severity": "moderate",
            "message": "It sounds like you're going through a really difficult time. Please consider reaching out for support.",
            "hotlines": [
                {
                    "name": "National Suicide Prevention Lifeline",
                    "number": "988",
                    "description": "24/7 free and confidential support",
                },
            ],
        }

    return {"crisis_detected": False}


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Mental Health Chatbot API",
        "version": "1.0.0",
        "status": "running",
        "groq_model": GROQ_MODEL,
        "features": [
            "Conversational AI (Groq)",
            "Crisis detection",
            "Empathetic responses",
            "Coping strategies",
            "Resource recommendations",
        ],
        "cost": "FREE - High-performance Cloud Inference",
    }


@app.get("/health")
async def health():
    """Health check"""
    return {
        "status": "healthy",
        "groq_available": True if GROQ_API_KEY else False,
        "timestamp": datetime.now().isoformat(),
    }


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Chat endpoint for mental health support

    Uses Groq (Cloud LLM) for responses
    """
    try:
        # Get user's last message for crisis detection
        user_message = ""
        if request.messages:
            user_message = request.messages[-1].content

        # Get AI response from Groq
        logger.info(f"Generating response with model: {request.model}")
        ai_response = await chat_with_groq(
            messages=request.messages,
            model=request.model,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
        )

        # Detect crisis
        crisis_info = detect_crisis_in_response(user_message, ai_response)

        # If crisis detected, append hotlines to response
        if crisis_info["crisis_detected"]:
            ai_response += "\n\n🚨 **IMMEDIATE HELP AVAILABLE:**\n"
            for hotline in crisis_info["hotlines"]:
                ai_response += f"\n• **{hotline['name']}**: {hotline['number']}\n  {hotline['description']}"

        return ChatResponse(
            response=ai_response,
            model=request.model,
            timestamp=datetime.now().isoformat(),
            tokens_used=len(ai_response.split()),  # Approximate
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")


@app.post("/quick-support")
async def quick_support(message: str):
    """
    Quick support endpoint for simple queries
    Returns pre-defined responses for common concerns
    """
    message_lower = message.lower()

    # Pre-defined responses for common concerns (no LLM needed)
    responses = {
        "anxiety": {
            "response": "I hear that you're feeling anxious. Here are some quick techniques:\n\n1. **Box Breathing**: Inhale 4 seconds, hold 4, exhale 4, hold 4. Repeat 5 times.\n2. **5-4-3-2-1 Grounding**: Name 5 things you see, 4 you hear, 3 you feel, 2 you smell, 1 you taste.\n3. **Progressive Muscle Relaxation**: Tense and relax each muscle group.\n\nIf anxiety persists, please consider talking to a mental health professional.",
            "keywords": ["anxious", "anxiety", "worried", "panic", "nervous"],
        },
        "depression": {
            "response": "I'm sorry you're feeling this way. Depression is real and treatable. Here are some steps:\n\n1. **Reach out**: Talk to someone you trust\n2. **Small steps**: Do one small thing you enjoy today\n3. **Movement**: Even a 10-minute walk can help\n4. **Professional help**: Consider therapy or counseling\n\nYou don't have to face this alone. Help is available.",
            "keywords": ["depressed", "depression", "sad", "hopeless", "empty"],
        },
        "stress": {
            "response": "Stress is overwhelming, but manageable. Try these:\n\n1. **Prioritize**: List tasks, tackle one at a time\n2. **Breaks**: Take 5-minute breaks every hour\n3. **Say no**: It's okay to set boundaries\n4. **Self-care**: Sleep, nutrition, exercise\n\nIf stress is affecting your daily life, consider professional support.",
            "keywords": ["stressed", "stress", "overwhelmed", "pressure", "burnout"],
        },
        "sleep": {
            "response": "Sleep issues are common. Here's what can help:\n\n1. **Routine**: Same bedtime/wake time daily\n2. **Environment**: Dark, cool, quiet room\n3. **Avoid**: Screens 1 hour before bed\n4. **Relax**: Reading, meditation, warm bath\n\nIf insomnia persists, consult a healthcare provider.",
            "keywords": ["sleep", "insomnia", "tired", "exhausted", "can't sleep"],
        },
    }

    # Find matching response
    for concern, data in responses.items():
        for keyword in data["keywords"]:
            if keyword in message_lower:
                return {
                    "response": data["response"],
                    "concern": concern,
                    "timestamp": datetime.now().isoformat(),
                }

    # Default response
    return {
        "response": "Thank you for reaching out. I'm here to listen. Could you tell me more about what you're experiencing?",
        "concern": "general",
        "timestamp": datetime.now().isoformat(),
    }


if __name__ == "__main__":
    import uvicorn

    logger.info("Starting Mental Health Chatbot API...")
    logger.info(f"Groq URL: {GROQ_URL}")
    logger.info(f"Groq Model: {GROQ_MODEL}")

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8006,  # Note: 8004 is reserved for parkinsons-voice service
        reload=True,
        log_level="info",
    )
