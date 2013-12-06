package com.instalogger.helpers;

import org.postgresql.jdbc2.optional.SimpleDataSource;

import java.sql.SQLFeatureNotSupportedException;
import java.util.logging.Logger;

/**
 * Created with IntelliJ IDEA.
 * User: andreytsarevskiy
 * Date: 06/12/13
 * Time: 23:13
 * To change this template use File | Settings | File Templates.
 */
public class InstaDataSource extends SimpleDataSource {

    public InstaDataSource() {

    }

    public Logger getParentLogger() throws SQLFeatureNotSupportedException {
        return null;
    }
}
