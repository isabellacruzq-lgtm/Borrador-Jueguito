package org.valeneisa.network;

import java.net.InetAddress;
import java.net.NetworkInterface;
import java.util.Enumeration;

/**
 * Utilidades de red para obtener información relacionada con la interfaz de red local.
 *
 * <p>Esta clase proporciona métodos para recuperar la dirección IP local de la máquina
 * en la que se ejecuta el programa. Se excluyen las direcciones de loopback y se priorizan
 * las direcciones IPv4.</p>
 *
 * @author TuNombre
 */
public class NetworkUtils {

    /**
     * Obtiene la dirección IP local de la máquina.
     *
     * <p>El método recorre todas las interfaces de red disponibles en el sistema y selecciona
     * la primera dirección IPv4 que no sea de loopback. Si no se encuentra ninguna dirección
     * válida, se devuelve la dirección por defecto {@code 127.0.0.1}.</p>
     *
     * @return La dirección IP local como {@code String}. Si no se encuentra ninguna dirección válida,
     *         retorna {@code "127.0.0.1"}.
     */
    public static String getLocalIp() {
        try {
            Enumeration<NetworkInterface> interfaces = NetworkInterface.getNetworkInterfaces();

            while (interfaces.hasMoreElements()) {
                NetworkInterface ni = interfaces.nextElement();

                // Se omiten interfaces que no estén activas o que sean de loopback
                if (!ni.isUp() || ni.isLoopback()) continue;

                Enumeration<InetAddress> addresses = ni.getInetAddresses();

                while (addresses.hasMoreElements()) {
                    InetAddress addr = addresses.nextElement();

                    // Se selecciona la primera dirección IPv4 que no sea de loopback
                    if (!addr.isLoopbackAddress() && addr.getHostAddress().contains(".")) {
                        return addr.getHostAddress();
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        // Dirección por defecto si no se encuentra ninguna válida
        return "127.0.0.1";
    }
}
