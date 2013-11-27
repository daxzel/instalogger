package com.skylle.helpers;

import org.jooq.Field;
import org.jooq.Record;
import org.jooq.Result;
import org.jooq.tools.json.JSONValue;

import java.text.SimpleDateFormat;
import java.util.*;

/**
 * Created with IntelliJ IDEA.
 * User: andreytsarevskiy
 * Date: 24/11/13
 * Time: 16:43
 * To change this template use File | Settings | File Templates.
 */
public class JsonHelper {

    protected static SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");

    public static String formatJSON(Result<Record> result) {
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

    public static String formatJSON(Record record) {

        Map<String, Object> jRecord = new HashMap<>();
        for (Field<?> field : record.fields()) {
            Object value = record.getValue(field);
            if (value instanceof Date) {
                value = formatter.format(value);
            }
            jRecord.put(field.getName(), value);
        }

        return JSONValue.toJSONString(jRecord);
    }
}
