const fs = require('fs');
const { spawn } = require('child_process');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');

if (process.argv.length != 4) {
    console.log("Usage: node index.js <repo directory> <notification_email>");
    process.exit(1);
}

dotenv.config({
    path:"./.env",
    override:true
});
const PASS = process.env.PASS;
const EMAIL = process.env.EMAIL;

function skeletonDaemon() {
    const logFile = '/var/log/software_libre_daemon.log';

    const child = spawn(process.argv[0], process.argv.slice(1), {
        detached: true,
        stdio: ['ignore', fs.openSync(logFile, 'a+'), fs.openSync(logFile, 'a+')]
    });

    child.unref(); // Desvincular el proceso principal del hijo para que pueda ejecutarse independientemente
}

function thereWereChanges(callback) {
    // Ejecuta el comando git pull en el directorio del repositorio
    const child = spawn('git', ['pull'], {
        cwd: process.argv[2],
        stdio: 'pipe' // Redirige la salida estándar del proceso hijo (stdout)
    });

    // Captura la salida del comando git pull
    let output = '';
    child.stdout.on('data', (data) => {
        output += data.toString();
    });

    // Manejar la salida del comando git pull
    child.on('exit', (code) => {
        if (code === 0) {
            if (output.includes('Already up to date')) {
                console.log('No se detectaron cambios en el repositorio');
                callback(false);
            } else {
                console.log('Cambios detectados en el repositorio');
                callback(true);
            }
        } else {
            console.log('Error al ejecutar git pull');
            callback(false);
        }
    });
}

function sendEmail(transport) {
    transport.sendMail({
        from: EMAIL,
        to: process.argv[3],
        subject: "Notificación de actualización del repositorio",
        html: `<h1> git pull ejecutado con éxito. </h1>`
    }, (err, info) => {
        if (err) {
            console.error('Error al enviar el correo electrónico:', err);
        } else {
            console.log('Correo electrónico enviado:', info.response);
        }
    });
}

function main() {
    const transport = nodemailer.createTransport({
        service: 'gmail',
        port: 587,
        auth: {
            user: EMAIL,
            pass: PASS
        }
    });

    setInterval(() => {
        thereWereChanges((changesDetected) => {
            if (changesDetected)
                sendEmail(transport);
        });
    }, 5000); // Ejecutar cada 20 segundos
}

skeletonDaemon();
main();
