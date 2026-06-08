import logging
from fastapi import Depends, HTTPException, status  # type: ignore
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials  # type: ignore
from fastapi import Request  # type: ignore
from typing import Dict, Any
import jwt  # type: ignore
import os
import base64

from app.core.config import settings  # type: ignore
from app.models.schemas import TokenPayload, UserRole  # type: ignore

logger = logging.getLogger(__name__)
security = HTTPBearer(auto_error=True)  # Automatically reject requests without valid Bearer token


async def get_current_user_ws(token: str) -> Dict[str, Any]:
    """
    Get current user from WebSocket token.

    Args:
        token: JWT token from query parameter

    Returns:
        User payload dict

    Raises:
        HTTPException: If authentication fails
    """
    try:
        payload = verify_supabase_jwt(token)
        return payload
    except Exception as e:
        logger.error(f"WebSocket authentication failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )



def verify_supabase_jwt(token: str) -> Dict[str, Any]:
    """
    Verify a Supabase JWT token with support for Base64 secrets and detailed logging.
    """
    jwt_secret = settings.SUPABASE_JWT_SECRET
    if not jwt_secret:
        logger.error("SUPABASE_JWT_SECRET not configured - authentication impossible")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication service misconfigured",
        )

    try:
        # 1. Parse Header for Algorithm
        unverified_header = jwt.get_unverified_header(token)
        alg = unverified_header.get("alg", "HS256")
        logger.info(f"JWT Verification: Detected algorithm {alg}")

        # 2. Get Secret/Key based on Algorithm
        if alg in ["RS256", "ES256"]:
            supabase_url = settings.SUPABASE_URL.rstrip("/")
            jwks_url = f"{supabase_url}/auth/v1/.well-known/jwks.json"
            logger.info(f"Fetching public key from JWKS: {jwks_url}")
            try:
                jwks_client = jwt.PyJWKClient(jwks_url)
                signing_key = jwks_client.get_signing_key_from_jwt(token)
                secret = signing_key.key
                secrets_to_try = [secret]
                logger.info(f"Successfully fetched {alg} public key")
            except Exception as e:
                logger.error(f"Failed to fetch JWKS public key: {e}")
                logger.warning("Falling back to HS256 with JWT secret")
                # Fallback: Try HS256 with the JWT secret
                raw_secret = jwt_secret.strip().strip('"').strip("'")
                secrets_to_try = [raw_secret]
                if len(raw_secret) > 32:
                    try:
                        padded = raw_secret + "=" * ((4 - len(raw_secret) % 4) % 4)
                        decoded = base64.b64decode(padded)
                        secrets_to_try.insert(0, decoded)
                    except Exception:
                        pass
                alg = "HS256"  # Override algorithm to HS256
        else:
            # 3. Handle Symmetric (HS256) - BRUTE FORCE
            raw_secret = jwt_secret.strip().strip('"').strip("'")
            logger.info(
                f"JWT Debug: Secret length={len(raw_secret)}, Starts with='{raw_secret[:3]}...'"
            )
            secrets_to_try = [raw_secret]
            if len(raw_secret) > 32:
                try:
                    padded = raw_secret + "=" * ((4 - len(raw_secret) % 4) % 4)
                    decoded = base64.b64decode(padded)
                    secrets_to_try.insert(0, decoded)
                except Exception:
                    pass

        # 4. Brute Force Decode
        payload = None
        last_error = None
        for try_secret in secrets_to_try:
            try:
                payload = jwt.decode(
                    token,
                    try_secret,
                    algorithms=[alg],
                    leeway=120,
                    options={
                        "verify_signature": True,
                        "verify_exp": True,
                        "verify_aud": False,
                        "verify_iss": False,
                    },
                )
                if payload:
                    logger.info(f"JWT Debug: Success using algorithm {alg}")
                    break
            except jwt.InvalidSignatureError:
                continue
            except Exception as e:
                last_error = e
                break

        if not payload:
            logger.error(f"JWT Debug: Verification failed for algorithm {alg}.")
            if last_error:
                raise last_error
            raise jwt.InvalidTokenError(f"Signature verification failed for {alg}")

        # 5. Extract Identity
        if not payload.get("sub"):
            logger.warning("JWT missing 'sub' (subject)")
            raise HTTPException(
                status_code=401, detail="Invalid token: missing subject"
            )

        return payload

    except jwt.ExpiredSignatureError:
        logger.warning("JWT Verification Failed: Token has expired")
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidSignatureError:
        logger.warning("JWT Verification Failed: Invalid signature (Secret Mismatch?)")
        raise HTTPException(status_code=401, detail="Invalid token signature")
    except jwt.InvalidTokenError as e:
        logger.warning(f"JWT Verification Failed: {str(e)}")
        raise HTTPException(
            status_code=401, detail=f"Token validation failed: {str(e)}"
        )
    except Exception as e:
        logger.error(
            f"JWT Verification Failed: Unexpected error: {type(e).__name__}: {str(e)}"
        )
        raise HTTPException(status_code=401, detail="Authentication failed")


