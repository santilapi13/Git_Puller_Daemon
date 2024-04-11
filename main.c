#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <syslog.h>
#include <string.h>
#include <curl/curl.h>
#define MAX_LENGTH 250

// Estructura para almacenar el resultado de la solicitud CURL
struct MemoryStruct {
    char *memory;
    size_t size;
};

void skeleton_daemon();
size_t WriteMemoryCallback(void *contents, size_t size, size_t nmemb, void *userp);
void getLastTweet(char twitterUsername[], char currentTweet[]);
int tweetsAreEqual(char previousTweet[], char currentTweet[]);
void sendEmail(char currentTweet[], char twitterUsername[], char receiverEmail[]);

int main(int argc, char *argv[]) {
	if (argc != 3)
		return EXIT_FAILURE;

	//skeleton_daemon();

	//syslog(LOG_NOTICE, "Daemon started");

	char twitterUsername[MAX_LENGTH], receiverEmail[MAX_LENGTH];
	strcpy(twitterUsername, argv[1]);
	strcpy(receiverEmail, argv[2]);

	char previousTweet[MAX_LENGTH], currentTweet[MAX_LENGTH];
	/*
	while(1) {
		getLastTweet(twitterUsername, currentTweet);
		if (tweetsAreEqual(previousTweet, currentTweet))
			sendEmail(email, currentTweet);
		sleep(20);
	}
	*/
	//getLastTweet(twitterUsername, currentTweet);
	strcpy(currentTweet, "Que onda paaa");
	sendEmail(currentTweet, twitterUsername, receiverEmail);

	//syslog(LOG_NOTICE, "Daemon terminated");
	//closelog();

	return EXIT_SUCCESS;
}

void skeleton_daemon() {
	pid_t pid;
	pid = fork();

	if (pid < 0)
		exit(EXIT_FAILURE);
	if (pid > 0)
		exit(EXIT_SUCCESS);
	if (setsid() < 0)
		exit(EXIT_FAILURE);

	pid = fork();
	if (pid < 0)
		exit(EXIT_FAILURE);
	if (pid > 0)
		exit(EXIT_SUCCESS);

	umask(0);
	chdir("/");

	int x;
	for (x = sysconf(_SC_OPEN_MAX) ; x >= 0 ; x--)
		close(x);

	openlog("daemonSantiagoLapiana", LOG_PID, LOG_DAEMON);
}

// Función de escritura para CURLOPT_WRITEFUNCTION de cURL
size_t WriteMemoryCallback(void *contents, size_t size, size_t nmemb, void *userp) {
    size_t realsize = size * nmemb;
    struct MemoryStruct *mem = (struct MemoryStruct *)userp;

    mem->memory = realloc(mem->memory, mem->size + realsize + 1);
    if (mem->memory == NULL) {
        /* out of memory! */
        printf("not enough memory (realloc returned NULL)\n");
        return 0;
    }

    memcpy(&(mem->memory[mem->size]), contents, realsize);
    mem->size += realsize;
    mem->memory[mem->size] = 0;

    return realsize;
}

void getLastTweet(char twitterUsername[], char currentTweet[]) {
    CURL *curl_handle;
    CURLcode res;
    struct MemoryStruct chunk;

    chunk.memory = malloc(1);  /* will be grown as needed by realloc above */
    chunk.size = 0;    /* no data at this point */

    curl_global_init(CURL_GLOBAL_ALL);

    curl_handle = curl_easy_init();

    curl_easy_setopt(curl_handle, CURLOPT_URL, "https://twitter.com/santilapiana131");
    curl_easy_setopt(curl_handle, CURLOPT_WRITEDATA, (void *)&chunk);
    curl_easy_setopt(curl_handle, CURLOPT_WRITEFUNCTION, WriteMemoryCallback);

    res = curl_easy_perform(curl_handle);

    if (res != CURLE_OK)
        fprintf(stderr, "curl_easy_perform() failed: %s\n", curl_easy_strerror(res));
    else {
        // Buscar el último tweet en el HTML obtenido
        char *start_ptr, *end_ptr;
	start_ptr = strstr(chunk.memory, "html");
	chunk.memory[chunk.size] = '\0';
	printf("%s\n", chunk.memory);
	printf("El primer caracter es: %c\n", *start_ptr);
        if (start_ptr != NULL) {
            // Buscar el final del tweet
            end_ptr = strstr(start_ptr, "</article>");
            if (end_ptr != NULL) {
                // Copiar el contenido del tweet a currentTweet
                size_t tweet_length = end_ptr - start_ptr - 13; // -13 para excluir el inicio del tweet
                strncpy(currentTweet, start_ptr + 12, tweet_length); // +12 para incluir el inicio del texto del tweet
                currentTweet[tweet_length] = '\0'; // Asegurar que el string esté terminado
            }
        }
    }

    curl_easy_cleanup(curl_handle);
    free(chunk.memory);
    curl_global_cleanup();
}

int tweetsAreEqual(char previousTweet[], char currentTweet[]) {
	return 1;
}

void sendEmail(char currentTweet[], char twitterUsername[], char receiverEmail[]) {
    CURL *curl;
    CURLcode res = CURLE_OK;

    /* Inicializar curl */
    curl = curl_easy_init();
    if (curl) {
        // Configurar la URL del servidor SMTP de Gmail
        curl_easy_setopt(curl, CURLOPT_URL, "smtps://smtp.gmail.com:465");

        // Habilitar la autenticación SMTP
        curl_easy_setopt(curl, CURLOPT_USERNAME, "softwarelibreprueba@gmail.com");
        curl_easy_setopt(curl, CURLOPT_PASSWORD, "pfxq yodm ttym zrvs");

        /* Configurar el remitente y los destinatarios */
        struct curl_slist *recipients = NULL;
        recipients = curl_slist_append(recipients, receiverEmail);
        curl_easy_setopt(curl, CURLOPT_MAIL_RCPT, recipients);

        /* Configurar el cuerpo del mensaje */
	char message[MAX_LENGTH];
	strcpy(message, "From: softwarelibreprueba@gmail.com\r\n");
	strcat(message, "To: ");
	strcat(message, receiverEmail); 
	strcat(message, "\r\nSubject: Actualizacion daemon software libre\r\n\r\n");
	strcat(message, twitterUsername);
	strcat(message, " ha dicho:\n");
	strcat(message, currentTweet);
	printf("El mensaje a enviar es: \n%s\n\n", message);

	curl_easy_setopt(curl, CURLOPT_READDATA, message);

        /* Configurar el protocolo SMTP */
        curl_easy_setopt(curl, CURLOPT_USE_SSL, CURLUSESSL_ALL);
        curl_easy_setopt(curl, CURLOPT_MAIL_FROM, "softwarelibreprueba@gmail.com");

        /* Enviar el correo electrónico */
        res = curl_easy_perform(curl);

        /* Verificar el resultado, limpiar y cerrar */

        curl_easy_cleanup(curl);
    } else {
        fprintf(stderr, "Failed to initialize curl\n");
        res = CURLE_FAILED_INIT;
    }

    if (res == CURLE_OK) 
        printf("Correo electronico enviado correctamente\n");
    else
	printf("Error al enviar correo electronico: %s \n", curl_easy_strerror(res));
}