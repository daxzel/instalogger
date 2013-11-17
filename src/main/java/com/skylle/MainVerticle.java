package com.skylle;


import org.jooq.*;
import org.jooq.impl.DSL;
import org.jooq.tools.json.JSONValue;
import org.vertx.java.core.Handler;
import org.vertx.java.core.buffer.Buffer;
import org.vertx.java.core.eventbus.EventBus;
import org.vertx.java.core.http.HttpServer;
import org.vertx.java.core.http.HttpServerRequest;
import org.vertx.java.core.http.RouteMatcher;
import org.vertx.java.core.json.JsonArray;
import org.vertx.java.core.json.JsonObject;
import org.vertx.java.core.sockjs.SockJSServer;
import org.vertx.java.platform.Verticle;

import java.sql.Connection;
import java.sql.DriverManager;
import java.text.SimpleDateFormat;
import java.util.*;

import static com.skylle.entities.generated.Tables.MESSAGE;


/*
 * This is a simple Java verticle which receives `ping` messages on the event bus and sends back `pong` replies
 *
 * @author <a href="http://tfox.org">Tim Fox</a>
 */
public class MainVerticle extends Verticle {

    SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");


    protected String formatJSON(Result<Record> result) {
        List<Map<String, Object>> list = new ArrayList<>();

        for (Record record : result) {
            Map<String, Object> jRecord = new HashMap<>();
            for (Field<?> field : result.fields()) {
                Object value = record.getValue(field);
                if (value instanceof Date) {
                    value = formatter.format(value);
                }
                jRecord.put(field.getName(), value);
            }
            list.add(jRecord);

        }
        return JSONValue.toJSONString(list);
    }

    public void start() {

        Connection conn;

        Integer port = container.config().getInteger("port");

        if (port == null) {
            port = 18080;
        }

        JsonObject db = container.config().getObject("db");

        String user;
        String password;
        String url;

        if (db != null) {
            user = db.getString("user");
            password = db.getString("password");
            url = db.getString("url");
        } else {
            user = "sa";
            password = "saPass1";
            url = "jdbc:postgresql://localhost/skylle";
        }

        try {
            Class.forName("org.postgresql.Driver").newInstance();
            conn = DriverManager.getConnection(url, user, password);
        } catch (Exception e) {
            // For the sake of this tutorial, let's keep exception handling simple
            e.printStackTrace();
            return;
        }

        final EventBus eventBus = vertx.eventBus();

        final DSLContext create = DSL.using(conn, SQLDialect.POSTGRES);


        RouteMatcher routeMatcher = new RouteMatcher();

        routeMatcher.get("/", new Handler<HttpServerRequest>() {
            @Override
            public void handle(HttpServerRequest event) {
                event.response().sendFile("index.html");
            }
        });

        routeMatcher.get("/messages", new Handler<HttpServerRequest>() {
            @Override
            public void handle(HttpServerRequest event) {
                String result = formatJSON(create.select().from(MESSAGE).fetch());
                event.response().setChunked(true);
                event.response().write(result);
                event.response().end();
                event.response().close();
            }
        });

        routeMatcher.delete("/messages/delete_all", new Handler<HttpServerRequest>() {
            @Override
            public void handle(HttpServerRequest event) {
                create.deleteQuery(MESSAGE).execute();
                event.response().end();
                event.response().close();
            }
        });

        routeMatcher.post("/message", new Handler<HttpServerRequest>() {
            @Override
            public void handle(final HttpServerRequest event) {
                event.bodyHandler(new Handler<Buffer>() {
                    @Override
                    public void handle(Buffer bufferEvent) {
                        Integer logLevel = Integer.valueOf(event.params().get("logLevel"));
                        String text = bufferEvent.toString();
                        JsonObject jsonObject = new JsonObject();
                        jsonObject.putString("text", text);
                        jsonObject.putNumber("log_level", logLevel);
                        jsonObject.putString("create_time", formatter.format(new Date()));
                        eventBus.publish("messageAdded", jsonObject);
                        create.insertInto(MESSAGE, MESSAGE.TEXT, MESSAGE.LOG_LEVEL).values(text, logLevel).execute();
                        event.response().setChunked(true);
                        event.response().write("ok");
                        event.response().end();
                        event.response().close();
                    }
                });

            }
        });

        routeMatcher.getWithRegEx("/static\\/.+", new Handler<HttpServerRequest>() {
            @Override
            public void handle(HttpServerRequest event) {
                event.response().sendFile(event.path().substring(1));
            }
        });

        HttpServer server = vertx.createHttpServer();

        server.requestHandler(routeMatcher);

        SockJSServer sockJSServer = vertx.createSockJSServer(server);
        JsonArray permitted = new JsonArray();
        permitted.add(new JsonObject());
        sockJSServer.bridge(new JsonObject().putString("prefix", "/eventbus"), permitted, permitted);

        server.listen(port, "localhost");

    }
}
