FROM maven:3.9.11-eclipse-temurin-21 AS build
WORKDIR /workspace

COPY pom.xml .
RUN mvn -q dependency:go-offline

COPY src ./src
RUN mvn -q -DskipTests package

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

COPY --from=build /workspace/target/*.jar /app/app.jar
COPY src/main/resources/static/brands /app/static/brands

ENTRYPOINT ["sh", "-c", "java -jar /app/app.jar"]