package com.construction.defecttracker.domain.enums;

public enum Role {
    WORKER("Рабочий / Приемщик"),
    MANAGER("Руководитель / Начальник участка");

    private final String displayName;

    Role(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
