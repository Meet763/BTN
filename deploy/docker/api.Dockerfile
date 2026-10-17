FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY backend/src/BTN.Core/BTN.Core.csproj BTN.Core/
COPY backend/src/BTN.Data/BTN.Data.csproj BTN.Data/
COPY backend/src/BTN.Business/BTN.Business.csproj BTN.Business/
COPY backend/src/BTN.API/BTN.API.csproj BTN.API/
RUN dotnet restore BTN.API/BTN.API.csproj

COPY backend/src/ .
RUN dotnet publish BTN.API/BTN.API.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080
ENTRYPOINT ["dotnet", "BTN.API.dll"]
