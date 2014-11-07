Instalogger
======
Application for great working with logs 



    <appender name="INSTALOGGER" class="com.instalogger.log4j.InstaloggerAppender">
    </appender>

    <appender name="ASYNC_INSTALOGGER" class="org.apache.log4j.AsyncAppender">
        <param name="BufferSize" value="500"/>
        <appender-ref ref="INSTALOGGER"/>
    </appender>
