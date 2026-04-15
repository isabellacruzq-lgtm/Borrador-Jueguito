package org.valeneisa.network;

import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Scanner;

/**
 * Cliente para la comunicación con el backend PHP y MySQL.
 * Se encarga de la persistencia y el descubrimiento de pares (P2P).
 */
public class DatabaseClient {

    // IP de la PC 1 que tiene XAMPP corriendo
    private static final String BASE_URL = "http://10.103.195.102/celestial_fury/";

    public void registrarJugador(String nombre, String ip) {
        new Thread(() -> {
            try {
                String urlString = BASE_URL + "registrar_jugador.php?nombre=" + nombre + "&ip=" + ip;
                URL url = new URL(urlString);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("GET");
                Scanner sc = new Scanner(conn.getInputStream());
                if (sc.hasNext()) {
                    System.out.println("DB dice: " + sc.nextLine());
                }
                sc.close();
            } catch (Exception e) {
                System.err.println("No se pudo registrar en la DB: " + e.getMessage());
            }
        }).start();
    }

    public String obtenerIpEnemigo(String miNombre) {
        try {
            String urlString = BASE_URL + "obtener_rival.php?miNombre=" + miNombre;
            URL url = new URL(urlString);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(3000);
            Scanner sc = new Scanner(conn.getInputStream());
            if (sc.hasNextLine()) {
                String respuesta = sc.nextLine().trim();
                String ipEnemigo = respuesta.replace("Conectado con éxito", "").trim();
                return ipEnemigo;
            }
            sc.close();
        } catch (Exception e) {
            System.err.println("No se encontró rival en la red: " + e.getMessage());
        }
        return "0.0.0.0";
    }
}