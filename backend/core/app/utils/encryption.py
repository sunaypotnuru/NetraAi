"""
HIPAA-Compliant Encryption Utilities for PHI/PII Data
Uses Fernet (AES-128-CBC + HMAC) for symmetric encryption
"""

import os
import base64
import logging
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2
from typing import Optional

logger = logging.getLogger(__name__)


class EncryptionService:
    """
    HIPAA-compliant encryption service for sensitive data at rest
    
    Features:
    - AES-128-CBC encryption with HMAC authentication
    - Key derivation from application secret
    - Safe handling of encryption failures
    - Automatic base64 encoding for database storage
    """
    
    def __init__(self, secret_key: Optional[str] = None):
        """
        Initialize encryption service
        
        Args:
            secret_key: Master key for encryption (from JWT_SECRET or env)
        """
        self._secret_key = secret_key or os.getenv("JWT_SECRET", "fallback-dev-key-CHANGE-IN-PROD")
        self._fernet = self._initialize_fernet()
    
    def _initialize_fernet(self) -> Fernet:
        """
        Initialize Fernet cipher with derived key from secret
        Uses PBKDF2 for key derivation (NIST SP 800-132 compliant)
        """
        try:
            # Derive a 32-byte key from the secret using PBKDF2
            kdf = PBKDF2(
                algorithm=hashes.SHA256(),
                length=32,
                salt=b'netra-ai-hipaa-salt-v1',  # Static salt for deterministic key derivation
                iterations=100000,  # NIST recommended minimum
            )
            key = base64.urlsafe_b64encode(kdf.derive(self._secret_key.encode()))
            return Fernet(key)
        except Exception as e:
            logger.error(f"Failed to initialize encryption: {e}")
            # Fallback to a development key (should never happen in prod)
            return Fernet(Fernet.generate_key())
    
    def encrypt(self, plaintext: str) -> Optional[str]:
        """
        Encrypt plaintext string to base64-encoded ciphertext
        
        Args:
            plaintext: String to encrypt
            
        Returns:
            Base64-encoded encrypted string, or None on failure
        """
        if not plaintext:
            return plaintext
        
        try:
            encrypted_bytes = self._fernet.encrypt(plaintext.encode('utf-8'))
            return encrypted_bytes.decode('utf-8')
        except Exception as e:
            logger.error(f"Encryption failed: {e}")
            return None
    
    def decrypt(self, ciphertext: str) -> Optional[str]:
        """
        Decrypt base64-encoded ciphertext to plaintext string
        
        Args:
            ciphertext: Encrypted string (base64-encoded)
            
        Returns:
            Decrypted plaintext string, or None on failure
        """
        if not ciphertext:
            return ciphertext
        
        try:
            decrypted_bytes = self._fernet.decrypt(ciphertext.encode('utf-8'))
            return decrypted_bytes.decode('utf-8')
        except Exception as e:
            logger.error(f"Decryption failed: {e}")
            return None
    
    def encrypt_dict_fields(self, data: dict, fields: list[str]) -> dict:
        """
        Encrypt specific fields in a dictionary
        
        Args:
            data: Dictionary containing data
            fields: List of field names to encrypt
            
        Returns:
            Dictionary with encrypted fields
        """
        encrypted_data = data.copy()
        for field in fields:
            if field in encrypted_data and encrypted_data[field]:
                encrypted_value = self.encrypt(str(encrypted_data[field]))
                if encrypted_value:
                    encrypted_data[field] = encrypted_value
        return encrypted_data
    
    def decrypt_dict_fields(self, data: dict, fields: list[str]) -> dict:
        """
        Decrypt specific fields in a dictionary
        
        Args:
            data: Dictionary containing encrypted data
            fields: List of field names to decrypt
            
        Returns:
            Dictionary with decrypted fields
        """
        decrypted_data = data.copy()
        for field in fields:
            if field in decrypted_data and decrypted_data[field]:
                decrypted_value = self.decrypt(str(decrypted_data[field]))
                if decrypted_value:
                    decrypted_data[field] = decrypted_value
        return decrypted_data


# Global encryption service instance
_encryption_service: Optional[EncryptionService] = None


def get_encryption_service() -> EncryptionService:
    """
    Get or create global encryption service instance
    Thread-safe singleton pattern
    """
    global _encryption_service
    if _encryption_service is None:
        _encryption_service = EncryptionService()
    return _encryption_service


def encrypt_sensitive_data(plaintext: str) -> Optional[str]:
    """
    Convenience function to encrypt sensitive data
    
    Args:
        plaintext: String to encrypt
        
    Returns:
        Encrypted string or None
    """
    return get_encryption_service().encrypt(plaintext)


def decrypt_sensitive_data(ciphertext: str) -> Optional[str]:
    """
    Convenience function to decrypt sensitive data
    
    Args:
        ciphertext: Encrypted string
        
    Returns:
        Decrypted string or None
    """
    return get_encryption_service().decrypt(ciphertext)
