package com.instalogger.entities.enums;

/**
 * Created with IntelliJ IDEA.
 * User: andreytsarevskiy
 * Date: 11/11/13
 * Time: 21:14
 * To change this template use File | Settings | File Templates.
 */
public enum  LogLevel {

    FATAL_INT(50000), ERROR_INT(40000), WARN_INT(30000),
    INFO_INT(20000), DEBUG_INT(10000);

    public final int value;

    private LogLevel(int value) {
        this.value = value;
    }

    public static LogLevel fromInteger(int level) {
        switch(level) {
            case 10000:
                return DEBUG_INT;
            case 20000:
                return INFO_INT;
            case 30000:
                return WARN_INT;
            case 40000:
                return ERROR_INT;
            case 50000:
                return FATAL_INT;
        }
        return null;
    }
}
