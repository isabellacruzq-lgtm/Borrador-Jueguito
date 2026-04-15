package org.valeneisa.ui;

import org.valeneisa.core.BattleController;
import org.valeneisa.core.Habilidad;
import org.valeneisa.core.HabilidadFactory;

import javax.swing.*;
import javax.swing.border.LineBorder;
import java.awt.*;
import java.awt.event.MouseAdapter;
import java.awt.event.MouseEvent;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Ventana principal de Celestial Fury con estética de Las Chicas Superpoderosas.
 */
public class GameWindow extends JFrame {

    private final BattleController battle;
    private JLabel labelStatus;
    private JPanel panelJuego;
    private final Map<String, JButton> botonesHabilidad = new HashMap<>();
    private static final String HABILIDAD_RAPIDA = "Golpe_Basico";

    // Paleta de Colores "Las Chicas Superpoderosas"
    private final Color COLOR_BOMBON = new Color(255, 182, 225);  // Rosa
    private final Color COLOR_BURBUJA = new Color(173, 216, 230); // Azul
    private final Color COLOR_BELLOTA = new Color(144, 238, 144); // Verde
    private final Color COLOR_FONDO_OSCURO = new Color(26, 26, 46); // Espacial

    public GameWindow(String nombreLocal, BattleController battle) {
        this.battle = battle;
        construirVentana(nombreLocal);
        setVisible(true);
    }

    private void construirVentana(String nombre) {
        setTitle("♡ CELESTIAL FURY ♡" + nombre);
        setSize(900, 700);
        setDefaultCloseOperation(EXIT_ON_CLOSE);
        setLayout(new BorderLayout());

        add(construirPanelEstado(), BorderLayout.NORTH);
        add(construirPanelJuego(),  BorderLayout.CENTER);
        add(construirPanelHabilidades(), BorderLayout.SOUTH);

        setLocationRelativeTo(null); // Centrar en pantalla
    }

    private JPanel construirPanelEstado() {
        labelStatus = new JLabel(obtenerTextoEstado(), SwingConstants.CENTER);
        // Usamos una fuente más gruesa y grande
        labelStatus.setFont(new Font("Arial", Font.ITALIC, 24));
        labelStatus.setForeground(COLOR_BOMBON);

        JPanel panel = new JPanel();
        panel.setBackground(Color.BLACK);
        panel.setBorder(BorderFactory.createMatteBorder(0, 0, 4, 0, Color.PINK));
        panel.add(labelStatus);
        return panel;
    }

    private JPanel construirPanelJuego() {
        panelJuego = new JPanel(new BorderLayout());
        panelJuego.setBackground(COLOR_FONDO_OSCURO);

        // Título de la Arena (Efecto Neon)
        JLabel arenaTitle = new JLabel("⚡ ARENA CELESTIAL ⚡", SwingConstants.CENTER);
        arenaTitle.setFont(new Font("Monospaced", Font.BOLD, 30));
        arenaTitle.setForeground(Color.WHITE);
        panelJuego.add(arenaTitle, BorderLayout.CENTER);

        panelJuego.addMouseListener(new MouseAdapter() {
            @Override
            public void mousePressed(MouseEvent e) {
                ejecutarHabilidadRapida();
            }
        });
        return panelJuego;
    }

    private JPanel construirPanelHabilidades() {
        // FlowLayout con más espacio entre los "botones flor"
        JPanel panel = new JPanel(new FlowLayout(FlowLayout.CENTER, 30, 25));
        panel.setBackground(Color.BLACK);
        panel.setBorder(BorderFactory.createTitledBorder(
                new LineBorder(Color.WHITE, 2), "☆ CONTROLES DE FLORES ☆",
                0, 0, null, Color.WHITE));

        List<Habilidad> habilidades = HabilidadFactory.crearHabilidades();
        for (Habilidad h : habilidades) {
            JButton btn = construirBotonHabilidad(h);
            botonesHabilidad.put(h.getNombre(), btn);
            panel.add(btn);
        }

        return panel;
    }

