package com.instalogger.helpers;

import org.vertx.java.core.json.JsonObject;

/**
 * Created with IntelliJ IDEA.
 * User: andreytsarevskiy
 * Date: 24/11/13
 * Time: 12:03
 * To change this template use File | Settings | File Templates.
 */
public class Config {

    public int port = 18080;
    public String password = "root";
    public String database = "instalogger";
    public String user = "root";

    public static Config fromJson(JsonObject conf) {

        Config result = new Config();

        Integer port = conf.getInteger("port");

        if (port != null) {
            result.port = port;
        }

        JsonObject db = conf.getObject("db");

        if (db != null) {
            result.user = db.getString("user");
            result.password = db.getString("password");
            result.database = db.getString("database");
        }

        return result;
    }
}
