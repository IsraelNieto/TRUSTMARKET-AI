document.addEventListener('DOMContentLoaded', () => {
    const chatButton = document.getElementById('chat-button');
    const chatWindow = document.getElementById('chat-window');
    const closeChatButton = document.getElementById('close-chat');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    const chatBody = document.getElementById('chat-body');

    // CONFIGURACIÓN DE N8N - REEMPLAZA CON TU URL DE WEBHOOK
    const N8N_WEBHOOK_URL = 'https://israelnr.app.n8n.cloud/webhook-test/AgenteAI'
    //const N8N_WEBHOOK_URL = 'https://israelnr.app.n8n.cloud/webhook-test/613850e3-5e9b-41ba-a69d-59c9a7340d86'; // ← Cambia esto por tu webhook real
    
    // ID único del usuario para la sesión
    const userId = 'user_' + Math.random().toString(36).substr(2, 9);
    
    // Estado del chat
    let isWaitingForResponse = false;

    // Muestra/oculta la ventana del chat al hacer clic en el botón flotante
    chatButton.addEventListener('click', () => {
        chatWindow.style.display = chatWindow.style.display === 'flex' ? 'none' : 'flex';
        if (chatWindow.style.display === 'flex') {
            chatInput.focus();
        }
    });

    // Cierra la ventana del chat al hacer clic en la X
    closeChatButton.addEventListener('click', () => {
        chatWindow.style.display = 'none';
    });

    // Función para agregar mensaje al chat
    function addMessage(message, isUser = false, isSystem = false) {
        const messageDiv = document.createElement('div');
        
        if (isSystem) {
            messageDiv.classList.add('message-system');
            messageDiv.innerHTML = `<em>${message}</em>`;
        } else if (isUser) {
            messageDiv.classList.add('message-user');
            messageDiv.textContent = message;
        } else {
            messageDiv.classList.add('message-bot');
            messageDiv.textContent = message;
        }
        
        chatBody.appendChild(messageDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
        return messageDiv;
    }

    // Función para enviar mensaje a n8n
    async function sendToN8N(message) {
        try {
            const response = await fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    userId: userId,
                    timestamp: new Date().toISOString(),
                    source: 'trustmarket_website',
                    userAgent: navigator.userAgent
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Diferentes formas de obtener la respuesta según cómo esté configurado tu n8n
            return data.response || 
                   data.reply || 
                   data.message || 
                   data.text || 
                   data.output ||
                   'Respuesta recibida correctamente';
                   
        } catch (error) {
            console.error('Error enviando mensaje a n8n:', error);
            
            // Mensaje de error personalizado según el tipo de error
            if (error.message.includes('Failed to fetch')) {
                return '🔄 No pude conectar con el servidor. Verifica tu conexión a internet y que el webhook de n8n esté activo.';
            } else if (error.message.includes('404')) {
                return '⚠️ El webhook de n8n no se encuentra. Verifica que la URL del webhook sea correcta.';
            } else if (error.message.includes('500')) {
                return '🛠️ Hay un problema en el servidor de n8n. El equipo técnico ha sido notificado.';
            } else {
                return '❌ Error temporal del chatbot. Por favor, intenta nuevamente en unos momentos.';
            }
        }
    }

    // Función principal para enviar mensajes
    async function sendMessage() {
        const message = chatInput.value.trim();
        
        if (message === '' || isWaitingForResponse) {
            return;
        }

        // Deshabilitar input mientras se procesa
        isWaitingForResponse = true;
        chatInput.disabled = true;
        sendButton.disabled = true;
        sendButton.textContent = '...';

        // Agregar mensaje del usuario
        addMessage(message, true);
        chatInput.value = '';

        // Mostrar indicador de "escribiendo"
        const typingIndicator = addMessage('🤖 Escribiendo...', false, true);

        try {
            // Enviar mensaje a n8n y obtener respuesta
            const botResponse = await sendToN8N(message);
            
            // Remover indicador de escritura
            chatBody.removeChild(typingIndicator);
            
            // Agregar respuesta del bot
            addMessage(botResponse, false);
            
        } catch (error) {
            // Remover indicador de escritura
            chatBody.removeChild(typingIndicator);
            
            // Mostrar mensaje de error
            addMessage('Lo siento, ocurrió un error inesperado. Por favor, intenta de nuevo.', false);
        }

        // Rehabilitar input
        isWaitingForResponse = false;
        chatInput.disabled = false;
        sendButton.disabled = false;
        sendButton.textContent = 'Enviar';
        chatInput.focus();
    }

    // Envía el mensaje al hacer clic en el botón de enviar
    sendButton.addEventListener('click', sendMessage);

    // Envía el mensaje al presionar 'Enter' en el teclado
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Función para testear la conexión con n8n
    function testN8NConnection() {
        if (N8N_WEBHOOK_URL.includes('TU_WEBHOOK_ID')) {
            console.warn('⚠️ TRUSTMARKET AI: Recuerda cambiar TU_WEBHOOK_ID por tu webhook real de n8n');
            addMessage('⚙️ Configuración: Webhook de n8n no configurado. Contacta al administrador.', false, true);
        }
    }

    // Test inicial cuando se carga la página
    setTimeout(testN8NConnection, 1000);

    // Función para manejar errores de conexión
    window.addEventListener('online', () => {
        addMessage('🟢 Conexión restaurada', false, true);
    });

    window.addEventListener('offline', () => {
        addMessage('🔴 Sin conexión a internet', false, true);
    });
});