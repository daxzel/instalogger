package com.instalogger.idea;

import com.intellij.openapi.application.ApplicationManager;
import com.intellij.openapi.project.Project;
import com.intellij.openapi.project.ProjectManager;

/**
 * Created with IntelliJ IDEA.
 * User: andreytsarevskiy
 * Date: 07/12/13
 * Time: 14:08
 * To change this template use File | Settings | File Templates.
 */
class ShowExceptionInvokeServer extends NanoHTTPD {

    public ShowExceptionInvokeServer() {
        super(63330);
    }

    @Override
    public Response serve(HTTPSession session) {
        String file = session.getParms().get("file");
        String line = session.getParms().get("line");

        for (Project project : ProjectManager.getInstance().getOpenProjects()) {
            ShowExceptionInvokeAction openAction = new ShowExceptionInvokeAction(project, file, Integer.parseInt(line));
            ApplicationManager.getApplication().invokeLater(openAction);
        }
        Response response = new Response(Response.Status.OK, MIME_PLAINTEXT, "");

        response.addHeader("Access-Control-Allow-Origin", "*");
        response.addHeader("Access-Control-Allow-Credentials", "true");
        response.addHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, PUT, OPTIONS, HEAD");
        response.addHeader("Access-Control-Allow-Headers", "Content-Type, Accept, X-Requested-With");

        return response;
    }

}
