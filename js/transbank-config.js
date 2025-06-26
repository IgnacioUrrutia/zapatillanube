// transbank-config.js - Versión para simulación local
// Esta versión usa una simulación local en lugar de conectarse al servidor de Transbank

// Credenciales de integración para ambiente de desarrollo (se mantienen para referencia)
export const TRANSBANK_CONFIG = {
  // Código de comercio para ambiente de desarrollo
  commerceCode: '597055555532',
  // Llave privada para ambiente de desarrollo
  apiKey: '579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C',
  // URL base para simulación local
  apiUrl: window.location.origin,
  // URL de retorno después de la transacción
  returnUrl: window.location.origin + '/transbank-return.html'
};

// Estados posibles de la transacción
export const TRANSACTION_STATUS = {
  AUTHORIZED: 'AUTHORIZED', // Transacción autorizada
  FAILED: 'FAILED',         // Transacción fallida
  PENDING: 'PENDING'        // Transacción pendiente
};

/**
 * Crea una nueva transacción en Transbank (simulada)
 * @param {number} amount - Monto a pagar
 * @param {string} sessionId - ID de sesión (puede ser el ID del usuario o un identificador único)
 * @param {string} buyOrder - Orden de compra (debe ser único)
 * @returns {Promise<Object>} - Respuesta simulada con el token y la URL
 */
export async function createTransaction(amount, sessionId, buyOrder) {
  try {
    console.log("Iniciando transacción simulada:");
    console.log(`- Monto: ${amount}`);
    console.log(`- ID de sesión: ${sessionId}`);
    console.log(`- Orden de compra: ${buyOrder}`);
    
    // Generar un token simulado
    const token = 'token-simulado-' + Math.random().toString(36).substring(2, 15);
    
    // URL de la página de simulación
    const url = `${window.location.origin}/transbank-simulation.html`;
    
    // Simular un pequeño retraso para que parezca una llamada real
    await new Promise(resolve => setTimeout(resolve, 800));
    
    console.log("Transacción simulada creada con éxito:");
    console.log(`- Token: ${token}`);
    console.log(`- URL: ${url}`);
    
    // Devolver respuesta simulada
    return {
      token: token,
      url: url
    };
  } catch (error) {
    console.error('Error al crear transacción simulada:', error);
    throw error;
  }
}

/**
 * Confirma una transacción en Transbank (simulada)
 * @param {string} token - Token de la transacción
 * @returns {Promise<Object>} - Respuesta simulada con los detalles de la transacción
 */
export async function confirmTransaction(token) {
  try {
    console.log(`Confirmando transacción simulada con token: ${token}`);
    
    // Simular un pequeño retraso para que parezca una llamada real
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Crear fecha actual formateada para accounting_date (MMDD)
    const now = new Date();
    const accountingDate = `${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
    
    console.log("Transacción simulada confirmada con éxito");
    
    // Devolver respuesta simulada
    return {
      vci: "TSY",
      amount: 10000,
      status: "AUTHORIZED",
      buy_order: "ordenCompra12345",
      session_id: "sesion1234557545",
      card_detail: {
        card_number: "XXXX-XXXX-XXXX-6623"
      },
      accounting_date: accountingDate,
      transaction_date: new Date().toISOString(),
      authorization_code: "1213",
      payment_type_code: "VN",
      response_code: 0,
      installments_number: 0
    };
  } catch (error) {
    console.error('Error al confirmar transacción simulada:', error);
    throw error;
  }
}