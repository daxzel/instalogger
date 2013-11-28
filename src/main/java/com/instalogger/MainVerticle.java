package com.instalogger;

import com.instalogger.helpers.Config;
import com.instalogger.helpers.DBUpdater;
import com.instalogger.helpers.JsonHelper;
import org.jooq.*;
import org.jooq.impl.DSL;
import org.vertx.java.core.Handler;
import org.vertx.java.core.VoidHandler;
import org.vertx.java.core.buffer.Buffer;
import org.vertx.java.core.eventbus.EventBus;
import org.vertx.java.core.eventbus.Message;
import org.vertx.java.core.http.HttpServer;
import org.vertx.java.core.http.HttpServerRequest;
import org.vertx.java.core.http.RouteMatcher;
import org.vertx.java.core.json.JsonObject;
import org.vertx.java.core.sockjs.SockJSServer;
import org.vertx.java.core.sockjs.SockJSSocket;
import org.vertx.java.platform.Verticle;

import java.sql.Connection;
import java.sql.DriverManager;
import java.text.SimpleDateFormat;
import java.util.Date;

import static com.instalogger.entities.generated.Tables.MESSAGE;
import static com.instalogger.entities.generated.Tables.SERVER;
import static com.instalogger.entities.generated.Tables.SETTING;

public class MainVerticle extends Verticle {

    SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");

    protected Integer BUFFER_SIZE = 100;

