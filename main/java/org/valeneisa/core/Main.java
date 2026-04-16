package org.valeneisa.core;

import com.sun.net.httpserver.HttpServer;
import org.valeneisa.network.*;

import java.awt.Desktop;
import java.io.IOException;
import java.io.OutputStream;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.NetworkInterface;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Enumeration;

public class Main {

    public static void main(String[] args) throws IOException {

        // =========================
        // 🌐 1. DETECTAR MI IP
        // =========================
        String myIp = getLocalIp();
        System.out.println("🌐 Mi IP detectada: " + myIp);

        // =========================
        // 🔥 2. CONFIGURACIÓN
        // =========================
        String rivalIp = "10.103.195.21"; // 🔥 CAMBIA ESTO EN CADA PC
        int localUdpPort = 9877;
        int rivalUdpPort = 9876;

        System.out.println("🎯 Rival configurado: " + rivalIp);

        try {
            // =========================
            // 🔥 NETWORK BRIDGE (SIN WS)
            // =========================
            NetworkBridge bridge = new NetworkBridge(
                    localUdpPort,
                    rivalIp,
                    rivalUdpPort
            );

            bridge.start();
            System.out.println("🌐 Bridge UDP iniciado correctamente");

            // =========================
            // 🎮 BATTLE CONTROLLER
            // =========================
            ISoundPlayer soundPlayer = SoundManager.getInstance();

            BattleController controller = new BattleController(
                    true,
                    soundPlayer,
                    bridge.getUdpManager()
            );

            BattleControllerHolder.set(controller);

            // 🔗 CONECTAR UDP → CONTROLADOR
            bridge.onUdpEvent(controller::procesarEntradaRival);

            // =========================
            // 🧪 PRUEBA AUTOMÁTICA
            // =========================
            new Thread(() -> {
                try {
                    Thread.sleep(5000);
                    System.out.println("🔥 Enviando ataque de prueba...");
                    controller.realizarAtaque(20, "FUEGO");
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }).start();

        } catch (Exception e) {
            System.err.println("❌ Error iniciando NetworkBridge: " + e.getMessage());
        }

        // =========================
        // 🌐 4. SERVIDOR HTTP
        // =========================
        String workDir = System.getProperty("user.dir");
        System.out.println("📁 Carpeta de trabajo detectada en: " + workDir);

        HttpServer server = HttpServer.create(new InetSocketAddress(8000), 0);

        server.createContext("/", exchange -> {
            String uriPath = exchange.getRequestURI().getPath();
            String targetFile = (uriPath.equals("/") || uriPath.isEmpty()) ? "index.html" : uriPath;
            if (targetFile.startsWith("/")) targetFile = targetFile.substring(1);

            String[] carpetasBase = {
                    workDir + "/src/resources/static/",
                    workDir + "/resources/static/",
                    workDir + "/main/resources/static/",
                    workDir + "/resources/",
                    workDir + "/static/"
            };

            Path foundPath = null;
            for (String carpeta : carpetasBase) {
                Path p = Paths.get(carpeta + targetFile);
                if (Files.exists(p) && !Files.isDirectory(p)) {
                    foundPath = p;
                    break;
                }
            }

            if (foundPath != null) {
                byte[] content = Files.readAllBytes(foundPath);

                String contentType = "text/html";
                String name = foundPath.toString().toLowerCase();
                if      (name.endsWith(".css"))  contentType = "text/css";
                else if (name.endsWith(".js"))   contentType = "application/javascript";
                else if (name.endsWith(".png"))  contentType = "image/png";
                else if (name.endsWith(".svg"))  contentType = "image/svg+xml";
                else if (name.endsWith(".wav"))  contentType = "audio/wav";
                else if (name.endsWith(".json")) contentType = "application/json";
                else if (name.endsWith(".ico"))  contentType = "image/x-icon";

                exchange.getResponseHeaders().set("Content-Type", contentType + "; charset=UTF-8");
                exchange.sendResponseHeaders(200, content.length);

                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(content);
                }
            } else {
                exchange.sendResponseHeaders(404, 0);
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(("404 - Archivo no encontrado: " + targetFile).getBytes());
                }
            }

            exchange.close();
        });

        server.setExecutor(null);
        server.start();

        System.out.println("🚀 Servidor activo en http://localhost:8000");

        try {
            Desktop.getDesktop().browse(new URI("http://localhost:8000/"));
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    // =========================
    // 🔍 IP AUTOMÁTICA
    // =========================
    private static String getLocalIp() {
        try {
            Enumeration<NetworkInterface> interfaces = NetworkInterface.getNetworkInterfaces();
            while (interfaces.hasMoreElements()) {
                NetworkInterface ni = interfaces.nextElement();
                if (!ni.isUp() || ni.isLoopback()) continue;

                Enumeration<InetAddress> addresses = ni.getInetAddresses();
                while (addresses.hasMoreElements()) {
                    InetAddress addr = addresses.nextElement();
                    if (!addr.isLoopbackAddress() && addr.getHostAddress().contains(".")) {
                        return addr.getHostAddress();
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return "127.0.0.1";
    }
}