def get_current_user(
    request: Request, credentials: HTTPAuthorizationCredentials = Depends(security)
) -> TokenPayload:
    """
    Get current user with maximum security.
    Supports a local DEV-only bypass when settings.BYPASS_AUTH is enabled.

    SECURITY: Bypass auth is ONLY allowed in development/testing environments.
    """
    logger.debug("Authenticating request for path: %s", request.url.path)

    auth_header = request.headers.get("authorization") or request.headers.get("Authorization")
    logger.debug("Authorization header present: %s", bool(auth_header))
    logger.debug("HTTPBearer credentials present: %s", credentials is not None)
    # Check environment first - NEVER allow bypass in production.
    # Note: Production check is done at startup, so if we're here, it's safe.
    environment = os.getenv("ENVIRONMENT", "development").lower()

    # DEV / demo bypass controlled by backend settings only.
    is_bypass_active = settings.BYPASS_AUTH

    # Log bypass status for debugging
    logger.debug("BYPASS_AUTH setting: %s", settings.BYPASS_AUTH)
    logger.debug("ENVIRONMENT: %s", environment)

    if is_bypass_active:
        logger.warning("BYPASS_AUTH IS ACTIVE - Authentication disabled!")
        demo_email = request.headers.get("X-Demo-Email")
        demo_role = request.headers.get("X-Demo-Role")

        # If no explicit role header, infer from request path for seamless dev experience
        if not demo_role:
            path = request.url.path
            if "/api/v1/doctor" in path:
                demo_role = "doctor"
            elif "/api/v1/admin" in path:
                demo_role = "admin"
            else:
                demo_role = "patient"

        demo_role = demo_role.lower()
        if not demo_email:
            demo_email = f"demo+{demo_role}@example.com"

        try:
            role = UserRole(demo_role)
        except ValueError:
            role = UserRole.PATIENT

        # DYNAMIC UUID LOOKUP FOR SEEDED ACCOUNTS
        # This ensures that even in bypass mode, we get the real data for presentation accounts
        user_id = "00000000-0000-0000-0000-000000000000"
        try:
            from app.services.supabase import supabase

            table = (
                "profiles_doctor"
                if demo_role in ["doctor", "admin"]
                else "profiles_patient"
            )
            res = (
                supabase.table(table)
                .select("id")
                .eq("email", demo_email)
                .maybe_single()
                .execute()
            )
            if res and hasattr(res, "data") and res.data:
                # Type safe access
                data = res.data
                if isinstance(data, list) and len(data) > 0:
                    user_id = str(data[0].get("id", user_id))
                elif isinstance(data, dict):
                    user_id = str(data.get("id", user_id))

                logger.info(
                    f"Bypass Lookup: Found real UUID {user_id} for {demo_email}"
                )
        except Exception as e:
            logger.warning(f"Bypass UUID lookup failed for {demo_email}: {e}")

        logger.info(f"Using BYPASS AUTH for {demo_role}: {demo_email} (ID: {user_id})")
        return TokenPayload(
            sub=user_id,
            email=demo_email,
            role=role,
        )

    # Extract token from HTTPBearer
    # Note: auto_error=True means this will automatically return 401 if no valid Bearer token
    # So if we reach here, credentials is guaranteed to be present
    token = credentials.credentials
    logger.debug("Token extracted (length: %s)", len(token))

    # JWT format validation: must have 3 parts separated by dots (header.payload.signature)
    if not token or token.count(".") != 2:
        logger.warning("Authentication attempt with invalid JWT format")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token format",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Basic token length check
    if len(token) < 10:
        logger.warning("Authentication attempt with token too short")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token format",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = verify_supabase_jwt(token)
        logger.info("JWT verification successful")
    except HTTPException as e:
        logger.error(f"JWT verification failed: {e.detail}")
        raise
    except Exception as e:
        logger.error(f"Unexpected authentication error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Extract and validate user metadata
    user_metadata = payload.get("user_metadata", {})
    role_str = user_metadata.get("role", "patient")

    logger.info(f"JWT decoded successfully: email={payload.get('email')}, role={role_str}, sub={payload.get('sub')}")

    # Validate role
    try:
        role = UserRole(role_str.lower())
        logger.info(f"Role validated: {role.value}")
    except ValueError:
        logger.warning(f"Invalid role in token: {role_str}")
        role = UserRole.PATIENT  # Default to least privileged role

    # Additional security checks
    user_id_str = str(payload.get("sub", ""))
    email_str = str(payload.get("email", ""))

    if not user_id_str or not email_str:
        logger.warning("Token missing required user information")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing user information",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Log successful authentication (without sensitive data)
    logger.info(
        f"User authenticated: {email_str[:3]}***@{email_str.split('@')[1] if '@' in email_str else 'unknown'}"
    )

    return TokenPayload(sub=user_id_str, email=email_str, role=role)


def get_current_patient(
    current_user: TokenPayload = Depends(get_current_user),
) -> TokenPayload:
    # A patient (or admin) can access patient routes
    if current_user.role not in [UserRole.PATIENT, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return current_user


def get_current_doctor(
    current_user: TokenPayload = Depends(get_current_user),
) -> TokenPayload:
    # A doctor (or admin) can access doctor routes
    if current_user.role not in [UserRole.DOCTOR, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Not enough permissions")
        
    if current_user.role == UserRole.ADMIN:
        return current_user
        
    if current_user.role == UserRole.DOCTOR:
        try:
            from app.services.supabase import supabase
            res = (
                supabase.table("profiles_doctor")
                .select("is_verified, verification_status")
                .eq("id", current_user.sub)
                .maybe_single()
                .execute()
            )
            if not res or not res.data:
                raise HTTPException(status_code=403, detail="Doctor profile not found.")
            
            is_verified = res.data.get("is_verified", False)
            verification_status = res.data.get("verification_status", "pending")
            if not is_verified or verification_status != "approved":
                raise HTTPException(
                    status_code=403,
                    detail=f"Doctor profile is not verified. Current status: {verification_status}. Access to doctor dashboard is restricted until admin approval."
                )
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error checking verification status for doctor {current_user.email}: {e}")
            raise HTTPException(
                status_code=500,
                detail="Internal server error checking doctor verification status."
            )
            
    return current_user


def get_current_admin(
    current_user: TokenPayload = Depends(get_current_user),
) -> TokenPayload:
    """
    Verify that the current user has admin privileges.
    
    Admin access is granted if:
    1. User has role=admin in JWT token (user_metadata.role)
    2. User is a doctor with is_admin=true in profiles_doctor table
    
    Args:
        current_user: The authenticated user from get_current_user()
        
    Returns:
        TokenPayload with admin role
        
    Raises:
        HTTPException 403: If user doesn't have admin privileges
    """
    # Check if user already has admin role in JWT
    if current_user.role == UserRole.ADMIN:
        logger.info(f"Admin access granted for {current_user.email} (JWT role: admin)")
        return current_user
    
    # Check if user is a doctor with admin privileges in database
    if current_user.role == UserRole.DOCTOR:
        try:
            from app.services.supabase import supabase
            logger.info(f"Checking database for admin flag: user_id={current_user.sub}, email={current_user.email}")
            # Check if this doctor has is_admin flag set
            doctor_res = (
                supabase.table("profiles_doctor")
                .select("is_admin")
                .eq("id", current_user.sub)
                .maybe_single()
                .execute()
            )
            
            logger.info(f"Database query result: {doctor_res.data if doctor_res else 'None'}")
            
            if doctor_res and doctor_res.data and doctor_res.data.get("is_admin"):
                logger.info(f"Admin access granted for doctor {current_user.email} via is_admin flag")
                # Upgrade the user's role for this request
                current_user.role = UserRole.ADMIN
                return current_user
            else:
                logger.warning(f"Doctor {current_user.email} exists but is_admin=false or not found")
        except Exception as e:
            logger.error(f"Failed to check admin privileges for doctor {current_user.email}: {e}")
    
    # If we get here, user doesn't have admin access
    logger.warning(
        f"Admin access denied for user {current_user.email} "
        f"(role: {current_user.role.value}, required: admin)"
    )
    raise HTTPException(
        status_code=403, 
        detail=f"Admin access required. Current role: {current_user.role.value}. Contact administrator to grant admin privileges."
    )
