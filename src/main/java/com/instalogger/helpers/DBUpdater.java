package com.instalogger.helpers;

import com.google.common.base.Function;
import com.google.common.collect.Ordering;
import com.google.common.io.Files;
import com.google.common.io.Resources;

import java.io.File;
import java.net.URI;
import java.nio.charset.Charset;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.Arrays;
import java.util.List;

/**
 * Created with IntelliJ IDEA.
 * User: andreytsarevskiy
 * Date: 24/11/13
 * Time: 12:02
 * To change this template use File | Settings | File Templates.
 */
public class DBUpdater {

    protected Connection conn;

    public DBUpdater(Connection conn) {
        this.conn = conn;
    }

    public void create() throws Exception {
        conn.setAutoCommit(false);
        ResultSet resultSet =
                conn.prepareStatement("SELECT count(*) FROM information_schema.tables WHERE table_name = \'system\'").executeQuery();
        resultSet.next();
        Integer result = resultSet.getInt(1);
        boolean dbCreated = result == 1;

        if (!dbCreated) {
            URI scriptsUrl = Resources.getResource("db/scripts/00-system.sql").toURI();
            String script = Files.toString(new File(scriptsUrl), Charset.defaultCharset());
            conn.prepareCall(script).executeUpdate();
        }

        resultSet =
                conn.prepareStatement("SELECT value FROM system WHERE id = \'db_version\'").executeQuery();
        resultSet.next();
        Integer dbVersion = Integer.valueOf(resultSet.getString(1));

        URI scriptsUrl = Resources.getResource("db/scripts").toURI();
        File[] scripts = new File(scriptsUrl).listFiles();
        Function<File, String> getNameFunction = new Function<File, String>() {
            public String apply(File from) {
                return from.getName();
            }
        };
        List<File> orderedFiles = Ordering.natural().onResultOf(getNameFunction).
                sortedCopy(Arrays.asList(scripts));


        boolean dbVersionChanged = false;
        while (dbVersion < orderedFiles.size()) {
            String script = Files.toString(orderedFiles.get(dbVersion), Charset.defaultCharset());
            conn.prepareCall(script).executeUpdate();
            dbVersionChanged = true;
            dbVersion++;
        }

        if (dbVersionChanged) {
            PreparedStatement statement = conn.prepareStatement("UPDATE system SET value = ?" +
                    " WHERE id = \'db_version\'");
            statement.setString(1, dbVersion.toString());
            statement.executeUpdate();
        }
        conn.commit();
        conn.setAutoCommit(true);

    }

}
