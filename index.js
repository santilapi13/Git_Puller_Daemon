const fs = require('fs');
const { spawn } = require('child_process');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');

if (process.argv.length != 3) {
    console.log("Usage: node index.js <notification_email>");
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

function sendEmail(transport, tweet) {
    transport.sendMail({
        from: EMAIL,
        to: process.argv[2],
        subject: "Notificación daemon",
        html: tweet
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
        tweet = `<h1> Prueba </h1>`
        sendEmail(transport, tweet);
    }, 10000); // Ejecutar cada 10 segundos
}

//skeletonDaemon();
main();
