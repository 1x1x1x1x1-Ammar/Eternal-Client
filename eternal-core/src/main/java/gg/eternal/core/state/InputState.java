package gg.eternal.core.state;

import java.util.ArrayDeque;

public final class InputState {
    private static final boolean[] KEYS = new boolean[512];
    private static final boolean[] MOUSE = new boolean[16];
    private static final ArrayDeque<Long> LEFT = new ArrayDeque<>();
    private static final ArrayDeque<Long> RIGHT = new ArrayDeque<>();

    private InputState() {}

    public static void key(int key, boolean down) {
        if (key >= 0 && key < KEYS.length) KEYS[key] = down;
    }

    public static boolean keyDown(int key) {
        return key >= 0 && key < KEYS.length && KEYS[key];
    }

    public static void mouse(int button, boolean down) {
        if (button >= 0 && button < MOUSE.length) MOUSE[button] = down;
        if (!down) return;
        long now = System.currentTimeMillis();
        if (button == 0) LEFT.add(now);
        if (button == 1) RIGHT.add(now);
        trim(LEFT, now);
        trim(RIGHT, now);
    }

    public static boolean mouseDown(int button) {
        return button >= 0 && button < MOUSE.length && MOUSE[button];
    }

    private static void trim(ArrayDeque<Long> queue, long now) {
        while (!queue.isEmpty() && now - queue.peek() > 1000) queue.poll();
    }

    public static int leftCps() {
        trim(LEFT, System.currentTimeMillis());
        return LEFT.size();
    }

    public static int rightCps() {
        trim(RIGHT, System.currentTimeMillis());
        return RIGHT.size();
    }
}
