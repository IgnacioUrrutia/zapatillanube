// transbank-config.js - Configuración para integración con Transbank Webpay Plus

// Credenciales de integración para ambiente de desarrollo
// Estas son credenciales públicas de prueba proporcionadas por Transbank
export const TRANSBANK_CONFIG = {
  // Código de comercio para ambiente de desarrollo
  commerceCode: '597055555532',
  // Llave privada para ambiente de desarrollo
  apiKey: '579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C',
  // URL de ambiente de desarrollo
  apiUrl: 'https://webpay3gint.transbank.cl',
  // URL de retorno después de la transacción
  returnUrl: window.location.origin + '/transbank-return.html'
};

// URLs de la API REST de Transbank Webpay Plus
export const TRANSBANK_ENDPOINTS = {
  // Crear una transacción
  createTransaction: `${TRANSBANK_CONFIG.apiUrl}/rswebpaytransaction/api/webpay/v1.2/transactions`,
  // Confirmar una transacción (se usa con el token)
  confirmTransaction: (token) => `${TRANSBANK_CONFIG.apiUrl}/rswebpaytransaction/api/webpay/v1.2/transactions/${token}`
};

// Estados posibles de la transacción
export const TRANSACTION_STATUS = {
  AUTHORIZED: 'AUTHORIZED', // Transacción autorizada
  FAILED: 'FAILED',         // Transacción fallida
  PENDING: 'PENDING'        // Transacción pendiente
};

/**
 * Crea una nueva transacción en Transbank
 * @param {number} amount - Monto a pagar
 * @param {string} sessionId - ID de sesión (puede ser el ID del usuario o un identificador único)
 * @param {string} buyOrder - Orden de compra (debe ser único)
 * @returns {Promise<Object>} - Respuesta de Transbank con el token y la URL
 */
export async function createTransaction(amount, sessionId, buyOrder) {
  try {
    const response = await fetch(TRANSBANK_ENDPOINTS.createTransaction, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Tbk-Api-Key-Id': TRANSBANK_CONFIG.commerceCode,
        'Tbk-Api-Key-Secret': TRANSBANK_CONFIG.apiKey
      },
      body: JSON.stringify({
        buy_order: buyOrder,
        session_id: sessionId,
        amount: amount,
        return_url: TRANSBANK_CONFIG.returnUrl
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Error al crear transacción: ${JSON.stringify(error)}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error al crear transacción:', error);
    throw error;
  }
}

/**
 * Confirma una transacción en Transbank
 * @param {string} token - Token de la transacción
 * @returns {Promise<Object>} - Respuesta de Transbank con los detalles de la transacción
 */
export async function confirmTransaction(token) {
  try {
    const response = await fetch(TRANSBANK_ENDPOINTS.confirmTransaction(token), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Tbk-Api-Key-Id': TRANSBANK_CONFIG.commerceCode,
        'Tbk-Api-Key-Secret': TRANSBANK_CONFIG.apiKey
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Error al confirmar transacción: ${JSON.stringify(error)}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error al confirmar transacción:', error);
    throw error;
  }
}