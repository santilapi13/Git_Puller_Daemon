# Requisitos
node y npm

# Instalación
`npm install`
## Dependencias que instalará
- nodemailer
- dotenv
- syslog

# Uso
`node index.js start|stop <directorio_repo> <email_a_notificar>`

Con start crea en /tmp/pid_daemon.json un diccionario que matchea el path del repositorio y el email con el PID del daemon que lo supervisa.
Con stop mata el proceso y eliminar la entrada del json.
