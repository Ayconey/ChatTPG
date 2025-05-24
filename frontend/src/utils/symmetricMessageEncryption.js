// frontend/src/utils/symmetricMessageEncryption.js
import { 
  generateDeterministicKeys, 
  encryptWithDeterministicKey,
  decryptWithDeterministicKey,
  generateSessionKey,
  exportKey,
  importKey
} from './deterministicRSA';

const enc = new TextEncoder();
const dec = new TextDecoder();

/**
 * Generuje klucz symetryczny dla konwersacji między dwoma użytkownikami
 * Klucz jest deterministyczny i taki sam dla obu użytkowników
 */
async function generateConversationKey(user1, user2, sharedSecret) {
  // Sortuj nazwy użytkowników dla spójności
  const users = [user1, user2].sort();
  const conversationId = `${users[0]}:${users[1]}:${sharedSecret}`;
  
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(conversationId),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode("conversation"),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

/**
 * Generuje IV dla wiadomości (musi być unikalny dla każdej wiadomości)
 */
function generateMessageIV() {
  return crypto.getRandomValues(new Uint8Array(12));
}

/**
 * Szyfruje wiadomość dla konwersacji
 */
export async function encryptMessageForConversation(message, conversationKey) {
  const iv = generateMessageIV();
  const messageBytes = enc.encode(message);
  
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    conversationKey,
    messageBytes
  );

  // Zwróć zaszyfrowaną wiadomość z IV
  const result = new Uint8Array(iv.length + encrypted.byteLength);
  result.set(iv, 0);
  result.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode(...result));
}

/**
 * Deszyfruje wiadomość z konwersacji
 */
export async function decryptMessageFromConversation(encryptedMessage, conversationKey) {
  const encryptedBytes = Uint8Array.from(atob(encryptedMessage), c => c.charCodeAt(0));
  
  // Pierwsze 12 bajtów to IV
  const iv = encryptedBytes.slice(0, 12);
  const ciphertext = encryptedBytes.slice(12);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    conversationKey,
    ciphertext
  );

  return dec.decode(decrypted);
}

/**
 * Przygotowuje zaszyfrowaną wiadomość (dla nadawcy i odbiorcy)
 * W nowym podejściu używamy tego samego klucza konwersacji
 */
export async function prepareSymmetricEncryptedMessage(
  message, 
  senderUsername, 
  receiverUsername, 
  senderKeys,
  sharedSecret
) {
  try {
    console.log('🔐 Preparing symmetric encrypted message:', {
      from: senderUsername,
      to: receiverUsername,
      messageLength: message.length
    });

    // Generuj klucz konwersacji (deterministyczny dla pary użytkowników)
    const conversationKey = await generateConversationKey(
      senderUsername, 
      receiverUsername, 
      sharedSecret
    );

    // Zaszyfruj wiadomość tym samym kluczem dla obu stron
    const encryptedMessage = await encryptMessageForConversation(message, conversationKey);
    
    console.log('✅ Message encrypted successfully:', {
      originalLength: message.length,
      encryptedLength: encryptedMessage.length
    });
    
    // W tym podejściu obie strony używają tego samego zaszyfrowanego tekstu
    return {
      encrypted_content_for_receiver: encryptedMessage,
      encrypted_content_for_sender: encryptedMessage
    };
  } catch (error) {
    console.error('❌ Error encrypting message:', error);
    throw error;
  }
}

/**
 * Deszyfruje otrzymaną wiadomość
 */
export async function decryptSymmetricMessage(
  messageData, 
  currentUsername,
  otherUsername,
  userKeys,
  sharedSecret
) {
  try {
    console.log('🔓 Attempting to decrypt symmetric message:', {
      from: messageData.username,
      currentUser: currentUsername,
      isFromMe: messageData.username === currentUsername
    });

    // Generuj ten sam klucz konwersacji
    const conversationKey = await generateConversationKey(
      currentUsername,
      otherUsername,
      sharedSecret
    );

    // Użyj odpowiedniej wersji zaszyfrowanej wiadomości
    const encryptedContent = messageData.username === currentUsername 
      ? messageData.encrypted_content_for_sender 
      : messageData.encrypted_content_for_receiver;
    
    if (!encryptedContent) {
      console.warn('⚠️ No encrypted content found');
      return '[No encrypted content]';
    }

    const decryptedText = await decryptMessageFromConversation(
      encryptedContent, 
      conversationKey
    );
    
    console.log('✅ Successfully decrypted message');
    return decryptedText;
  } catch (error) {
    console.error('❌ Error decrypting message:', error);
    return '[Failed to decrypt message]';
  }
}

/**
 * Generuje shared secret dla użytkownika (deterministyczny)
 * To jest używane do generowania klucza konwersacji
 */
export function generateUserSharedSecret(username, salt) {
  // W prawdziwej aplikacji shared secret powinien być wymieniany bezpiecznie
  // Tu używamy prostego deterministycznego podejścia
  return `${username}:${salt}:shared`;
}