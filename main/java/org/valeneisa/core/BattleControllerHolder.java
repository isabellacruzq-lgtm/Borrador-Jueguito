package org.valeneisa.core;

public class BattleControllerHolder {

    private static BattleController instance;

    public static void set(BattleController controller) {
        instance = controller;
    }

    public static BattleController get() {
        return instance;
    }
}