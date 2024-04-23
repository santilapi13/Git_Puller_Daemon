# Integrantes
Santiago N. Lapiana

# Requisitos
node y npm

# Instalación
`npm install`
## Dependencias que instalará
- nodemailer
- dotenv
- syslog

# Configuración
Crear un archivo .env con las propiedades que dice el .env.sample. Para eso, el email tiene que tener una contraseña de aplicación para poder ser utilizado por nodemailer para enviar las notificaciones.

# Uso
`node index.js start|stop <directorio_repo> <email_a_notificar>`

Con start crea en /tmp/pid_daemon.json un diccionario que matchea el path del repositorio y el email con el PID del daemon que lo supervisa.
Con stop mata el proceso y eliminar la entrada del json.
