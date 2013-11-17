package com.skylle.log4j;

import org.apache.log4j.AppenderSkeleton;
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
public class SkylleAppender extends AppenderSkeleton {


    protected String DEFAULT_SKYLLE_URL = "http://localhost:18080/";

    protected String skylleUrl = DEFAULT_SKYLLE_URL;

    public String getSkylleUrl() {
        return skylleUrl;
    }


    public void setSkylleUrl(String skylleUrl) {
        this.skylleUrl = skylleUrl;
    }

    public SkylleAppender() {
    }

    public SkylleAppender(String topicName) {
    }

    @Override
    protected void append(LoggingEvent event) {

        String logMessage = event.getRenderedMessage();
        try {


            URL serverAddress = new URL(skylleUrl + "message?logLevel=" + event.getLevel().toInt());

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
                wr.writeBytes(logMessage);

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