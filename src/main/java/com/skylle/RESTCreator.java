package com.skylle;

import com.skylle.helpers.JsonHelper;
import org.jooq.*;
import org.vertx.java.core.Handler;
import org.vertx.java.core.http.HttpServerRequest;
import org.vertx.java.core.http.RouteMatcher;

/**
 * Created with IntelliJ IDEA.
 * User: andreytsarevskiy
 * Date: 27/11/13
 * Time: 00:32
 * To change this template use File | Settings | File Templates.
 */
public class RESTCreator {

    protected RouteMatcher routeMatcher;

    protected DSLContext dslContext;

    public RESTCreator(RouteMatcher routeMatcher, DSLContext dslContext) {
        this.routeMatcher = routeMatcher;
        this.dslContext = dslContext;
    }


    public void createGetAll(final Table table, String url) {
        routeMatcher.get(url, new Handler<HttpServerRequest>() {
            @Override
            public void handle(HttpServerRequest event) {
                String result = JsonHelper.formatJSON(dslContext.select().from(table).fetch());
                event.response().setChunked(true);
                event.response().write(result);
                event.response().end();
                event.response().close();
            }
        });
    }

    public void createGet(final Table table, String url, final TableField field) {
        routeMatcher.get(url, new Handler<HttpServerRequest>() {
            @Override
            public void handle(HttpServerRequest request) {
                Result<Record> results = dslContext.select().from(table).
                        where(field.equal(Integer.valueOf(request.params().get("id")))).fetch();
                String result = "";
                if (results.size() == 1) {
                    result = JsonHelper.formatJSON(results.get(0));
                }
                request.response().setChunked(true);
                request.response().write(result);
                request.response().end();
                request.response().close();
            }
        });
    }
}
