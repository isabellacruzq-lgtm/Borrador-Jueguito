package org.valeneisa.patterns;

public interface INetworkObserver {
    // Se activa cuando llega un mensaje del otro jugador
    void onMessageReceived(String message);

}

