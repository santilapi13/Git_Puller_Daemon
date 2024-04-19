const fs = require('fs');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');
const { spawn } = require('child_process');

const JSON_PATH = '/tmp/pid_daemon.json'

dotenv.config({
    path:"./.env",
    override:true
});

const PASS = process.env.PASS;
const EMAIL = process.env.EMAIL


// Funcion invocada por el padre
function daemonSkeleton(opt) {
    if (process.env.__daemon) {
        return process.pid;
    }

    let args = [].concat(process.argv);

    args.shift();  // Ignora el primer argumento (node)
    let script = args.shift();  // Se queda con el nombre del script

    opt = opt || {};
    let env = opt.env || process.env;

    env.__daemon = true;   // En vez de comparar los pid, le agregamos una variable al proceso para identificar al daemon
    daemon(script, args, opt);   // Se invoca a sí mismo como un daemon

    return process.exit();
}

// Donde se hace el fork
function daemon(script, args, opt) {
    opt = opt || {};

    let stdout = opt.stdout || 'ignore';
    let stderr = opt.stderr || 'ignore';

    let env = opt.env || process.env;
    let cwd = opt.cwd || process.cwd();

    let cp_opt = {
        stdio: ['ignore', stdout, stderr],
        env: env,
        cwd: cwd,
        detached: true
    };

    let child = spawn(process.execPath, [script].concat(args), cp_opt);

    child.unref();   // Se desliga del padre para ser hijo del proceso init

    return child;
}

function thereWereChanges(callback) {
    // Ejecuta el comando git pull en el directorio del repositorio
    const child = spawn('git', ['pull'], {
        cwd: process.argv[3],
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
                console.log('Cambios detectados en el repositorio: ', output);
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
        to: process.argv[4],
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
    }, 10000); // Ejecutar cada 10 segundos
}



if (process.argv.length != 5) {
    console.log("Usage: node index.js start|stop <repo directory> <notification_email>");
    process.exit(1);
}

async function stopInstance() {
    if (process.argv[2] === "stop") {
        const data = fs.readFileSync(JSON_PATH, 'utf8');
        let json = JSON.parse(data);

        const instanceIndex = json.instances.findIndex(instance => instance.repo_path === process.argv[3] && instance.email === process.argv[4]);

        if (instanceIndex !== -1) {
            const pid = json.instances[instanceIndex].pid;

            // Eliminar la instancia del arreglo
            json.instances.splice(instanceIndex, 1);

            // Escribir el JSON actualizado de vuelta al archivo
            fs.writeFileSync(JSON_PATH, JSON.stringify(json, null, 2), 'utf8');

            console.log(`Se ha eliminado la instancia con PID ${pid} del archivo JSON.`);

            // Matando el proceso
            const killedProcess = spawn('kill', [pid]);

            await new Promise((resolve, reject) => {
                killedProcess.on('exit', code => {
                    console.log("Proceso matado con código:", code);
                    resolve();
                });
            });
	    process.exit(0);
        } else {
            console.log("No se encontró ninguna instancia para detener.");
	    process.exit(1);
        }
    }
}

stopInstance().then(() => {
    daemonSkeleton();

    let json;
    if (!fs.existsSync(JSON_PATH)) {
        json = JSON.stringify({ instances: [] }, null, 2);
        fs.writeFileSync(JSON_PATH, json);
    }

    let data = fs.readFileSync(JSON_PATH, 'utf8');
    if (data.length === 0) {
        json = JSON.stringify({ instances: [] }, null, 2);
        data = json;
        fs.writeFileSync(JSON_PATH, json);
    }

    try {
        json = JSON.parse(data);
    } catch (error) {
        console.log("Error:" + error);
    }

    json.instances.push({
        repo_path: process.argv[3],
        email: process.argv[4],
        pid: process.pid
    });

    const newData = JSON.stringify(json, null, 2);
    fs.writeFileSync(JSON_PATH, newData, 'utf8');

    main();
});

