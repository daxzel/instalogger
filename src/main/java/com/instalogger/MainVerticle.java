package com.instalogger;

import com.instalogger.entities.generated.tables.records.MessageRecord;
import com.instalogger.entities.generated.tables.records.ServerRecord;
import com.instalogger.helpers.Config;
import com.instalogger.helpers.DBUpdater;
import com.instalogger.helpers.JsonHelper;
import com.instalogger.search.Searcher;
import com.instalogger.socket.ShowLevelSettings;
import com.instalogger.socket.SockInfo;
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
import org.vertx.java.core.json.JsonArray;
import org.vertx.java.core.json.JsonObject;
import org.vertx.java.core.sockjs.SockJSServer;
import org.vertx.java.core.sockjs.SockJSSocket;
import org.vertx.java.platform.Verticle;

import java.sql.Connection;
import java.sql.DriverManager;
import java.text.SimpleDateFormat;
import java.util.Date;

import static com.instalogger.entities.generated.Tables.*;

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

        final EventBus eventBus = vertx.eventBus();

        final Searcher searcher = new Searcher(eventBus);

        DBUpdater dbUpdater = new DBUpdater(conn);

        try {
            dbUpdater.create();
        } catch (Exception e) {
            e.printStackTrace();
            return;
        }

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
                DeleteQuery deleteQuery = dslContext.deleteQuery(SERVER);
                deleteQuery.addConditions(SERVER.ID.equal(Integer.valueOf(idParams)));
                deleteQuery.execute();
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
                Integer serverId = Integer.valueOf(serverIdParam);
                ShowLevelSettings showLevelSettings = new ShowLevelSettings(dslContext);
                if (offsetParam != null) {
                    offset = Integer.valueOf(offsetParam);
                }
                String result = JsonHelper.formatJSON(dslContext.select().from(MESSAGE)
                        .where(MESSAGE.SERVER_ID.equal(serverId))
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
                        Integer serverId;
                        if (serverName == null) {
                            serverName = "default";
                        }
                        Result<Record> servers = dslContext.select()
                                .from(SERVER).where(SERVER.NAME.equal(serverName)).fetch();
                        if (servers.isEmpty()) {
                            ServerRecord serverRecord = dslContext.insertInto(SERVER, SERVER.NAME)
                                    .values(serverName)
                                    .returning(SERVER.ID)
                                    .fetchOne();
                            serverId = serverRecord.getId();
                        } else {
                            serverId = servers.get(0).getValue(SERVER.ID);
                        }

                        Integer logLevel = Integer.valueOf(event.params().get("logLevel"));
                        short length = bufferEvent.getShort(0);
                        String text = bufferEvent.getString(2, length);

                        MessageRecord message = dslContext
                                .insertInto(MESSAGE, MESSAGE.TEXT, MESSAGE.LOG_LEVEL, MESSAGE.SERVER_ID)
                                .values(text, logLevel, serverId).returning(MESSAGE.ID).fetchOne();

                        JsonObject jsonMessage = new JsonObject();
                        jsonMessage.putString("text", text);
                        jsonMessage.putNumber("log_level", logLevel);
                        jsonMessage.putString("create_time", formatter.format(new Date()));
                        jsonMessage.putNumber("server_id", serverId);
                        jsonMessage.putNumber("id", message.getId());


                        eventBus.publish("messageAdded", jsonMessage);
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

        eventBus.registerHandler("refreshAll", new Handler<Message<String>>() {
            @Override
            public void handle(Message<String> message) {
                String sockJSId = message.body();
                Result<ServerRecord> result = dslContext.selectFrom(SERVER).fetch();
                for (ServerRecord serverRecord : result) {
                    JsonObject jsonObject = new JsonObject();
                    jsonObject.putString("sockJs", sockJSId);
                    jsonObject.putNumber("serverId", serverRecord.getId());
                    eventBus.send("refresh", jsonObject);
                }

            }
        });

        eventBus.registerHandler("refresh", new Handler<Message<JsonObject>>() {
            @Override
            public void handle(Message<JsonObject> message) {
                JsonObject request = message.body();
                Integer serverId = request.getNumber("serverId").intValue();
                String sockJSId = request.getString("sockJs");
                SockInfo sockInfo = (SockInfo) vertx.sharedData().getMap("sockSockets").get(sockJSId);

                SelectConditionStep selectConditionStep = dslContext.select().from(MESSAGE)
                        .where(MESSAGE.SERVER_ID.equal(serverId))
                        .and(MESSAGE.LOG_LEVEL.in(sockInfo.getShowLevelSettings().getShowingLevels()));

                try {
                    if (sockInfo.getSearhTerm() != null) {
                        selectConditionStep = selectConditionStep
                                .and(MESSAGE.ID.in(searcher.getResult(sockInfo.getSearhTerm(), serverId)));
                    }
                } catch (Exception ex) {
                    ex.printStackTrace();
                }

                String result = JsonHelper.formatJSON(selectConditionStep.orderBy(MESSAGE.ID.desc())
                        .limit(0, BUFFER_SIZE).fetch());

                JsonObject jsonResult = new JsonObject();
                jsonResult.putString("command", "refresh");
                JsonObject value = new JsonObject();
                value.putNumber("serverId", serverId);
                value.putArray("messages", new JsonArray(result));
                jsonResult.putObject("value", value);
                ((SockInfo) vertx.sharedData().getMap("sockSockets").get(sockJSId)).getSocket()
                        .write(new Buffer(jsonResult.toString()));
            }
        });


        sockJSServer.installApp(new JsonObject().putString("prefix", "/eventbus"), new Handler<SockJSSocket>() {


            @Override
            public void handle(final SockJSSocket sock) {

                final ShowLevelSettings settings = new ShowLevelSettings(dslContext);

                final SockInfo socketInfo = new SockInfo(sock, settings);

                vertx.sharedData().getMap("sockSockets").put(sock.writeHandlerID(), socketInfo);

                eventBus.registerHandler("messageAdded", new Handler<Message>() {
                    @Override
                    public void handle(Message message) {
                        JsonObject jsonMessage = (JsonObject) message.body();
                        if (settings.needShow(jsonMessage.getInteger("log_level"))) {
                            JsonObject result = new JsonObject();
                            result.putString("command", "sendMessage");
                            result.putObject("value", jsonMessage);

                            if (!sock.writeQueueFull()) {
                                sock.write(new Buffer(result.toString()));
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

                sock.dataHandler(new Handler<Buffer>() {
                    @Override
                    public void handle(Buffer event) {
                        JsonObject json = new JsonObject(event.toString());
                        switch (json.getString("command")) {
                            case "search":
                                String term = json.getString("term");
                                if (term != null && !term.isEmpty()) {
                                    socketInfo.setSearhTerm(term);
                                } else {
                                    socketInfo.setSearhTerm(null);
                                }
                                eventBus.send("refreshAll", sock.writeHandlerID());
                                break;
                            case "changeConfig":
                                if (json.getString("command").equals("changeConfig")) {
                                    Integer logLevel = json.getInteger("id");
                                    boolean value = json.getBoolean("value");
                                    if (value) {
                                        settings.enableShowing(logLevel);
                                    } else {
                                        settings.disableShowing(logLevel);
                                    }
                                    eventBus.send("refreshAll", sock.writeHandlerID());
                                }
                                break;
                        }
                    }
                });

            }
        });

        server.listen(conf.port, "localhost");
    }
}
