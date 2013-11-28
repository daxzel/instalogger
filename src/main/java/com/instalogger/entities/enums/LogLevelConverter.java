package com.instalogger.entities.enums;

import org.jooq.impl.EnumConverter;

/**
 * Created with IntelliJ IDEA.
 * User: andreytsarevskiy
 * Date: 11/11/13
 * Time: 21:17
 * To change this template use File | Settings | File Templates.
 */
public class LogLevelConverter extends EnumConverter<Integer, LogLevel> {
    public LogLevelConverter() {
        super(Integer.class, LogLevel.class);
    }

    @Override
    public Integer to(LogLevel userObject) {
        if (userObject == null) {
            return null;
        }
        return userObject.value;
    }
}
