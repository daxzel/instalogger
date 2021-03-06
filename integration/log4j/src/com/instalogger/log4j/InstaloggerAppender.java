package com.instalogger.log4j;

import org.apache.log4j.AppenderSkeleton;
import org.apache.log4j.Layout;
import org.apache.log4j.helpers.LogLog;
import org.apache.log4j.spi.LoggingEvent;

import java.io.DataOutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * Created with IntelliJ IDEA.
 * User: andreytsarevskiy
 * Date: 08/11/13
 * Time: 22:00
 * To change this template use File | Settings | File Templates.
 */
public class InstaloggerAppender extends AppenderSkeleton {


    protected String DEFAULT_SKYLLE_URL = "http://localhost:18080/";

    protected String instaloggerUrl = DEFAULT_SKYLLE_URL;

    protected String serverName = null;

    public String getServerName() {
        return serverName;
    }

    public void setServerName(String serverName) {
        this.serverName = serverName;
    }

    public String getInstaloggerUrl() {
        return instaloggerUrl;
    }

    public void setInstaloggerUrl(String instaloggerUrl) {
        this.instaloggerUrl = instaloggerUrl;
    }

    public InstaloggerAppender() {
    }

    public InstaloggerAppender(String topicName) {
    }

    @Override
    protected void append(LoggingEvent event) {

        String logMessage = event.getRenderedMessage();
        try {

            String url = instaloggerUrl + "message?logLevel=" + event.getLevel().toInt();
            if (serverName != null) {
                url += "&serverName=" + serverName;
            }

            URL serverAddress = new URL(url);

            HttpURLConnection connection = (HttpURLConnection) serverAddress.openConnection();

            try {

                connection = (HttpURLConnection) serverAddress.openConnection();
                connection.setRequestMethod("POST");
                connection.setReadTimeout(10000);

                connection.setUseCaches(false);
                connection.setDoInput(true);
                connection.setDoOutput(true);

                //Send request
                DataOutputStream wr = new DataOutputStream(
                        connection.getOutputStream());
                StringBuilder stringBuilder = new StringBuilder();
                stringBuilder.append(logMessage);

                String[] s = event.getThrowableStrRep();
                if (s != null) {
                    stringBuilder.append(Layout.LINE_SEP);
                    int len = s.length;
                    for (int i = 0; i < len; i++) {
                        stringBuilder.append(s[i]);
                        stringBuilder.append(Layout.LINE_SEP);
                    }
                }

                wr.writeUTF(stringBuilder.toString());

                wr.flush();
                wr.close();

                connection.connect();
                connection.getResponseCode();

            } catch (Exception ex) {
                LogLog.error("Error http", ex);
            } finally {

                if (connection != null) {
                    connection.disconnect();
                }
            }
        } catch (Exception ex) {
            LogLog.error("Error http", ex);
        }

    }

    @Override
    public void close() {

    }

    @Override
    public boolean requiresLayout() {
        return false;
    }
}