    public void start() {

        Connection conn;

        Config conf = Config.fromJson(container.config());

        try {
            Class.forName("org.postgresql.Driver").newInstance();
            conn = DriverManager.getConnection(conf.url, conf.user, conf.password);
        } catch (Exception e) {
            e.printStackTrace();
            return;
        }

        DBUpdater dbUpdater = new DBUpdater(conn);

        try {
            dbUpdater.create();
        } catch (Exception e) {
            e.printStackTrace();
            return;
        }


        final EventBus eventBus = vertx.eventBus();

        final DSLContext dslContext = DSL.using(conn, SQLDialect.POSTGRES);

        RouteMatcher routeMatcher = new RouteMatcher();

        RESTCreator creator = new RESTCreator(routeMatcher, dslContext);


        routeMatcher.get("/", new Handler<HttpServerRequest>() {
            @Override
            public void handle(HttpServerRequest event) {
                event.response().sendFile("index.html");
            }
        });

        creator.createGetAll(SETTING, "/settings");
        creator.createGetAll(SERVER, "/servers");

        creator.createGet(SERVER, "/server", SERVER.ID);


        routeMatcher.delete("/server", new Handler<HttpServerRequest>() {
            @Override
            public void handle(HttpServerRequest request) {
                String idParams = request.params().get("id");
                if (!idParams.equals("default")) {
                    DeleteQuery deleteQuery = dslContext.deleteQuery(SERVER);
                    deleteQuery.addConditions(SERVER.ID.equal(Integer.valueOf(idParams)));
                    deleteQuery.execute();
                } else {
                    DeleteQuery deleteQuery = dslContext.deleteQuery(MESSAGE);
                    deleteQuery.addConditions(MESSAGE.SERVER_ID.isNull());
                    deleteQuery.execute();
                }
                request.response().end();
                request.response().close();
            }
        });

        routeMatcher.get("/setting/:id", new Handler<HttpServerRequest>() {
            @Override
            public void handle(HttpServerRequest req) {
                Result<Record> settings = dslContext.select().from(SETTING).
                        where(SETTING.ID.equal(req.params().get("id"))).fetch();
                String result = "";
                if (settings.size() == 1) {
                    result = JsonHelper.formatJSON(settings.get(0));
                }

                req.response().setChunked(true);
                req.response().write(result);
                req.response().end();
                req.response().close();
            }
        });

        routeMatcher.get("/messages", new Handler<HttpServerRequest>() {
            @Override
            public void handle(HttpServerRequest event) {
                String offsetParam = event.params().get("offset");
                String serverIdParam = event.params().get("server_id");
                Integer offset = 0;
                Integer serverId = null;
                ShowLevelSettings showLevelSettings = new ShowLevelSettings(dslContext);
                if (offsetParam != null) {
                    offset = Integer.valueOf(offsetParam);
                }
                if (serverIdParam != null && !serverIdParam.equals("default")) {
                    serverId = Integer.valueOf(serverIdParam);
                }
                String result = JsonHelper.formatJSON(dslContext.select().from(MESSAGE)
                        .where(serverId != null ? MESSAGE.SERVER_ID.equal(serverId) : MESSAGE.SERVER_ID.isNull())
                        .and(MESSAGE.LOG_LEVEL.in(showLevelSettings.getShowingLevels()))
                        .orderBy(MESSAGE.ID.desc()).limit(offset, BUFFER_SIZE).fetch());
                event.response().setChunked(true);
                event.response().write(result);
                event.response().end();
                event.response().close();
            }
        });

        routeMatcher.delete("/messages/delete_all", new Handler<HttpServerRequest>() {
            @Override
            public void handle(HttpServerRequest event) {
                dslContext.deleteQuery(MESSAGE).execute();
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

                        String serverName = event.params().get("serverName");
                        Integer serverId = null;
                        if (serverName != null) {
                            Result<Record> servers = dslContext.select()
                                    .from(SERVER).where(SERVER.NAME.equal(serverName)).fetch();
                            if (servers.isEmpty()) {
                                dslContext.insertInto(SERVER, SERVER.NAME).values(serverName).execute();
                                servers = dslContext.select()
                                        .from(SERVER).where(SERVER.NAME.equal(serverName)).fetch();
                            }
                            serverId = servers.get(0).getValue(SERVER.ID);
                        }

                        Integer logLevel = Integer.valueOf(event.params().get("logLevel"));
                        short length = bufferEvent.getShort(0);
                        String text = bufferEvent.getString(2, length);
                        JsonObject jsonObject = new JsonObject();
                        jsonObject.putString("text", text);
                        jsonObject.putNumber("log_level", logLevel);
                        jsonObject.putString("create_time", formatter.format(new Date()));
                        jsonObject.putString("server_id", serverId != null ? serverId.toString() : null);
                        eventBus.publish("messageAdded", jsonObject);
                        dslContext.insertInto(MESSAGE, MESSAGE.TEXT, MESSAGE.LOG_LEVEL, MESSAGE.SERVER_ID)
                                .values(text, logLevel, serverId).execute();
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

        sockJSServer.installApp(new JsonObject().putString("prefix", "/eventbus"), new Handler<SockJSSocket>() {
            @Override
            public void handle(final SockJSSocket sock) {
                final ShowLevelSettings settings = new ShowLevelSettings(dslContext);

                sock.dataHandler(new Handler<Buffer>() {
                    @Override
                    public void handle(Buffer event) {
                        JsonObject json = new JsonObject(event.toString());
                        if (json.getString("command").equals("changeConfig")) {
                            Integer logLevel = json.getInteger("id");
                            boolean value = json.getBoolean("value");
                            if (value) {
                                settings.enableShowing(logLevel);
                            } else {
                                settings.disableShowing(logLevel);
                            }
                        }
                    }
                });

                eventBus.registerHandler("messageAdded", new Handler<Message>() {
                    @Override
                    public void handle(Message message) {
                        if (settings.needShow(((JsonObject) message.body()).getInteger("log_level"))) {
                            if (!sock.writeQueueFull()) {
                                sock.write(new Buffer(message.body().toString()));
                            } else {
                                sock.pause();
                                sock.drainHandler(new VoidHandler() {
                                    public void handle() {
                                        sock.resume();
                                    }
                                });
                            }
                        }
                    }
                });
            }
        });

        server.listen(conf.port, "localhost");
    }
}