    private JButton construirBotonHabilidad(Habilidad habilidad) {
        // Asignamos el emoji/ícono según la habilidad
        String icono = switch (habilidad.getNombre()) {
            case "Llama" -> "🌸 ";
            case "Rayo"  -> "💧 ";
            default      -> "🍃 ";
        };

        JButton btn = new JButton(icono + habilidad.getEtiquetaUI().toUpperCase());
        btn.setFont(new Font("SansSerif", Font.BOLD, 15));
        btn.setForeground(Color.BLACK);
        btn.setBackground(resolverColorHabilidad(habilidad.getNombre()));

        // Estilo "Cartoon": Borde negro grueso y sin relieve de foco
        btn.setBorder(BorderFactory.createLineBorder(Color.BLACK, 4));
        btn.setFocusPainted(false);
        btn.setCursor(new Cursor(Cursor.HAND_CURSOR));
        btn.setPreferredSize(new Dimension(220, 60));

        btn.addActionListener(e -> manejarClicHabilidad(habilidad, btn));

        return btn;
    }

    private void manejarClicHabilidad(Habilidad habilidad, JButton btn) {
        if (!battle.isMiTurno()) {
            JOptionPane.showMessageDialog(this, "¡Espera el turno de tu heroína!");
            return;
        }

        if (!btn.isEnabled()) return;

        battle.realizarAtaque(habilidad.getDanio(), habilidad.getNombre());
        actualizarInterfaz();

        if (habilidad.getCooldownSegundos() > 0) {
            activarCooldown(btn, habilidad);
        }
    }

    private void activarCooldown(JButton btn, Habilidad habilidad) {
        btn.setEnabled(false);
        btn.setBackground(Color.GRAY); // Se pone gris mientras carga
        final int[] restantes = {habilidad.getCooldownSegundos()};
        final String etiquetaOriginal = btn.getText();

        Timer timer = new Timer(1000, null);
        timer.addActionListener(tick -> {
            restantes[0]--;
            if (restantes[0] <= 0) {
                btn.setText(etiquetaOriginal);
                btn.setBackground(resolverColorHabilidad(habilidad.getNombre()));
                btn.setEnabled(true);
                timer.stop();
            } else {
                btn.setText("CARGANDO... (" + restantes[0] + "s)");
            }
        });
        timer.start();
    }

    private void ejecutarHabilidadRapida() {
        if (!battle.isMiTurno()) return;

        HabilidadFactory.crearHabilidades().stream()
                .filter(h -> h.getNombre().equals(HABILIDAD_RAPIDA))
                .findFirst()
                .ifPresent(h -> {
                    battle.realizarAtaque(h.getDanio(), h.getNombre());
                    actualizarInterfaz();
                });
    }

    public void actualizarInterfaz() {
        SwingUtilities.invokeLater(() -> {
            if (battle.getMiVida() <= 0) {
                labelStatus.setText("☠️ DERROTA - MOJO JOJO GANÓ ☠️");
                labelStatus.setForeground(Color.RED);
                deshabilitarTodosLosBotones();
            } else {
                labelStatus.setText(obtenerTextoEstado());
                // Cambia color de vida si está baja
                if (battle.getMiVida() < 30) labelStatus.setForeground(Color.YELLOW);
            }
        });
    }

    private void deshabilitarTodosLosBotones() {
        botonesHabilidad.values().forEach(btn -> btn.setEnabled(false));
    }

    private String obtenerTextoEstado() {
        String turno = battle.isMiTurno() ? "TU TURNO" : "TURNO RIVAL";
        return "♥ VIDA: " + battle.getMiVida() + " | " + turno + " ♥";
    }

    private Color resolverColorHabilidad(String nombreHabilidad) {
        return switch (nombreHabilidad) {
            case "Llama" -> COLOR_BOMBON;
            case "Rayo"  -> COLOR_BURBUJA;
            default      -> COLOR_BELLOTA;
        };
    }
}