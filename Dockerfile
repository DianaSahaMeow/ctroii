# ==============================================================================
# СТРОЙКОНТРОЛЬ: Multi-Stage Dockerfile для сборки и запуска приложения
# ==============================================================================

# Этап 1: Сборка Maven
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /app

# Кэширование зависимостей
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Сборка приложения
COPY src ./src
RUN mvn clean package -DskipTests

# Этап 2: Финальный легковесный образ JRE
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Создание непривилегированного пользователя для безопасности
RUN useradd -m -u 1001 appuser && \
    mkdir -p /app/uploads/defects /app/data && \
    chown -R appuser:appuser /app

USER appuser

# Копирование собранного JAR
COPY --from=builder /app/target/defect-tracker-1.0.0.jar app.jar

# Переменные окружения по умолчанию
ENV PORT=8080 \
    SPRING_PROFILES_ACTIVE=postgres \
    UPLOAD_DIR=/app/uploads/defects

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
