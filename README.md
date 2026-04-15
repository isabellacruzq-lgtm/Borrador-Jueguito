# 🌸 Celestial Fury

**Celestial Fury** es un videojuego de batalla por turnos desarrollado en Java, con una arquitectura híbrida que utiliza **UDP** para la comunicación entre jugadores y **MariaDB/PHP** para el sistema de matchmaking y registro.

---

## 🚀 Enlace al Código Fuente
Puedes encontrar el repositorio oficial aquí:
https://github.com/Valentina-O/celestya_fury.git

---

## 📜 Reglas del Juego
1. **Registro:** Cada jugador debe ingresar un nombre único para ser registrado en la base de datos central.
2. **Matchmaking:** El sistema buscará automáticamente un rival disponible en la red local.
3. **Turnos:** El juego es estrictamente por turnos. No puedes atacar si no es tu momento (Requisito 2.10).
4. **Victoria:** El primer jugador en reducir la vida (HP) del oponente a 0 gana la partida.
5. **Ataques:** Cada personaje tiene ataques básicos y habilidades especiales con diferentes niveles de daño.

---

## 🛠️ Tecnologías Utilizadas
- **Lenguaje:** Java 17 (Swing para la interfaz).
- **Sistema Operativo:** Arch Linux (Desarrollado con entorno nativo).
- **Base de Datos:** MariaDB (Gestionada a través de PHP).
- **Protocolo de Red:** UDP para la sincronización en tiempo real.
  Celestya_fury/
  ├── src/main/java/org/valeneisa/
  │   ├── core/                # Lógica central del juego (Cerebro)
  │   │   ├── Main.java        # Punto de entrada y Matchmaking
  │   │   ├── BattleController.java # Gestión de turnos y vida (HP)
  │   │   └── Player.java      # Clase modelo para los jugadores
  │   ├── network/             # Infraestructura de comunicación
  │   │   ├── UdpManager.java  # Envío y recepción de paquetes P2P
  │   │   └── DatabaseClient.java # Cliente para conectar con PHP/MariaDB
  │   ├── ui/                  # Interfaz Gráfica (Swing)
  │   │   └── GameWindow.java  # Ventana principal y renderizado
  │   └── patterns/            # Interfaces y protocolos de red
  ├── php/                     # Backend (Lado del servidor)
  │   ├── conexion.php         # Configuración de acceso a MariaDB
  │   ├── registrar_jugador.php # Registro de IP en la base de datos
  │   └── obtener_rival.php    # Lógica de emparejamiento
  ├── sql/                     # Scripts de Base de Datos
  │   └── setup.sql            # Creación de tablas y estructura
  ├── .gitignore               # Archivos excluidos de Git
  └── README.md                # Documentación del proyecto
---

## 🔧 Configuración del Entorno
Para ejecutar este proyecto en un entorno Linux:
1. Asegúrate de tener `mariadb` y `php` instalados.
2. Inicia el servidor de base de datos: `sudo systemctl start mariadb`.
3. Lanza el servidor de matchmaking: `php -S 127.0.0.1:8080`.
4. Ejecuta la clase `Main` desde IntelliJ IDEA.

---

## 👥 Equipo de Desarrollo
- **Valentina Ortiz Mendez** (Arquitectura de Red, Backend y Base de Datos)
- **Isabella** (Interfaz Gráfica y Diseño de Personajes)
- **Camilo** (Lógica de UI e Interacción)