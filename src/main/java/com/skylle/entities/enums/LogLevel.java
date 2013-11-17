package com.skylle.entities.enums;

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
}
