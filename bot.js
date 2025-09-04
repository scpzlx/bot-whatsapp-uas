const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const fs = require('fs');

async function connectToWhatsApp() {
    if (!fs.existsSync('auth_info')) {
        fs.mkdirSync('auth_info');
    }

    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    
    const sock = makeWASocket({
        auth: state,
        browser: Browsers.ubuntu('Chrome'),
        printQRInTerminal: false
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            console.log('\n=== ESCANEA ESTE CÓDIGO QR CON WHATSAPP ===');
            qrcode.generate(qr, { small: true });
            console.log('============================================\n');
        }
        
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Conexión cerrada, intentando reconectar...');
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('¡Bot conectado correctamente a WhatsApp!');
            console.log('El bot está listo para recibir mensajes.');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
        if (type !== 'notify') return;

        const msg = messages[0];
        if (!msg.message || !msg.key.remoteJid || msg.key.fromMe) return;

        const messageText = msg.message.conversation || 
                           msg.message.extendedTextMessage?.text || '';
        const sender = msg.key.remoteJid;

        if (sender.includes('@g.us') || sender.includes('status')) return;

        console.log(`Mensaje recibido: ${messageText}`);

        if (messageText.toLowerCase() === 'hola' || messageText === '0') {
            await sock.sendMessage(sender, { 
                text: '¡Bienvenido al sistema de la escuela UAS! \n\nElige una opción:\n1. Horarios de clase\n2. Contacto administrativo\n3. Ubicación de la escuela\n4. Información de inscripciones\n\nResponde con el número de la opción que deseas.\n *[TODO ES UN EJEMPLO PARA TENER UNA BASE]*' 
            });
        }
        else if (messageText === '1') {
            await sock.sendMessage(sender, { 
                text: '*HORARIOS DE CLASE*\n\nLunes a Viernes:\n• [Ejemplo]: 7:00 am - 1:30 pm\n• [Ejemplo]: 7:30 am - 2:30 pm\n• [Ejemplo]: 8:00 am - 3:00 pm\n\n¿Necesitas algo más? Responde con el número 0 para volver al menú principal.' 
            });
        }
        else if (messageText === '2') {
            await sock.sendMessage(sender, { 
                text: '*CONTACTO ADMINISTRATIVO*\n\n• Dirección: [Se puede poner nombre de la directora/o]\n• Teléfono: +526677581400\n• Email: [poner email de la UAS]\n• Horario de atención: Lunes a Viernes de 7:00 a 19:00\n\n¿Necesitas algo más? Responde con el número 0 para volver al menú principal.' 
            });
        }
        else if (messageText === '3') {
            await sock.sendMessage(sender, { 
                text: '*UBICACIÓN DE LA ESCUELA*\n\nNos encontramos en:\nBlvd. Francisco Labastida Ochoa 2027-A\nDesarrollo Urbano Tres Ríos\nCuliacán Rosales, Sin., 80020\nMéxico\n\nhttps://maps.app.goo.gl/VUHcaQU3NBL66GkG9\n\n¿Necesitas algo más? Responde con el número 0 para volver al menú principal.' 
            });
        }
        else if (messageText === '4') {
            await sock.sendMessage(sender, { 
                text: '*INFORMACIÓN DE INSCRIPCIONES*\n\nRequisitos:\n• Acta de nacimiento\n• CURP\n• Cartilla de vacunación\n• Certificado médico\n• 4 fotografías infantiles\n\nProceso abierto todo el año.\n\n¿Necesitas algo más? Responde con el número 0 para volver al menú principal.' 
            });
        }
    });
}

process.on('uncaughtException', (err) => {
    console.log('Error no controlado:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.log('Promise rechazada:', promise, 'Razón:', reason);
});

connectToWhatsApp();
