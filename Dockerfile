FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /src

COPY EvergreenNotes/EvergreenNotes.csproj EvergreenNotes/
COPY EvergreenNotes.Domain/EvergreenNotes.Domain.csproj EvergreenNotes.Domain/
COPY EvergreenNotes.Application/EvergreenNotes.Application.csproj EvergreenNotes.Application/
COPY EvergreenNotes.Infrastructure/EvergreenNotes.Infrastructure.csproj EvergreenNotes.Infrastructure/

RUN dotnet restore EvergreenNotes/EvergreenNotes.csproj

COPY . .

RUN dotnet build EvergreenNotes/EvergreenNotes.csproj -c Release -o /app/build

RUN dotnet publish EvergreenNotes/EvergreenNotes.csproj -c Release -o /app/publish /p:UseAppHost=false


FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final

WORKDIR /app

EXPOSE 8080
EXPOSE 8081

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "EvergreenNotes.dll"]
