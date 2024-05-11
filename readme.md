# Git puller and notifier daemon
### EN 🇬🇧:
This daemon recieves a directory where a local git repository has been set and tries to git pull every 10 seconds. If that pull brings commits from its remote repository, an email is sent to the specified address. 
### EN 🇪🇸:
Este daemon recibe un directorio en donde el repositorio git local ya ha sido configurado e intenta hacer git pull cada 10 segundos. Si ese pull trae algún commit desde el repositorio remoto, se envía un email a la dirección de correo especificada.

# Requirements
- Linux distribution
- node
- npm

# Installation
`npm install`
## Dependencies
- nodemailer
- dotenv

# Configuration
### EN 🇬🇧:
First, you have to create a .env file with the properties listed in the .env.sample file. To do that, the specified email needs a application password to be used by nodemailer.
### ES 🇪🇸:
Crear un archivo .env con las propiedades que dice el .env.sample. Para eso, el email tiene que tener una contraseña de aplicación para poder ser utilizado por nodemailer para enviar las notificaciones.

# Usage
`node index.js start|stop <repo_directory> <email_to_notify>`
### EN 🇬🇧:
Start creates a dictionary at /tmp/pid_daemon.json that links the directory path to the email by the PID of the supervisor daemon.
Stop kills the daemon process and deletes its entry from the json.
### ES 🇪🇸:
Con start crea en /tmp/pid_daemon.json un diccionario que vincula el path del repositorio y el email con el PID del daemon que lo supervisa.
Con stop mata el proceso y eliminar la entrada del json.

# Daemonizer used
https://github.com/indexzero/daemon.node
