package com.construction.defecttracker.domain.enums;

public enum Urgency {
    LOW("НИЗКАЯ"),
    MEDIUM("СРЕДНЯЯ"),
    URGENT("СРОЧНО");

    private final String displayName;

    Urgency(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
