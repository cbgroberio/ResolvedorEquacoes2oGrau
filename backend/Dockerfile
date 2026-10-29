# Build stage: Java 21 + Maven
FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /workspace

COPY openapi ./openapi
COPY backend ./backend

WORKDIR /workspace/backend
RUN mvn clean package -DskipTests

# Runtime stage: Java 21 JRE
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /workspace/backend/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
