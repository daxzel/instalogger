package com.instalogger.socket;

import com.instalogger.entities.enums.LogLevel;
import org.jooq.DSLContext;
import org.jooq.Record;
import org.jooq.Result;

import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

import static com.instalogger.entities.generated.Tables.SETTING;

/**
 * Created with IntelliJ IDEA.
 * User: andreytsarevskiy
 * Date: 24/11/13
 * Time: 16:57
 * To change this template use File | Settings | File Templates.
 */
public class ShowLevelSettings {

    protected List<Integer> showLevelSettings;

    protected DSLContext context;

    public ShowLevelSettings(DSLContext context) {
        this.context = context;
        this.showLevelSettings = new ArrayList<>();
        showLevelSettings.add(LogLevel.DEBUG_INT.value);
        showLevelSettings.add(LogLevel.ERROR_INT.value);
        showLevelSettings.add(LogLevel.INFO_INT.value);
        showLevelSettings.add(LogLevel.WARN_INT.value);

        Result<Record> settings = context.select().from(SETTING).fetch();

        for (Record setting : settings) {
            Iterator<Integer> it = showLevelSettings.iterator();
            while (it.hasNext()) {
                Integer id = it.next();
                if (setting.getValue(SETTING.ID).equals(id.toString()) &&
                        setting.getValue(SETTING.VALUE).equals(Boolean.FALSE.toString())) {
                    it.remove();
                }
            }
        }
    }

    public boolean needShow(Integer level) {
        return showLevelSettings.contains(level);
    }

    public void disableShowing(Integer level) {
        if (showLevelSettings.contains(level)) {
            if (context.select(SETTING.ID).from(SETTING)
                    .where(SETTING.ID.equal(level.toString())).fetch().size() == 0) {
                context.insertInto(SETTING, SETTING.ID, SETTING.VALUE)
                        .values(level.toString(), Boolean.FALSE.toString()).execute();
            } else {
                context.update(SETTING).set(SETTING.VALUE,
                        Boolean.FALSE.toString()).where(SETTING.ID.equal(level.toString())).execute();
            }
            showLevelSettings.remove(level);
        }
    }

    public void enableShowing(Integer level) {
        if (!showLevelSettings.contains(level)) {
            if (context.select(SETTING.ID).from(SETTING)
                    .where(SETTING.ID.equal(level.toString())).fetch().size() == 0) {
                context.insertInto(SETTING, SETTING.ID, SETTING.VALUE)
                        .values(level.toString(), Boolean.TRUE.toString()).execute();
            } else {
                context.update(SETTING).set(SETTING.VALUE,
                        Boolean.TRUE.toString()).where(SETTING.ID.equal(level.toString())).execute();
            }
            showLevelSettings.add(level);
        }
    }

    public List<Integer> getShowingLevels() {
        return showLevelSettings;
    }

}
