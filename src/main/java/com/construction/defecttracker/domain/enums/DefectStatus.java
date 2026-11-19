package com.construction.defecttracker.domain.enums;

public enum DefectStatus {
    NEW("НОВЫЙ"),
    IN_PROGRESS("В РАБОТЕ"),
    FIXED("ИСПРАВЛЕН"),
    ACCEPTED("ПРИНЯТ");

    private final String displayName;

    DefectStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
