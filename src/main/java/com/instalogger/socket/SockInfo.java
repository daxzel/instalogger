package com.instalogger.socket;

import org.vertx.java.core.shareddata.Shareable;
import org.vertx.java.core.sockjs.SockJSSocket;

/**
 * Created with IntelliJ IDEA.
 * User: andreytsarevskiy
 * Date: 01/12/13
 * Time: 22:01
 * To change this template use File | Settings | File Templates.
 */
public class SockInfo implements Shareable {

    protected SockJSSocket socket;

    protected ShowLevelSettings showLevelSettings;

    protected String searhTerm = null;

    public SockInfo(SockJSSocket socket, ShowLevelSettings showLevelSettings) {
        this.socket = socket;
        this.showLevelSettings = showLevelSettings;
    }

    public SockJSSocket getSocket() {
        return socket;
    }

    public void setSocket(SockJSSocket socket) {
        this.socket = socket;
    }

    public ShowLevelSettings getShowLevelSettings() {
        return showLevelSettings;
    }

    public void setShowLevelSettings(ShowLevelSettings showLevelSettings) {
        this.showLevelSettings = showLevelSettings;
    }

    public String getSearhTerm() {
        return searhTerm;
    }

    public void setSearhTerm(String searhTerm) {
        this.searhTerm = searhTerm;
    }
}
