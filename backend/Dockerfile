# ===== STAGE 1: BUILD =====
FROM maven:3.9.9-eclipse-temurin-21 AS build

WORKDIR /app

# Copy pom first (for caching dependencies)
COPY pom.xml .
RUN mvn dependency:go-offline

# Copy source code
COPY src ./src

# Build jar
RUN mvn clean package -DskipTests

# ===== STAGE 2: RUN =====
FROM eclipse-temurin:21-jre-jammy

WORKDIR /app

# Copy jar from build stage
COPY --from=build /app/target/*.jar app.jar

# Expose port (Render uses 8080 by default)
EXPOSE 8080

# Run app
ENTRYPOINT ["java", "-jar", "app.jar"]