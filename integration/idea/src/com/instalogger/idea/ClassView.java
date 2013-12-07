package com.instalogger.idea;

import com.intellij.openapi.components.ApplicationComponent;
import com.intellij.openapi.diagnostic.Logger;
import org.jetbrains.annotations.NotNull;

/**
 * Created with IntelliJ IDEA.
 * User: andreytsarevskiy
 * Date: 07/12/13
 * Time: 11:06
 * To change this template use File | Settings | File Templates.
 */
public class ClassView implements ApplicationComponent {

    protected ShowExceptionInvokeServer server;

    protected static Logger log = Logger.getInstance(ClassView.class);

    public ClassView() {
    }

    public void initComponent() {
        server = new ShowExceptionInvokeServer();
        try {
            server.start();
        } catch (Exception ex) {
            log.error("Error in running installoger plugin server");
        }
    }

    public void disposeComponent() {
        if (server.wasStarted()) {
            server.stop();
        }
    }

    @NotNull
    public String getComponentName() {
        return "ClassView";
    }
}
