package com.construction.defecttracker.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app.upload")
public class StorageProperties {

    /**
     * Folder location for storing files locally
     */
    private String dir = "./uploads/defects";

    /**
     * Storage type: 'local' or 's3'
     */
    private String type = "local";

    public String getDir() {
        return dir;
    }

    public void setDir(String dir) {
        this.dir = dir;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }
}
