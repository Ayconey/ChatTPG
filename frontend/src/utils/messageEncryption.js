// frontend/src/utils/messageEncryption.js
const enc = new TextEncoder();
const dec = new TextDecoder();

/**
 * Szyfruje wiadomość kluczem publicznym odbiorcy
 */
export async function encryptMessageForUser(message, publicKeyBase64) {
  try {
    // Import klucza publicznego
    const rawKey = Uint8Array.from(atob(publicKeyBase64), c => c.charCodeAt(0));
    const publicKey = await crypto.subtle.importKey(
      "spki", 
      rawKey, 
      { name: "RSA-OAEP", hash: "SHA-256" }, 
      false, 
      ["encrypt"]
    );
    
    // Szyfruj wiadomość
    const encrypted = await crypto.subtle.encrypt(
      { name: "RSA-OAEP" }, 
      publicKey, 
      enc.encode(message)
    );
    
    return btoa(String.fromCharCode(...new Uint8Array(encrypted)));
  } catch (error) {
    console.error('❌ Error encrypting message:', error);
    throw new Error('Failed to encrypt message');
  }
}

/**
 * Deszyfruje wiadomość własnym kluczem prywatnym
 */
export async function decryptMessageWithPrivateKey(encryptedMessageBase64, privateKey) {
  try {
    const encryptedBytes = Uint8Array.from(atob(encryptedMessageBase64), c => c.charCodeAt(0));
    
    const decrypted = await crypto.subtle.decrypt(
      { name: "RSA-OAEP" }, 
      privateKey, 
      encryptedBytes
    );
    
    return dec.decode(decrypted);
  } catch (error) {
    console.error('❌ Error decrypting message:', error);
    throw new Error('Failed to decrypt message');
  }
}

/**
 * Przygotowuje wiadomość do wysłania - szyfruje dla odbiorcy i nadawcy
 */
export async function prepareEncryptedMessage(message, receiverPublicKey, senderPublicKey) {
  try {
    console.log('🔐 Preparing encrypted message:', {
      messageLength: message.length,
      messagePreview: message.substring(0, 30) + '...',
      receiverKeyLength: receiverPublicKey.length,
      senderKeyLength: senderPublicKey.length
    });

    const encryptedForReceiver = await encryptMessageForUser(message, receiverPublicKey);
    const encryptedForSender = await encryptMessageForUser(message, senderPublicKey);
    
    console.log('✅ Message encrypted successfully:', {
      originalLength: message.length,
      encryptedForReceiverLength: encryptedForReceiver.length,
      encryptedForSenderLength: encryptedForSender.length
    });
    
    return {
      encrypted_content_for_receiver: encryptedForReceiver,
      encrypted_content_for_sender: encryptedForSender
    };
  } catch (error) {
    console.error('❌ Error preparing encrypted message:', error);
    throw error;
  }
}

/**
 * Odszyfruje wiadomość (automatycznie wybiera odpowiednią wersję)
 */
export async function decryptReceivedMessage(messageData, privateKey, currentUsername) {
  try {
    console.log('🔓 Attempting to decrypt message:', {
      messageUsername: messageData.username,
      currentUsername: currentUsername,
      isFromMe: messageData.username === currentUsername,
      hasEncryptedForSender: !!messageData.encrypted_content_for_sender,
      hasEncryptedForReceiver: !!messageData.encrypted_content_for_receiver
    });

    // Sprawdź czy jesteś nadawcą czy odbiorcą i wybierz odpowiednią zaszyfrowaną wersję
    const isMessageFromMe = messageData.username === currentUsername;
    const encryptedContent = isMessageFromMe 
      ? messageData.encrypted_content_for_sender 
      : messageData.encrypted_content_for_receiver;
    
    if (!encryptedContent) {
      console.warn('⚠️ No encrypted content found for message:', messageData);
      return '[Encrypted message - no content available]';
    }

    console.log('🔐 Decrypting with:', {
      contentType: isMessageFromMe ? 'sender' : 'receiver',
      encryptedLength: encryptedContent.length,
      encryptedPreview: encryptedContent.substring(0, 50) + '...'
    });
    
    const decryptedText = await decryptMessageWithPrivateKey(encryptedContent, privateKey);
    console.log('✅ Successfully decrypted message:', decryptedText);
    return decryptedText;
  } catch (error) {
    console.error('❌ Error decrypting received message:', error);
    console.error('📊 Message data:', messageData);
    console.error('🔑 Private key available:', !!privateKey);
    return '[Failed to decrypt message]';
  }
}