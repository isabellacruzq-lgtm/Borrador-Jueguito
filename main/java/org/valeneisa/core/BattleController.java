package org.valeneisa.core;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.valeneisa.network.UdpManager;

import java.util.Map;

/**
 * BattleController (PC1 — SERVIDOR)
 */
public class BattleController {

    private int miVida    = 100;
    private int vidaRival = 100;
    private boolean miTurno;

    private final ISoundPlayer soundPlayer;
    private final UdpManager   udpManager;
    private final ObjectMapper mapper = new ObjectMapper();

    public BattleController(boolean empiezoYo, ISoundPlayer soundPlayer, UdpManager udpManager) {
        this.miTurno     = empiezoYo;
        this.soundPlayer = soundPlayer;
        this.udpManager  = udpManager;
    }

    // -------------------------------------------------------------------------
    // ATAQUE LOCAL
    // -------------------------------------------------------------------------
    public void realizarAtaque(int danio, String nombreHabilidad) {
        if (!miTurno) {
            System.out.println("[BattleController] No es tu turno.");
            return;
        }

        udpManager.sendAttack(nombreHabilidad, danio);

        if (nombreHabilidad.equals("Golpe_Basico")) {
            soundPlayer.play("attack");
        } else {
            soundPlayer.play("special");
        }

        miTurno = false;

        System.out.println("[BattleController] PC1 atacó con " + nombreHabilidad
                + " (" + danio + " daño).");

        // 🔥 IMPORTANTE → enviar al frontend
        System.out.println("FRONT_ATTACK:" + danio);
    }

    // -------------------------------------------------------------------------
    // ATAQUE RECIBIDO
    // -------------------------------------------------------------------------
    public void procesarEntradaRival(String jsonMensaje) {

        if (jsonMensaje.contains("PING") || jsonMensaje.contains("PONG")) return;

        try {
            Map<String, Object> msg = mapper.readValue(jsonMensaje, Map.class);

            String type = String.valueOf(msg.getOrDefault("type", "")).toUpperCase();

            switch (type) {
                case "ATTACK" -> {

                    String habilidad = String.valueOf(msg.getOrDefault("attackId", "desconocida"));
                    int danio = ((Number) msg.getOrDefault("damage", 0)).intValue();

                    miVida -= danio;
                    miTurno = true;

                    System.out.println("[BattleController] Recibiste " + danio + " de " + habilidad);

                    // 🔥 CLAVE → mandar al frontend
                    System.out.println("FRONT_ATTACK:" + danio);

                    if (miVida <= 0) {
                        soundPlayer.play("defeat");
                        System.out.println("Derrotado");
                    } else {
                        soundPlayer.play("hit");
                    }
                }

                case "HP_UPDATE" -> {
                    int rivalHp = ((Number) msg.getOrDefault("rivalHp", vidaRival)).intValue();
                    vidaRival = rivalHp;
                }

                case "SURRENDER" -> {
                    soundPlayer.play("ganador");
                }

                default -> System.out.println("Mensaje ignorado: " + type);
            }

        } catch (Exception e) {
            System.err.println("Error parseando: " + jsonMensaje);
        }
    }

    public int     getMiVida()    { return miVida;    }
    public int     getVidaRival() { return vidaRival; }
    public boolean isMiTurno()    { return miTurno;   }
}