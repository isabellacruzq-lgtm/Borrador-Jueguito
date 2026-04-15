package org.valeneisa.core;

import com.sun.net.httpserver.HttpServer;
import java.awt.Desktop;
import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

public class Main {
    public static void main(String[] args) throws IOException {
        // Working directory es: ...\celestya_fury1\src
        // Los archivos están en: ...\celestya_fury1\src\resources\static\
        String workDir = System.getProperty("user.dir");
        System.out.println("📁 Carpeta de trabajo detectada en: " + workDir);

        HttpServer server = HttpServer.create(new InetSocketAddress(8000), 0);

        server.createContext("/", exchange -> {
            String uriPath = exchange.getRequestURI().getPath();
            String targetFile = (uriPath.equals("/") || uriPath.isEmpty()) ? "index.html" : uriPath;
            if (targetFile.startsWith("/")) targetFile = targetFile.substring(1);

            // workDir ya ES la carpeta "src", así que buscamos directamente dentro de ella
            String[] carpetasBase = {
                    workDir + "/src/resources/static/",  // ← agrega esta línea
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
                System.err.println("❌ No encontré: /" + targetFile + " en " + workDir);
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
}
