package org.valeneisa.network;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.logging.Logger;

/**
 * DatabaseClient — Cliente HTTP para el backend PHP / MariaDB.
 *
 * Endpoints PHP esperados:
 *   POST /registrar_jugador.php   body: { "nombre": "...", "ip": "..." }
 *   GET  /obtener_rival.php       query: ?nombre=...
 *
 * Respuestas JSON esperadas:
 *   { "ok": true,  "mensaje": "Registrado correctamente" }
 *   { "ok": true,  "rival": { "nombre": "...", "ip": "..." } }
 *   { "ok": false, "error": "No hay rival disponible" }
 */
public class DatabaseClient {

    private static final Logger LOG = Logger.getLogger(DatabaseClient.class.getName());
    private static final int TIMEOUT_MS = 5000;

    private final String baseUrl;          // ej. "http://192.168.1.1:8080"
    private final ObjectMapper mapper = new ObjectMapper();

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    /**
     * @param baseUrl URL base del servidor PHP, sin barra final.
     *                Ejemplo: "http://192.168.1.1:8080"
     */
    public DatabaseClient(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    // -------------------------------------------------------------------------
    // API pública
    // -------------------------------------------------------------------------

    /**
     * Registra al jugador local en la base de datos y expone su IP para matchmaking.
     *
     * @param playerName Nombre único del jugador.
     * @param localIp    IP local del jugador (ej. "192.168.1.5").
     * @return true si el registro fue exitoso.
     */
    public boolean registerPlayer(String playerName, String localIp) {
        try {
            String body = mapper.writeValueAsString(
                    Map.of("nombre", playerName, "ip", localIp));

            Map<?, ?> resp = postJson("/registrar_jugador.php", body);
            boolean ok = Boolean.TRUE.equals(resp.get("ok"));
            if (ok) {
                LOG.info("[DB] Jugador registrado: " + playerName + " (" + localIp + ")");
            } else {
                LOG.warning("[DB] Error al registrar: " + resp.get("error"));
            }
            return ok;
        } catch (Exception e) {
            LOG.severe("[DB] registerPlayer falló: " + e.getMessage());
            return false;
        }
    }

    /**
     * Consulta el servidor de matchmaking en busca de un rival disponible.
     *
     * @param playerName Nombre del jugador local (para excluirse a sí mismo).
     * @return RivalInfo con nombre e IP del rival, o null si no hay rival.
     */
    public RivalInfo fetchRival(String playerName) {
        try {
            String   url  = baseUrl + "/obtener_rival.php?nombre=" + encode(playerName);
            Map<?,?> resp = getJson(url);

            if (Boolean.TRUE.equals(resp.get("ok"))) {
                Map<?,?> rival = (Map<?,?>) resp.get("rival");
                return new RivalInfo(
                        (String) rival.get("nombre"),
                        (String) rival.get("ip"));
            } else {
                LOG.info("[DB] Sin rival disponible: " + resp.get("error"));
                return null;
            }
        } catch (Exception e) {
            LOG.severe("[DB] fetchRival falló: " + e.getMessage());
            return null;
        }
    }

    // -------------------------------------------------------------------------
    // HTTP helpers
    // -------------------------------------------------------------------------

    private Map<?,?> postJson(String path, String jsonBody) throws IOException {
        URL url = new URL(baseUrl + path);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
        conn.setConnectTimeout(TIMEOUT_MS);
        conn.setReadTimeout(TIMEOUT_MS);
        conn.setDoOutput(true);

        try (OutputStream os = conn.getOutputStream()) {
            os.write(jsonBody.getBytes(StandardCharsets.UTF_8));
        }

        return readResponse(conn);
    }

    private Map<?,?> getJson(String fullUrl) throws IOException {
        URL url = new URL(fullUrl);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("GET");
        conn.setConnectTimeout(TIMEOUT_MS);
        conn.setReadTimeout(TIMEOUT_MS);
        return readResponse(conn);
    }

    private Map<?,?> readResponse(HttpURLConnection conn) throws IOException {
        int code = conn.getResponseCode();
        InputStream is = code >= 400 ? conn.getErrorStream() : conn.getInputStream();
        String json = new String(is.readAllBytes(), StandardCharsets.UTF_8);
        return mapper.readValue(json, Map.class);
    }

    private String encode(String s) {
        return java.net.URLEncoder.encode(s, StandardCharsets.UTF_8);
    }

    // -------------------------------------------------------------------------
    // Modelo de datos
    // -------------------------------------------------------------------------

    /** Contiene los datos del jugador rival obtenidos del matchmaking. */
    public record RivalInfo(String name, String ip) {
        @Override public String toString() {
            return "RivalInfo{name='" + name + "', ip='" + ip + "'}";
        }
    }
}
